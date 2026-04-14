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
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRef, useState } from "react";
import { router } from "expo-router";
import OAuth from "@/components/OAuth";
import AppleAuth from "@/components/AppleAuth";
import { useSignUp, useAuth } from "@clerk/clerk-expo";
import { ReactNativeModal } from "react-native-modal";
import { fetchAPI } from "@/lib/fetch";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import * as Haptics from "expo-haptics";

const Sign_Up = () => {
  const { isLoaded, signUp, setActive } = useSignUp();
  const { getToken } = useAuth();
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const isDark = useColorScheme() === "dark";

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [verification, setVerification] = useState({
    state: "default",
    error: "",
    code: "",
  });

  const toggleShowPassword = () => setShowPassword(!showPassword);

  const onSignUpPress = async () => {
    if (!isLoaded) return;

    try {
      const [firstName, ...rest] = form.name.trim().split(" ");
      const lastName = rest.join(" ") || "";

      await signUp.create({
        emailAddress: form.email,
        password: form.password,
        firstName,
        lastName,
      });

      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });

      setVerification((prev) => ({
        ...prev,
        state: "pending",
        error: "",
        code: "",
      }));
    } catch (err: any) {
      console.log(JSON.stringify(err, null, 2));
      Alert.alert("Error", err.errors[0].longMessage);
    }
  };

  const onPressVerify = async () => {
    if (!isLoaded) return;

    try {
      const signUpAttempt = await signUp.attemptEmailAddressVerification({
        code: verification.code,
      });

      if (signUpAttempt.status === "complete") {
        await setActive({ session: signUpAttempt.createdSessionId });

        const token = await getToken();
        await fetchAPI("https://ec-ai.expo.app/user", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: form.name,
            email: form.email,
          }),
        });

        setVerification((prev) => ({ ...prev, state: "success" }));
      } else {
        setVerification((prev) => ({
          ...prev,
          error: "Verification Failed. Please try again.",
        }));
      }
    } catch (err: any) {
      setVerification((prev) => ({
        ...prev,
        error: err.errors[0].longMessage,
      }));
      Alert.alert("Error", err.errors[0].longMessage);
    }
  };

  const onResendCode = async () => {
    if (!isLoaded) return;

    try {
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setVerification((prev) => ({ ...prev, error: "" }));
      Alert.alert(
        "Success",
        "A new verification code has been sent to your email.",
      );
    } catch (err: any) {
      setVerification((prev) => ({
        ...prev,
        error: err.errors[0].longMessage,
      }));
    }
  };

  return (
    <KeyboardAwareScrollView
      style={{ flex: 1, backgroundColor: isDark ? "#121212" : "#F5F7FA" }}
      contentContainerStyle={{ paddingBottom: 40 }}
      keyboardShouldPersistTaps="handled"
      extraScrollHeight={20}
      scrollEnabled={true}
    >
      <View className="relative w-full h-[170px]">
        <Image
          source={images.icon}
          className="self-center mt-[70px]"
          style={{ width: 240, height: 60, resizeMode: "contain" }}
        />
        <Text
          className="text-2xl font-PoppinsBold absolute bottom-0 left-5"
          style={{ color: isDark ? "#fff" : "#000" }}
        >
          Create Your Account
        </Text>
      </View>

      <View className="p-5">
        <InputField
          label="Name"
          placeholder="Enter your name"
          icon={icons.person}
          textContentType="name"
          autoComplete="name"
          value={form.name}
          onChangeText={(value) =>
            setForm((previous) => ({ ...previous, name: value }))
          }
          onSubmitEditing={() => emailRef.current?.focus()}
        />
        <InputField
          label="Email"
          placeholder="Enter your email"
          textContentType="emailAddress"
          autoComplete="email"
          keyboardType="email-address"
          autoCapitalize="none"
          icon={icons.email}
          value={form.email}
          onChangeText={(value) =>
            setForm((previous) => ({ ...previous, email: value }))
          }
          ref={emailRef}
          onSubmitEditing={() => passwordRef.current?.focus()}
        />
        <View style={{ position: "relative" }}>
          <InputField
            label="Password"
            keyboardShouldPersistTaps="never"
            placeholder="Enter your password"
            icon={icons.lock}
            secureTextEntry={!showPassword}
            textContentType="newPassword"
            autoComplete="new-password"
            value={form.password}
            onChangeText={(value) =>
              setForm((previous) => ({ ...previous, password: value }))
            }
            ref={passwordRef}
            onSubmitEditing={() => {
              Keyboard.dismiss();
              onSignUpPress();
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
          title="Sign Up"
          onPress={async () => {
            await Haptics.selectionAsync();
            await onSignUpPress();
          }}
          className="mt-6"
        />

        <OAuth />
        <AppleAuth />

        <TouchableOpacity
          onPress={() => router.replace("/sign-in")}
          className="mt-5"
        >
          <Text
            className="text-base text-center"
            style={{ color: isDark ? "#ccc" : "#666" }}
          >
            Already have an account?{" "}
            <Text className="text-primary-500">Sign In</Text>
          </Text>
        </TouchableOpacity>
      </View>

      {/* VERIFICATION MODAL */}
      <ReactNativeModal
        backdropTransitionOutTiming={1}
        useNativeDriver={true}
        useNativeDriverForBackdrop={true}
        isVisible={verification.state === "pending"}
        style={{ justifyContent: "flex-start", marginTop: 130 }}
        onModalHide={() => {
          if (verification.state === "success") {
            Alert.alert(
              "Verified",
              "You have successfully verified your account.",
              [
                {
                  text: "Add Additional Details",
                  onPress: async () => {
                    await Haptics.selectionAsync();
                    router.replace("/(auth)/profile-setup");
                  },
                },
              ],
            );
          }
        }}
      >
        <View
          style={{
            backgroundColor: isDark ? "#1E1E1E" : "#fff",
            paddingHorizontal: 28,
            paddingVertical: 36,
            borderRadius: 16,
            minHeight: 300,
          }}
        >
          <TouchableOpacity
            onPress={() =>
              setVerification((prev) => ({
                ...prev,
                state: "default",
                code: "",
                error: "",
              }))
            }
            style={{ position: "absolute", top: 20, right: 20, zIndex: 1 }}
          >
            <MaterialCommunityIcons
              name="close"
              size={24}
              color={isDark ? "#fff" : "#000"}
            />
          </TouchableOpacity>

          <Text
            style={{
              fontSize: 22,
              color: isDark ? "#fff" : "#000",
              fontFamily: "Poppins-SemiBold",
              marginBottom: 10,
            }}
          >
            Verification
          </Text>
          <Text style={{ color: isDark ? "#ccc" : "#222", marginBottom: 10 }}>
            We've sent a verification code to{" "}
            <Text style={{ color: isDark ? "#7ABFFF" : "#2F4EBB" }}>
              {form.email}
            </Text>
          </Text>

          <InputField
            label="Code"
            textContentType="oneTimeCode"
            icon={icons.lock}
            placeholder="12345"
            autoFocus={true}
            value={verification.code}
            maxLength={6}
            keyboardType="numeric"
            onChangeText={(code) =>
              setVerification((prev) => ({ ...prev, code }))
            }
          />
          {verification.error && (
            <Text style={{ color: "red", fontSize: 13, marginTop: 4 }}>
              {verification.error}
            </Text>
          )}
          <CustomButton
            title="Verify Email"
            onPress={async () => {
              await Haptics.selectionAsync();
              await onPressVerify();
            }}
            className="mt-5 bg-primary-500"
          />
          <TouchableOpacity onPress={onResendCode} className="mt-3">
            <Text
              style={{ color: "#339DFF", textAlign: "center", marginTop: 10 }}
            >
              Resend Code
            </Text>
          </TouchableOpacity>
        </View>
      </ReactNativeModal>
    </KeyboardAwareScrollView>
  );
};

export default Sign_Up;
