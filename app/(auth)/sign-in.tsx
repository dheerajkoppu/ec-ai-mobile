import { Image, ScrollView, View, Text } from "react-native";
import { icons, images } from "@/constants";
import InputField from "@/components/InputField";
import CustomButton from "@/components/CustomButton";
import { useState } from "react";
import { Link } from "expo-router";
import OAuth from "@/components/OAuth";
const Sign_In = () => {
  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const onSignInPress = async () => {};

  return (
    <ScrollView className={"flex-1 bg-primary-200"}>
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
            placeholder="Enter your email"
            icon={icons.email}
            value={form.email}
            onChangeText={(value) => setForm({ ...form, email: value })}
          />
          <InputField
            label="Password"
            placeholder="Enter your password"
            icon={icons.lock}
            secureTextEntry={true}
            value={form.password}
            onChangeText={(value) => setForm({ ...form, password: value })}
          />
          <CustomButton
            title="Sign In"
            onPress={onSignInPress}
            className="mt-6"
          />
          <OAuth />
          <Link
            href="/sign-up"
            className="text-bsae text-center text-general-200 mt-10"
          >
            <Text>Don't have an account? </Text>
            <Text className="text-primary-500">Sign Up</Text>
          </Link>
        </View>
        {/*Verification Model*/}
      </View>
    </ScrollView>
  );
};

export default Sign_In;
