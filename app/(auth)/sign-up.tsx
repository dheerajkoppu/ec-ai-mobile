import {
  Image,
  View,
  Text,
  Alert,
  Platform,
  Keyboard,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { icons, images } from "@/constants";
import InputField from "@/components/InputField";
import CustomButton from "@/components/CustomButton";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRef, useState } from "react";
import { Link, router } from "expo-router";
import OAuth from "@/components/OAuth";
import { useSignUp } from "@clerk/clerk-expo";
import { ReactNativeModal } from "react-native-modal";
import { fetchAPI } from "@/lib/fetch";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

const Sign_Up = () => {
  const { isLoaded, signUp, setActive } = useSignUp();
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });
  // State variable to track password visibility
  const [showPassword, setShowPassword] = useState(false);

  // Function to toggle the password visibility state
  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const [verification, setVerification] = useState({
    state: "default",
    error: "",
    code: "",
  });

  const onSignUpPress = async () => {
    if (!isLoaded) return;

    try {
      // Start sign-up process using email and password provided
      await signUp.create({
        emailAddress: form.email,
        password: form.password,
      });

      // Send user an email with verification code
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });

      // Set to 'pending' to display the verification modal
      setVerification({
        ...verification,
        state: "pending",
        error: "",
        code: "",
      });
    } catch (err: any) {
      console.log(JSON.stringify(err, null, 2));
      Alert.alert("Error", err.errors[0].longMessage);
    }
  };

  // Handle submission of verification form
  const onPressVerify = async () => {
    if (!isLoaded) return;

    try {
      // Attempt to verify the code entered by the user
      const signUpAttempt = await signUp.attemptEmailAddressVerification({
        code: verification.code,
      });

      if (signUpAttempt.status === "complete") {
        // If verification is complete, create user and set the session to active
        await fetchAPI("/(api)/user", {
          method: "POST",
          body: JSON.stringify({
            name: form.name,
            email: form.email,
            clerkId: signUpAttempt.createdUserId,
          }),
        });
        await setActive({ session: signUpAttempt.createdSessionId });
        setVerification({ ...verification, state: "success" });
      } else {
        // For an incorrect code, keep the modal open and update the error message.
        setVerification({
          ...verification,
          error: "Verification Failed. Please try again.",
          state: "pending",
        });
      }
    } catch (err: any) {
      // Keep the modal open by staying in 'pending' state on error
      setVerification({
        ...verification,
        error: err.errors[0].longMessage,
        state: "pending",
      });
      Alert.alert("Error", err.errors[0].longMessage);
      console.log(JSON.stringify(err, null, 2));
    }
  };

  // Function to resend the verification code
  const onResendCode = async () => {
    if (!isLoaded) return;
    try {
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      // Clear any previous error and optionally notify the user
      setVerification({ ...verification, error: "" });
      Alert.alert(
        "Success",
        "A new verification code has been sent to your email.",
      );
    } catch (err: any) {
      setVerification({ ...verification, error: err.errors[0].longMessage });
      console.log(JSON.stringify(err, null, 2));
    }
  };

  return (
    <KeyboardAwareScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ flexGrow: 1 }}
      keyboardShouldPersistTaps="handled"
      extraScrollHeight={20}
      scrollEnabled={false}
    >
      <View className={"flex-1 bg-primary-200"}>
        <View className="flex-1 bg-[#F5F7FA]">
          <View className="relative w-full h-[200px]">
            <Image
              source={images.icon}
              className="self-center mt-[90px]"
              style={{ width: 240, height: 60, resizeMode: "contain" }}
            />
            <Text className="text-2xl text-black font-PoppinsBold absolute bottom-0 left-5">
              Create Your Account
            </Text>
          </View>
          <View className="p-5">
            <InputField
              label="Name"
              placeholder="Enter your name"
              keyboardShouldPersistTaps="handled"
              returnKeyType="next"
              icon={icons.person}
              value={form.name}
              onChangeText={(value) => setForm({ ...form, name: value })}
              onSubmitEditing={() => emailRef.current?.focus()}
            />

            <InputField
              label="Email"
              placeholder="Enter your email"
              returnKeyType="next"
              textContentType="emailAddress"
              keyboardShouldPersistTaps="handled"
              icon={icons.email}
              value={form.email}
              onChangeText={(value) => setForm({ ...form, email: value })}
              ref={emailRef}
              onSubmitEditing={() => passwordRef.current?.focus()}
            />

            <View style={{ position: "relative" }}>
              <InputField
                label="Password"
                keyboardShouldPersistTaps="handled"
                textContentType="newPassword"
                placeholder="Enter your password"
                icon={icons.lock}
                secureTextEntry={!showPassword}
                value={form.password}
                onChangeText={(value) => setForm({ ...form, password: value })}
                ref={passwordRef}
                onSubmitEditing={() => {
                  Keyboard.dismiss();
                  onSignUpPress();
                }}
                returnKeyType="go"
                style={{ paddingRight: 40 }}
              />
              <TouchableOpacity
                onPress={toggleShowPassword}
                style={{
                  position: "absolute",
                  right: 15,
                  top: 62,
                }}
              >
                <MaterialCommunityIcons
                  name={showPassword ? "eye-off" : "eye"}
                  size={24}
                  color="#aaa"
                />
              </TouchableOpacity>
            </View>

            <CustomButton
              title="Sign Up"
              onPress={onSignUpPress}
              className="mt-6"
            />
            <OAuth />
            <Link
              href="/sign-in"
              className="text-base text-center text-general-200 mt-10"
            >
              <Text>Already have an account? </Text>
              <Text className="text-primary-500">Sign In</Text>
            </Link>
          </View>
          <ReactNativeModal
            isVisible={verification.state === "pending"}
            style={{ justifyContent: "flex-start", marginTop: 130 }} // adjust marginTop as needed
            onModalHide={() => {
              if (verification.state === "success") setShowSuccessModal(true);
            }}
          >
            <View className="bg-primary-200 px-7 py-9 rounded-2xl min-h-[300px]">
              {/* Exit icon at top left */}
              <TouchableOpacity
                onPress={() =>
                  setVerification({
                    ...verification,
                    state: "default",
                    code: "",
                    error: "",
                  })
                }
                style={{ position: "absolute", top: 20, right: 20, zIndex: 1 }}
              >
                <MaterialCommunityIcons name="close" size={24} color="#000" />
              </TouchableOpacity>
              <Text className="text-2xl font-PoppinsSemiBold mb-2">
                Verification
              </Text>
              <Text className="font-PoppinsRegular mb-5">
                We've sent a verification code to
                <Text className="text-primary-900"> {form.email}</Text>
              </Text>
              <InputField
                label="Code"
                textContentType="oneTimeCode"
                icon={icons.lock}
                keyboardShouldPersistTaps="false"
                placeholder="12345"
                autoFocus={true}
                value={verification.code}
                maxLength={6}
                keyboardType="numeric"
                onChangeText={(code) =>
                  setVerification({ ...verification, code })
                }
              />
              {verification.error && (
                <Text className="text-red-500 text-sm mt-1">
                  {verification.error}
                </Text>
              )}
              <CustomButton
                title="Verify Email"
                onPress={onPressVerify}
                className="mt-5 bg-primary-500"
              />
              <TouchableOpacity onPress={onResendCode} className="mt-3">
                <Text className="text-blue-500 text-center">Resend Code</Text>
              </TouchableOpacity>
            </View>
          </ReactNativeModal>

          <ReactNativeModal isVisible={showSuccessModal}>
            <View className="bg-[#E2E8F0] px-7 py-9 rounded-2xl min-h-[300px]">
              <Image
                source={images.check}
                className={"w-[110px] h-[110px] mx-auto my-5"}
              />
              <Text className="text-3xl font-PoppinsSemiBold text-center">
                Verified
              </Text>
              <Text className="text-sm text-general-200 font-PoppinsRegular text-center mt-2">
                You have successfully verified your account.
              </Text>
              <CustomButton
                title="Browse Home"
                onPress={() => {
                  setShowSuccessModal(false);
                  router.push("/(root)/(tabs)/home");
                }}
                className="mt-5"
              />
            </View>
          </ReactNativeModal>
        </View>
      </View>
    </KeyboardAwareScrollView>
  );
};

export default Sign_Up;
