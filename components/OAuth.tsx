import { useOAuth } from "@clerk/clerk-expo";
import { router } from "expo-router";
import { Alert, Image, Text, View } from "react-native";
import * as Haptics from "expo-haptics";
import * as WebBrowser from "expo-web-browser";
import CustomButton from "@/components/CustomButton";
import { icons } from "@/constants";
import { getOAuthRedirectUrl, googleOAuth } from "@/lib/auth";
import { useColorScheme } from "react-native";

WebBrowser.maybeCompleteAuthSession();

const OAuth = () => {
  const { startOAuthFlow } = useOAuth({ strategy: "oauth_google" });
  const isDark = useColorScheme() === "dark";

  const handleGoogleSignIn = async () => {
    const redirectUrl = getOAuthRedirectUrl();
    const result = await googleOAuth(() => startOAuthFlow({ redirectUrl }));

    if (result.code === "session_exists" || result.code === "success") {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      if (result.date) {
        const timeSinceSignIn = Date.now() - result.date;

        if (timeSinceSignIn < 5000) {
          router.replace("/(auth)/profile-setup");
          Alert.alert("Success", "Welcome! Let’s finish setting things up.");
          return;
        }
      }

      router.replace("/(root)/(tabs)/opportunity_match");
      Alert.alert("Success", result.message);
      return;
    }

    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    Alert.alert("Error", result.message);
  };

  return (
    <View>
      <View className="flex flex-row justify-center items-center mt-4 gap-x-3">
        <View className="flex-1 h-[1px] bg-general-100" />
        <Text className="text-lg" style={{ color: isDark ? "#fff" : "#000" }}>
          Or
        </Text>
        <View className="flex-1 h-[1px] bg-general-100" />
      </View>
      <CustomButton
        title="Log In with Google"
        className="mt-5 w-full shadow-none bg-primary-200 dark:bg-[#121212]"
        IconLeft={() => (
          <Image
            source={icons.google}
            resizeMode="contain"
            className="w-5 h-5 mx-2"
          />
        )}
        bgVariant="outline"
        textVariant="primary"
        onPress={handleGoogleSignIn}
      />
    </View>
  );
};

export default OAuth;
