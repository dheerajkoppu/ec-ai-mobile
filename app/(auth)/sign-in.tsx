import {
  Image,
  ScrollView,
  View,
  Text,
  Alert,
  Keyboard,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { icons, images } from "@/constants";
import InputField from "@/components/InputField";
import CustomButton from "@/components/CustomButton";
import { useCallback, useRef, useState } from "react";
import { Link, router } from "expo-router";
import OAuth from "@/components/OAuth";
import { useSignIn } from "@clerk/clerk-expo";
import { InputFieldProps } from "@/types/type";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const Sign_In = () => {
  // State variable to track password visibility
  const [showPassword, setShowPassword] = useState(false);

  // Function to toggle the password visibility state
  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };
  const { signIn, setActive, isLoaded } = useSignIn();
  const passwordRef = useRef<TextInput>(null);
  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const onSignInPress = useCallback(async () => {
    if (!isLoaded) return;

    try {
      const signInAttempt = await signIn.create({
        identifier: form.email,
        password: form.password,
      });

      if (signInAttempt.status === "complete") {
        await setActive({ session: signInAttempt.createdSessionId });
        router.replace("/(root)/(tabs)/new_opportunities");
      } else {
        // See https://clerk.com/docs/custom-flows/error-handling for more info on error handling
        console.log(JSON.stringify(signInAttempt, null, 2));
        Alert.alert("Error", "Log in failed. Please try again.");
      }
    } catch (err: any) {
      console.log(JSON.stringify(err, null, 2));
      Alert.alert("Error", err.errors[0].longMessage);
    }
  }, [isLoaded, signIn, form.email, form.password, setActive]);

  return (
    <View className={"flex-1 bg-primary-200"}>
      <View className="flex-1 bg-[#F5F7FA]">
        <View className="relative w-full h-[250px]">
          <Image
            source={images.icon}
            className="self-center mt-[90px]"
            style={{ width: 280, height: 70, resizeMode: "contain" }}
          />
          <Text className="text-2xl text-black font-PoppinsBold absolute bottom-0 left-5">
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
              // Add extra padding to the right to prevent text from overlapping the icon
              style={{ paddingRight: 40 }}
            />
            <TouchableOpacity
              onPress={toggleShowPassword}
              style={{
                position: "absolute",
                right: 15, // adjust as needed
                top: 62, // (48 - 24) / 2
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
            title="Sign In"
            onPress={onSignInPress}
            className="mt-6"
          />
          <OAuth />
          <Link
            href="/sign-up"
            className="text-base text-center text-general-200 mt-10"
          >
            <Text>Don't have an account? </Text>
            <Text className="text-primary-500">Sign Up</Text>
          </Link>
        </View>
        {/*Verification Model*/}
      </View>
    </View>
  );
};

export default Sign_In;
