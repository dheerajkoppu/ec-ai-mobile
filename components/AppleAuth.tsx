import { useOAuth } from "@clerk/clerk-expo";
import { router } from "expo-router";
import { Alert, Image, Platform, View, useColorScheme } from "react-native";
import * as Haptics from "expo-haptics";
import * as WebBrowser from "expo-web-browser";
import CustomButton from "@/components/CustomButton";
import { icons } from "@/constants";
import { appleOAuth, getOAuthRedirectUrl } from "@/lib/auth";

WebBrowser.maybeCompleteAuthSession();

const AppleAuth = () => {
  const { startOAuthFlow } = useOAuth({ strategy: "oauth_apple" });
  const colorScheme = useColorScheme();

  if (Platform.OS !== "ios") {
    return null;
  }

  const handleAppleSignIn = async () => {
    const redirectUrl = getOAuthRedirectUrl();
    const result = await appleOAuth(() => startOAuthFlow({ redirectUrl }));

    if (result.code === "session_exists" || result.code === "success") {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      if (result.date && Date.now() - result.date < 5000) {
        router.replace("/(auth)/profile-setup");
        Alert.alert("Signed in", "Welcome! Let’s finish setting things up.");
        return;
      }

      router.replace("/(root)/(tabs)/opportunity_match");
      Alert.alert("Success", result.message);
      return;
    }

    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    Alert.alert("Sign-in Failed", result.message);
  };

  return (
    <View>
      <CustomButton
        title="Sign in with Apple"
        className={`mt-3 w-full shadow-none ${
          colorScheme === "dark" ? "bg-white border-black " : "bg-black"
        }`}
        textVariant={colorScheme === "dark" ? "black" : "white"}
        IconLeft={() => (
          <Image
            source={colorScheme === "dark" ? icons.appledark : icons.applelight}
            resizeMode="contain"
            className="w-8 h-8 mx-2"
          />
        )}
        onPress={handleAppleSignIn}
      />
    </View>
  );
};

export default AppleAuth;
