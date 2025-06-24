import { useUser, useClerk } from "@clerk/clerk-expo";
import { useEffect, useState } from "react";
import * as WebBrowser from "expo-web-browser";
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  Alert,
  useColorScheme,
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
import * as Haptics from "expo-haptics";

const Profile = () => {
  const { user } = useUser();
  const { signOut } = useClerk();
  const isDark = useColorScheme() === "dark";

  useEffect(() => {
    (async () => {
      try {
        const customerInfo = await Purchases.getCustomerInfo();
        const hasPremium = !!customerInfo.entitlements.active["premium"];
        setIsPremium(hasPremium);
      } catch (error) {
        console.error("Failed to check premium status:", error);
      }
    })();
  }, []);

  useFocusEffect(
    useCallback(() => {
      (async () => {
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
      })();
    }, []),
  );

  const [imageUri, setImageUri] = useState(user?.imageUrl);
  const router = useRouter();

  useEffect(() => {
    setImageUri(user?.imageUrl);
  }, [user?.imageUrl]);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
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
        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success,
        );
      } catch (error) {
        console.error("Error updating profile image:", error);
      }
    }
  };

  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const email = user?.primaryEmailAddress?.emailAddress;
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const downloadPDF = async (): Promise<boolean> => {
    if (!email) {
      Alert.alert("Missing Email", "We couldn't find your account email.");
      return false;
    }

    try {
      // 0) Fetch user activities
      const activityRes = await fetch("https://ec-ai.expo.app/getactivities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const activityJson = await activityRes.json();
      const activities = activityJson.data;

      if (!Array.isArray(activities)) {
        console.error("Invalid activities array");
        Alert.alert("Error", "Failed to fetch valid activities.");
        return false;
      }
      if (activities.length === 0) {
        Alert.alert(
          "No Activities",
          "You haven't added any activities yet. Please add activities before generating a PDF.",
        );
        return false;
      }
      // 1) Generate the PDF
      const genRes = await fetchAPI(
        "https://ec-ai.expo.app/generate-activities-pdf",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, activities }),
        },
      );

      if (!genRes?.pdfBase64) {
        console.error("Invalid PDF response:", genRes);
        Alert.alert("Error", "PDF generation failed.");
        return false;
      }

      const { pdfBase64 } = genRes;

      // 2) Send the email
      const sendRes = await fetchAPI(
        "https://ec-ai.expo.app/send-activities-email",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, pdfBase64 }),
        },
      );

      if (!sendRes || sendRes.error) {
        console.error("Email send failed:", sendRes);
        return false;
      }
      return true;
    } catch (error) {
      console.error("PDF workflow error:", error);
      Alert.alert(
        "Error",
        "Something went wrong generating or sending your PDF.",
      );
      return false;
    }
  };
  const handleSignOut = async () => {
    try {
      await AsyncStorage.clear();
      await Purchases.logOut();
      await signOut();
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace("/(auth)/sign-in");
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
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success,
        );
        await Purchases.logOut();
        await signOut();
        router.replace("/");
      } else {
        const error = await response.json();
        console.error("Failed to delete account:", error);
      }
    } catch (err) {
      console.error("Delete account error:", err);
    }
  };

  return (
    <SafeAreaView
      className="flex-1 px-4 py-6 pb-10"
      style={{ backgroundColor: isDark ? "#121212" : "#F5F7FA" }}
    >
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
          <Text
            className="text-xl font-PoppinsSemiBold mt-2"
            style={{ color: isDark ? "#FFFFFF" : "#000000" }}
          >
            {user?.fullName}
          </Text>
          <Text className="text-[#5b55f7] text-base font-PoppinsRegular">
            {user?.primaryEmailAddress?.emailAddress}
          </Text>
        </View>

        <View
          className="p-4 mb-4 rounded-lg shadow-md"
          style={{ backgroundColor: isDark ? "#1E1E1E" : "#FFFFFF" }}
        >
          <Text
            className="text-xl font-semibold mb-2 font-PoppinsBold"
            style={{ color: isDark ? "#FFFFFF" : "#000000" }}
          >
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
                ) {
                  await Haptics.notificationAsync(
                    Haptics.NotificationFeedbackType.Success,
                  );
                  setIsPremium(true);
                }
              }
            }}
            className="w-auto p-1 rounded-lg mb-2 font-PoppinsRegular shadow-md"
          />
        </View>

        <View
          className="p-4 mb-4 rounded-lg shadow-md"
          style={{ backgroundColor: isDark ? "#1E1E1E" : "#FFFFFF" }}
        >
          <Text
            className="text-xl font-semibold mb-2 font-PoppinsBold"
            style={{ color: isDark ? "#FFFFFF" : "#000000" }}
          >
            Customization
          </Text>
          <CustomButton
            title="Update User Data"
            onPress={async () => {
              await Haptics.selectionAsync();
              router.replace("/(auth)/profile-setup?update=true");
            }}
            className="w-auto p-1 rounded-lg mb-2 font-PoppinsRegular shadow-md"
          />
        </View>

        <View
          className="p-4 mb-4 rounded-lg shadow-md"
          style={{ backgroundColor: isDark ? "#1E1E1E" : "#FFFFFF" }}
        >
          <Text
            className="text-xl font-semibold mb-2 font-PoppinsBold"
            style={{ color: isDark ? "#FFFFFF" : "#000000" }}
          >
            Account Settings
          </Text>
          <CustomButton
            title="Download Activities PDF"
            onPress={async () => {
              await Haptics.selectionAsync();
              if (isPremium) {
                Alert.alert(
                  "Sent PDF",
                  "Your activities PDF has been sent to your email.",
                );
                await downloadPDF();
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
                  await downloadPDF();
                  await Haptics.notificationAsync(
                    Haptics.NotificationFeedbackType.Success,
                  );
                }
              }
            }}
            className="w-auto p-1 rounded-lg mt-2 font-PoppinsRegular shadow-md"
          />
          <CustomButton
            title="Export Data"
            onPress={async () => {
              await Haptics.selectionAsync();
              await requestDataExport();
            }}
            className="w-auto p-1 rounded-lg mt-2 font-PoppinsRegular shadow-md"
          />
        </View>

        <View
          className="p-4 mb-4 rounded-lg shadow-md"
          style={{ backgroundColor: isDark ? "#1E1E1E" : "#FFFFFF" }}
        >
          <Text
            className="text-xl font-semibold mb-3 font-PoppinsBold"
            style={{ color: isDark ? "#FFFFFF" : "#000000" }}
          >
            Help & Support
          </Text>
          <CustomButton
            title="Contact Support"
            onPress={async () => {
              await Linking.openURL(
                "mailto:ask.ecai@gmail.com?subject=Support%20Inquiry",
              );
            }}
            className="w-auto p-1 rounded-lg mb-2 font-PoppinsRegular shadow-md"
          />
          <CustomButton
            title="Submit Feedback"
            onPress={async () => {
              await Linking.openURL(
                "mailto:ask.ecai@gmail.com?subject=Feedback",
              );
            }}
            className="w-auto p-1 rounded-lg font-PoppinsRegular shadow-md"
          />
        </View>

        {/* Legal Section */}
        <View
          className="p-4 mb-4 rounded-lg shadow-md"
          style={{ backgroundColor: isDark ? "#1E1E1E" : "#FFFFFF" }}
        >
          <Text
            className="text-xl font-semibold mb-3 font-PoppinsBold"
            style={{ color: isDark ? "#FFFFFF" : "#000000" }}
          >
            Legal
          </Text>
          <CustomButton
            title="Privacy Policy"
            onPress={async () => {
              await Haptics.selectionAsync();
              await WebBrowser.openBrowserAsync(
                "https://ec-ai.app/privacy-policy",
              );
            }}
            className="w-auto p-1 rounded-lg mb-2 font-PoppinsRegular shadow-md"
          />
          <CustomButton
            title="Terms of Use"
            onPress={async () => {
              await Haptics.selectionAsync();
              await WebBrowser.openBrowserAsync(
                "https://ec-ai.app/terms-of-use",
              );
            }}
            className="w-auto p-1 rounded-lg font-PoppinsRegular shadow-md"
          />
        </View>

        <View
          className="p-4 mb-4 rounded-lg shadow-md"
          style={{ backgroundColor: isDark ? "#1E1E1E" : "#FFFFFF" }}
        >
          <CustomButton
            title="Log Out"
            onPress={async () => {
              await Haptics.selectionAsync();
              setShowSignOutModal(true);
            }}
            bgVariant="danger"
            className="mb-4 shadow-md"
          />

          <CustomButton
            title="Delete Account"
            onPress={async () => {
              await Haptics.selectionAsync();
              setShowDeleteModal(true);
            }}
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
        <View
          className="px-7 py-9 rounded-2xl"
          style={{ backgroundColor: isDark ? "#1E1E1E" : "#FFFFFF" }}
        >
          <Text
            className="text-xl font-PoppinsSemiBold text-center mb-4"
            style={{ color: isDark ? "#FFFFFF" : "#000000" }}
          >
            Confirm Logout
          </Text>
          <Text
            className="text-base font-Poppins text-center mb-6"
            style={{ color: isDark ? "#FFFFFF" : "#000000" }}
          >
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
        <View
          className="px-7 py-9 rounded-2xl"
          style={{ backgroundColor: isDark ? "#1E1E1E" : "#FFFFFF" }}
        >
          <Text
            className="text-xl font-PoppinsSemiBold text-center mb-4"
            style={{ color: isDark ? "#FFFFFF" : "#000000" }}
          >
            Confirm Delete Account
          </Text>
          <Text
            className="text-base font-font-Poppins text-center mb-6"
            style={{ color: isDark ? "#FFFFFF" : "#000000" }}
          >
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
              onPress={async () => {
                setShowDeleteModal(false);
                await deleteAccount();
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
