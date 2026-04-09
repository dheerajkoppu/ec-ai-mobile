import { useUser, useClerk, useAuth } from "@clerk/clerk-expo";
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
import * as Linking from "expo-linking";
import * as ImagePicker from "expo-image-picker";
import CustomButton from "@/components/CustomButton";
import { confirmDestructiveAction } from "@/lib/confirmDestructiveAction";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system/legacy";
import { useRouter } from "expo-router";
import Purchases from "react-native-purchases";
import { PAYWALL_RESULT } from "react-native-purchases-ui";
import { fetchAPI } from "@/lib/fetch";
import * as Haptics from "expo-haptics";
import { presentPremiumPaywallIfNeeded } from "@/lib/premium";

const Profile = () => {
  const { user } = useUser();
  const { signOut } = useClerk();
  const { getToken } = useAuth();
  const isDark = useColorScheme() === "dark";

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

  const email = user?.primaryEmailAddress?.emailAddress;
  const [isPremium, setIsPremium] = useState(false);
  const downloadPDF = async (): Promise<boolean> => {
    try {
      const token = await getToken();
      const response = await fetchAPI(
        "https://ec-ai.expo.app/generate-activities-pdf",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response?.sent) {
        console.error("PDF/email failed:", response);
        if (response?.error === "No activities found") {
          Alert.alert(
            "No Activities",
            "You haven't added any activities yet. Please add activities before generating a PDF.",
          );
        } else {
          Alert.alert("Error", "Something went wrong generating your PDF.");
        }
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
      const token = await getToken();
      const response = await fetch("https://ec-ai.expo.app/exportdata", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
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
    try {
      const token = await getToken();
      const response = await fetch("https://ec-ai.expo.app/deleteuser", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({}),
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
      edges={["top", "left", "right"]}
      style={{
        flex: 1,
        backgroundColor: isDark ? "#121212" : "#F5F7FA",
        paddingHorizontal: 16,
        paddingTop: 24,
      }}
    >
      <ScrollView
        contentContainerStyle={{ paddingBottom: 24 }}
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
                const result = await presentPremiumPaywallIfNeeded();
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
                const result = await presentPremiumPaywallIfNeeded();
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
              confirmDestructiveAction({
                title: "Log Out",
                message: "Are you sure you want to log out?",
                confirmLabel: "Log Out",
                onConfirm: handleSignOut,
              });
            }}
            bgVariant="danger"
            className="mb-4 shadow-md"
          />

          <CustomButton
            title="Delete Account"
            onPress={async () => {
              await Haptics.selectionAsync();
              confirmDestructiveAction({
                title: "Delete Account",
                message:
                  "Are you sure you want to delete your account? This action cannot be undone.",
                onConfirm: deleteAccount,
              });
            }}
            className="shadow-md"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Profile;
