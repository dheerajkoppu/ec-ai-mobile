import { useUser, useClerk } from "@clerk/clerk-expo";
import { useEffect, useState } from "react";
import * as WebBrowser from "expo-web-browser";
import {
  View,
  Text,
  Image,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import ReactNativeModal from "react-native-modal";
import * as Linking from "expo-linking";
import * as ImagePicker from "expo-image-picker";
import CustomButton from "@/components/CustomButton";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system";
import { useRouter } from "expo-router";
import Purchases from "react-native-purchases";
import RevenueCatUI, { PAYWALL_RESULT } from "react-native-purchases-ui";
import { fetchAPI } from "@/lib/fetch";

const Profile = () => {
  const { user } = useUser();
  const { signOut } = useClerk();
  const updateNotificationStatus = async (value: boolean) => {
    try {
      setNotifications(value);
      await fetch("https://ec-ai.expo.app/updatenotifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user?.primaryEmailAddress?.emailAddress,
          wants_notifications: value,
        }),
      });
    } catch (error) {
      console.error("Error updating notification status:", error);
      Alert.alert("Error", "Failed to update notification setting.");
    }
  };

  useEffect(() => {
    const checkPremiumStatus = async () => {
      try {
        const customerInfo = await Purchases.getCustomerInfo();
        const hasPremium = !!customerInfo.entitlements.active["premium"];
        setIsPremium(hasPremium);
      } catch (error) {
        console.error("Failed to check premium status:", error);
      }
    };
    checkPremiumStatus();
  }, []);
  useFocusEffect(
    useCallback(() => {
      const checkPremiumStatus = async () => {
        try {
          const customerInfo = await Purchases.getCustomerInfo();
          const hasPremium = !!customerInfo.entitlements.active["premium"];
          setIsPremium(hasPremium);
        } catch (error) {
          console.error(
            "Failed to check premium status (on screen focus):",
            error,
          );
        }
      };

      checkPremiumStatus();
    }, []),
  );

  const [imageUri, setImageUri] = useState(user?.imageUrl);
  const router = useRouter();

  useEffect(() => {
    setImageUri(user?.imageUrl);
  }, [user?.imageUrl]);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      const localUri = result.assets[0].uri;
      const base64Img = await FileSystem.readAsStringAsync(localUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const dataUrl = `data:image/jpeg;base64,${base64Img}`;

      try {
        const updatedImage = await user?.setProfileImage({ file: dataUrl });
        setImageUri(updatedImage?.publicUrl || dataUrl);
      } catch (error) {
        console.error("Error updating profile image:", error);
      }
    }
  };

  const [notifications, setNotifications] = useState(true);
  useEffect(() => {
    const fetchNotificationStatus = async () => {
      if (!user?.primaryEmailAddress?.emailAddress) return;

      try {
        const response = await fetch(
          "https://ec-ai.expo.app/getnotificationstatus",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: user.primaryEmailAddress.emailAddress,
            }),
          },
        );

        const data = await response.json();
        if (response.ok && data?.wants_notifications !== undefined) {
          setNotifications(data.wants_notifications);
        } else {
          console.warn("Could not fetch notifications setting:", data);
        }
      } catch (error) {
        console.error("Failed to load notification setting:", error);
      }
    };

    fetchNotificationStatus();
  }, [user?.primaryEmailAddress?.emailAddress]);

  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const email = user?.primaryEmailAddress?.emailAddress;
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const downloadPDF = async () => {
    if (email) {
      try {
        await fetchAPI("https://ec-ai.expo.app/activities-pdf", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
      } catch (error) {
        console.error("PDF download error:", error);
        Alert.alert(
          "Error",
          "Failed to generate and send your activities PDF.",
        );
      }
    } else {
      Alert.alert("Missing Email", "We couldn't find your account email.");
    }
  };
  const handleSignOut = async () => {
    try {
      await AsyncStorage.clear();
      await Purchases.logOut();
      await signOut();
      Linking.openURL(Linking.createURL("/"));
    } catch (err) {
      console.error("Error during logout:", err);
    }
  };

  const requestDataExport = async () => {
    if (!user?.primaryEmailAddress?.emailAddress) return;

    try {
      const response = await fetch("https://ec-ai.expo.app/exportdata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userEmail: user.primaryEmailAddress.emailAddress,
        }),
      });

      await response.json();
      if (response.ok) {
        Alert.alert(
          "Request Sent",
          "Your data request has been sent successfully.",
        );
      } else {
        Alert.alert("Error", "Failed to send export request.");
      }
    } catch (error) {
      Alert.alert("Error", "An unexpected error occurred.");
    }
  };

  const deleteAccount = async () => {
    if (!user?.primaryEmailAddress?.emailAddress) return;
    try {
      const response = await fetch("https://ec-ai.expo.app/deleteuser", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userEmail: user.primaryEmailAddress.emailAddress,
        }),
      });

      if (response.ok) {
        await Purchases.logOut();
        await signOut();
        Linking.openURL(Linking.createURL("/"));
      } else {
        const error = await response.json();
        console.error("Failed to delete account:", error);
      }
    } catch (err) {
      console.error("Delete account error:", err);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-primary-200 px-4 py-6 pb-10">
      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="items-center mb-6 relative">
          <View className="relative">
            <Image
              source={{ uri: imageUri }}
              className="w-24 h-24 rounded-full"
            />
            <TouchableOpacity
              onPress={pickImage}
              className="absolute bottom-0 right-0 bg-[#5b55f7] p-2 rounded-full shadow"
            >
              <Ionicons name="cloud-upload" size={18} color="white" />
            </TouchableOpacity>
          </View>
          <Text className="text-xl font-PoppinsSemiBold mt-2">
            {user?.fullName}
          </Text>
          <Text className="text-primary-900 text-base font-PoppinsRegular">
            {user?.primaryEmailAddress?.emailAddress}
          </Text>
        </View>

        <View className="bg-white p-4 mb-4 rounded-lg shadow-md">
          <Text className="text-xl font-semibold mb-2 font-PoppinsBold">
            Subscription Status
          </Text>
          <CustomButton
            title={isPremium ? "Premium" : "Subscribe to Premium"}
            onPress={async () => {
              if (!isPremium) {
                const result = await RevenueCatUI.presentPaywallIfNeeded({
                  requiredEntitlementIdentifier: "premium",
                });
                if (
                  [PAYWALL_RESULT.PURCHASED, PAYWALL_RESULT.RESTORED].includes(
                    result,
                  )
                )
                  setIsPremium(true);
              }
            }}
            className="w-auto p-1 rounded-lg mb-2 font-PoppinsRegular shadow-md"
          />
        </View>

        <View className="bg-white p-4 mb-4 rounded-lg shadow-md">
          <Text className="text-xl font-semibold mb-2 font-PoppinsBold">
            Customization
          </Text>
          <CustomButton
            title="Update User Data"
            onPress={() => router.replace("/(auth)/profile-setup?update=true")}
            className="w-auto p-1 rounded-lg mb-2 font-PoppinsRegular shadow-md"
          />
        </View>

        <View className="bg-white p-4 mb-4 rounded-lg shadow-md">
          <Text className="text-xl font-semibold mb-2 font-PoppinsBold">
            Account Settings
          </Text>
          <View className="flex-row justify-between py-2 font-PoppinsRegular">
            <Text className="text-lg font-PoppinsSemiBold mb-2">
              Notifications
            </Text>
            <Switch
              value={notifications}
              onValueChange={updateNotificationStatus}
            />
          </View>
          <CustomButton
            title="Export Data"
            onPress={requestDataExport}
            className="w-auto p-1 rounded-lg mt-2 font-PoppinsRegular shadow-md"
          />
          <CustomButton
            title="Download Activities PDF"
            onPress={async () => {
              if (isPremium) {
                Alert.alert(
                  "Sending PDF...",
                  "We're sending your activities PDF to your email now.",
                );
                downloadPDF();
              } else {
                const result = await RevenueCatUI.presentPaywallIfNeeded({
                  requiredEntitlementIdentifier: "premium",
                });
                if (
                  result === PAYWALL_RESULT.PURCHASED ||
                  result === PAYWALL_RESULT.RESTORED
                ) {
                  setIsPremium(true);
                  Alert.alert(
                    "Sending PDF...",
                    "We're sending your activities PDF to your email now.",
                  );
                  downloadPDF();
                }
              }
            }}
            className="w-auto p-1 rounded-lg mt-2 font-PoppinsRegular shadow-md"
          />
        </View>

        <View className="bg-white p-4 mb-4 rounded-lg shadow-md">
          <Text className="text-xl font-semibold mb-3 font-PoppinsBold">
            Help & Support
          </Text>
          <CustomButton
            title="Contact Support"
            onPress={() =>
              Linking.openURL(
                "mailto:ask.ecai@gmail.com?subject=Support%20Inquiry",
              )
            }
            className="w-auto p-1 rounded-lg mb-2 font-PoppinsRegular shadow-md"
          />
          <CustomButton
            title="Submit Feedback"
            onPress={() =>
              Linking.openURL("mailto:ask.ecai@gmail.com?subject=Feedback")
            }
            className="w-auto p-1 rounded-lg font-PoppinsRegular shadow-md"
          />
        </View>

        {/* Legal Section */}
        <View className="bg-white p-4 mb-4 rounded-lg shadow-md">
          <Text className="text-xl font-semibold mb-3 font-PoppinsBold">
            Legal
          </Text>
          <CustomButton
            title="Privacy Policy"
            onPress={() =>
              WebBrowser.openBrowserAsync(
                "https://ec-aiweb.vercel.app/privacy-policy",
              )
            }
            className="w-auto p-1 rounded-lg mb-2 font-PoppinsRegular shadow-md"
          />
          <CustomButton
            title="Terms of Use"
            onPress={() =>
              WebBrowser.openBrowserAsync(
                "https://ec-aiweb.vercel.app/terms-of-use",
              )
            }
            className="w-auto p-1 rounded-lg font-PoppinsRegular shadow-md"
          />
        </View>

        <View className="bg-white p-4 mb-4 rounded-lg shadow-md">
          <CustomButton
            title="Log Out"
            onPress={() => setShowSignOutModal(true)}
            bgVariant="danger"
            className="mb-4 shadow-md"
          />
          <CustomButton
            title="Delete Account"
            onPress={() => setShowDeleteModal(true)}
            className="shadow-md"
          />
        </View>
      </ScrollView>

      {/* Sign Out Confirmation Modal */}
      <ReactNativeModal
        useNativeDriver={true}
        backdropTransitionOutTiming={1}
        useNativeDriverForBackdrop={true}
        isVisible={showSignOutModal}
      >
        <View className="bg-white px-7 py-9 rounded-2xl">
          <Text className="text-xl font-PoppinsSemiBold text-center mb-4">
            Confirm Logout
          </Text>
          <Text className="text-base font-PoppinsSemiBold text-center mb-6">
            Are you sure you want to log out?
          </Text>
          <View className="flex-row justify-between">
            <CustomButton
              title="Cancel"
              onPress={() => setShowSignOutModal(false)}
              className="w-1/2 p-2 rounded-lg mr-2 font-PoppinsRegular shadow-md"
            />
            <CustomButton
              title="Logout"
              onPress={async () => {
                setShowSignOutModal(false);
                await handleSignOut();
              }}
              bgVariant="danger"
              className="w-1/2 p-2 rounded-lg ml-2 font-PoppinsRegular shadow-md"
            />
          </View>
        </View>
      </ReactNativeModal>

      {/* Delete Account Confirmation Modal */}
      <ReactNativeModal
        isVisible={showDeleteModal}
        backdropTransitionOutTiming={1}
        useNativeDriver={true}
        useNativeDriverForBackdrop={true}
      >
        <View className="bg-white px-7 py-9 rounded-2xl">
          <Text className="text-xl font-PoppinsSemiBold text-center mb-4">
            Confirm Delete Account
          </Text>
          <Text className="text-base font-PoppinsSemiBold text-center mb-6">
            Are you sure you want to delete your account? This action cannot be
            undone.
          </Text>
          <View className="flex-row justify-between">
            <CustomButton
              title="Cancel"
              onPress={() => setShowDeleteModal(false)}
              className="w-1/2 p-2 rounded-lg mr-2 font-PoppinsRegular shadow-md"
            />
            <CustomButton
              title="Delete"
              onPress={() => {
                setShowDeleteModal(false);
                deleteAccount();
              }}
              bgVariant="danger"
              className="w-1/2 p-2 rounded-lg ml-2 font-PoppinsRegular shadow-md"
            />
          </View>
        </View>
      </ReactNativeModal>
    </SafeAreaView>
  );
};

export default Profile;
