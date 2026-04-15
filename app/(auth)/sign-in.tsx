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
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { icons, images } from "@/constants";
import InputField from "@/components/InputField";
import CustomButton from "@/components/CustomButton";
import { useCallback, useRef, useState } from "react";
import { router } from "expo-router";
import OAuth from "@/components/OAuth";
import { useSignIn } from "@clerk/clerk-expo";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import AppleAuth from "@/components/AppleAuth";
import ResponsiveContainer from "@/components/ResponsiveContainer";
import { useResponsiveLayout } from "@/lib/responsive";

const Sign_In = () => {
  const isDark = useColorScheme() === "dark";
  const { isTablet, formMaxWidth } = useResponsiveLayout();
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
      } else {
        Alert.alert("Error", "Log in failed. Please try again.");
      }
    } catch (err: any) {
      Alert.alert("Error", err.errors[0].longMessage);
    }
  }, [isLoaded, signIn, form.email, form.password, setActive]);

  return (
    <View style={{ flex: 1, backgroundColor: isDark ? "#121212" : "#F5F7FA" }}>
      <KeyboardAwareScrollView
        keyboardShouldPersistTaps="handled"
        enableOnAndroid
        contentContainerStyle={{
          flexGrow: 1,
          paddingBottom: 40,
          justifyContent: isTablet ? "center" : undefined,
        }}
        style={{ flex: 1 }}
      >
        <ResponsiveContainer
          maxWidth={formMaxWidth}
          style={{ paddingHorizontal: isTablet ? 24 : 0 }}
        >
          <View
            style={{
              width: "100%",
              alignItems: "center",
              paddingTop: isTablet ? 52 : 72,
              paddingBottom: isTablet ? 28 : 20,
            }}
          >
            <Image
              source={images.icon}
              style={{
                width: isTablet ? 320 : 280,
                height: isTablet ? 80 : 70,
                resizeMode: "contain",
                alignSelf: "center",
              }}
            />
            <Text
              className="text-2xl font-PoppinsBold"
              style={{
                color: isDark ? "#fff" : "#000",
                marginTop: 20,
                alignSelf: "center",
              }}
            >
              Sign In
            </Text>
          </View>

          <View
            style={{
              paddingHorizontal: 20,
              paddingVertical: isTablet ? 28 : 0,
              borderRadius: isTablet ? 28 : 0,
              backgroundColor: isTablet
                ? isDark
                  ? "#161616"
                  : "#ffffff"
                : "transparent",
              borderWidth: isTablet ? 1 : 0,
              borderColor: isTablet
                ? isDark
                  ? "#27272a"
                  : "#e5e7eb"
                : "transparent",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 16 },
              shadowOpacity: isTablet ? (isDark ? 0.24 : 0.08) : 0,
              shadowRadius: isTablet ? 28 : 0,
              elevation: isTablet ? 6 : 0,
            }}
          >
            <InputField
              label="Email"
              returnKeyType="next"
              placeholder="Enter your email"
              icon={icons.email}
              keyboardShouldPersistTaps="never"
              value={form.email}
              textContentType="emailAddress"
              autoComplete="email"
              keyboardType="email-address"
              autoCapitalize="none"
              onSubmitEditing={() => passwordRef.current?.focus()}
              onChangeText={(value) =>
                setForm((previous) => ({ ...previous, email: value }))
              }
              containerStyle={
                isDark
                  ? { backgroundColor: "#1e1e1e", borderColor: "#374151" }
                  : undefined
              }
              inputStyle={isDark ? { color: "#ffffff" } : undefined}
            />

            <View style={{ position: "relative" }}>
              <InputField
                label="Password"
                keyboardShouldPersistTaps="never"
                placeholder="Enter your password"
                icon={icons.lock}
                secureTextEntry={!showPassword}
                value={form.password}
                textContentType="password"
                autoComplete="current-password"
                onChangeText={(value) =>
                  setForm((previous) => ({ ...previous, password: value }))
                }
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
            <AppleAuth />

            <TouchableOpacity
              onPress={() => router.replace("/sign-up")}
              className="mt-5"
            >
              <Text
                className="text-base text-center"
                style={{ color: isDark ? "#ccc" : "#666" }}
              >
                Don't have an account?{" "}
                <Text className="text-primary-500">Sign Up</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ResponsiveContainer>
      </KeyboardAwareScrollView>
    </View>
  );
};

export default Sign_In;
