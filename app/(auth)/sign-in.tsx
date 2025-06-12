import {
  Image,
  View,
  Text,
  Alert,
  Keyboard,
  TextInput,
  TouchableOpacity,
  useColorScheme,
} from "react-native";
import { icons, images } from "@/constants";
import InputField from "@/components/InputField";
import CustomButton from "@/components/CustomButton";
import { useCallback, useRef, useState } from "react";
import { router } from "expo-router";
import OAuth from "@/components/OAuth";
import { useSignIn } from "@clerk/clerk-expo";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

const Sign_In = () => {
  const isDark = useColorScheme() === "dark";
  const [showPassword, setShowPassword] = useState(false);
  const toggleShowPassword = () => setShowPassword(!showPassword);

  const { signIn, setActive, isLoaded } = useSignIn();
  const passwordRef = useRef<TextInput>(null);
  const [form, setForm] = useState({ email: "", password: "" });

  const onSignInPress = useCallback(async () => {
    if (!isLoaded) return;

    try {
      const signInAttempt = await signIn.create({
        identifier: form.email,
        password: form.password,
      });

      if (signInAttempt.status === "complete") {
        await setActive({ session: signInAttempt.createdSessionId });
        router.replace("/(root)/(tabs)/opportunity_match");
        // Navigate to main screen on success
      } else {
        console.log(JSON.stringify(signInAttempt, null, 2));
        Alert.alert("Error", "Log in failed. Please try again.");
      }
    } catch (err: any) {
      console.log(JSON.stringify(err, null, 2));
      Alert.alert("Error", err.errors[0].longMessage);
      // Show Clerk-provided error
    }
  }, [isLoaded, signIn, form.email, form.password, setActive]);

  return (
    <View style={{ flex: 1, backgroundColor: isDark ? "#121212" : "#F5F7FA" }}>
      <View className="flex-1">
        <View className="relative w-full h-[250px]">
          <Image
            source={images.icon}
            className="self-center mt-[90px]"
            style={{ width: 280, height: 70, resizeMode: "contain" }}
          />
          <Text
            className="text-2xl font-PoppinsBold absolute bottom-0 left-5"
            style={{ color: isDark ? "#fff" : "#000" }}
          >
            Sign In
          </Text>
        </View>

        <View className="p-5">
          <InputField
            label="Email"
            returnKeyType="next"
            placeholder="Enter your email"
            icon={icons.email}
            keyboardShouldPersistTaps="never"
            value={form.email}
            onSubmitEditing={() => passwordRef.current?.focus()}
            onChangeText={(value) => setForm({ ...form, email: value })}
            containerStyle={isDark ? "bg-[#1e1e1e] border-gray-700" : ""}
            inputStyle={isDark ? "text-white" : ""}
          />

          <View style={{ position: "relative" }}>
            <InputField
              label="Password"
              keyboardShouldPersistTaps="never"
              placeholder="Enter your password"
              icon={icons.lock}
              secureTextEntry={!showPassword}
              value={form.password}
              onChangeText={(value) => setForm({ ...form, password: value })}
              ref={passwordRef}
              onSubmitEditing={() => {
                Keyboard.dismiss();
                onSignInPress();
              }}
              returnKeyType="go"
            />
            <TouchableOpacity
              onPress={toggleShowPassword}
              style={{ position: "absolute", right: 15, top: 62 }}
            >
              <MaterialCommunityIcons
                name={showPassword ? "eye-off" : "eye"}
                size={24}
                color={isDark ? "#ccc" : "#888"}
              />
            </TouchableOpacity>
          </View>

          <CustomButton
            title="Sign In"
            onPress={async () => {
              await Haptics.selectionAsync();
              await onSignInPress();
            }}
            className="mt-6"
          />

          <OAuth />

          <TouchableOpacity
            onPress={() => router.replace("/sign-up")}
            className="mt-5"
          >
            <Text
              className="text-base text-center"
              style={{ color: isDark ? "#ccc" : "#666" }}
            >
              Don't have an account?{" "}
              <Text style={{ color: "#5b55f6" }}>Sign Up</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default Sign_In;
