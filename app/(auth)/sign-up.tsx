import {
  Image,
  View,
  Text,
  Alert,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  TextInput,
} from "react-native";
import { icons, images } from "@/constants";
import InputField from "@/components/InputField";
import CustomButton from "@/components/CustomButton";
import { useRef, useState } from "react";
import { Link, router } from "expo-router";
import OAuth from "@/components/OAuth";
import { useSignUp } from "@clerk/clerk-expo";
import { ReactNativeModal } from "react-native-modal";
import { fetchAPI } from "@/lib/fetch";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { Email } from "@clerk/clerk-js/dist/types/ui/icons";

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

  const [verification, setVerification] = useState({
    state: "default",
    error: "",
    code: "",
  });

  const onSignUpPress = async () => {
    if (!isLoaded) return;

    // Start sign-up process using email and password provided
    try {
      await signUp.create({
        emailAddress: form.email,
        password: form.password,
      });

      // Send user an email with verification code
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });

      // Set 'pendingVerification' to true to display second form
      // and capture OTP code
      setVerification({
        ...verification,
        state: "pending",
      });
    } catch (err: any) {
      console.error(JSON.stringify(err, null, 2));
      Alert.alert("Error", err.errors[0].longMessage);
    }
  };

  // Handle submission of verification form
  const onPressVerify = async () => {
    if (!isLoaded) return;

    try {
      // Use the code the user provided to attempt verification
      const signUpAttempt = await signUp.attemptEmailAddressVerification({
        code: verification.code,
      });

      // If verification was completed, set the session to active
      // and redirect the user
      if (signUpAttempt.status === "complete") {
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
        setVerification({
          ...verification,
          error: "Verification Failed",
          state: "failed",
        });
      }
    } catch (err: any) {
      setVerification({
        ...verification,
        error: err.errors[0].longMessage,
        state: "failed",
      });
      Alert.alert("Error", err.errors[0].longMessage);
      console.error(JSON.stringify(err, null, 2));
    }
  };
  return (
    <KeyboardAwareScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ flexGrow: 1 }}
      keyboardShouldPersistTaps="handled"
      extraScrollHeight={20} // adjust as needed
      scrollEnabled={false} // disables manual scrolling
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
              icon={icons.email}
              value={form.email}
              onChangeText={(value) => setForm({ ...form, email: value })}
              ref={emailRef}
              onSubmitEditing={() => passwordRef.current?.focus()}
            />

            <InputField
              label="Password"
              placeholder="Enter your password"
              icon={icons.lock}
              secureTextEntry={true}
              value={form.password}
              onChangeText={(value) => setForm({ ...form, password: value })}
              ref={passwordRef}
              onSubmitEditing={() => {
                Keyboard.dismiss();
                onSignUpPress();
              }}
              returnKeyType="go"
            />

            <CustomButton
              title="Sign Up"
              onPress={onSignUpPress}
              className="mt-6"
            />
            <OAuth />
            <Link
              href="/sign-in"
              className="text-bsae text-center text-general-200 mt-10"
            >
              <Text>Already have an account? </Text>
              <Text className="text-primary-500">Sign In</Text>
            </Link>
          </View>
          <ReactNativeModal
            isVisible={verification.state === "pending"}
            onModalHide={() => {
              if (verification.state === "success") setShowSuccessModal(true);
            }}
          >
            <View className="bg-primary-200 px-7 py-9 rounded-2xl min-h[300px]">
              <Text className="text-2xl font-PoppinsSemiBold mb-2">
                Verification
              </Text>
              <Text className="font-PoppinsRegular mb-5">
                We've sent a verification code to {form.email}
              </Text>
              <InputField
                label="Code"
                icon={icons.lock}
                placeholder="12345"
                value={verification.code}
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
              <Text className="text-sm text-gray-400 font-PoppinsRegular text-center mt-e">
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
