import { Image, ScrollView, View, Text } from "react-native";
import { icons, images } from "@/constants";
import InputField from "@/components/InputField";
import { useState } from "react";
const Sign_Up = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });
  return (
    <ScrollView className={"flex-1 bg-primary-200"}>
      <View className="flex-1 bg-[#F5F7FA]">
        <View className="relative w-full h-[250px]">
          <Image source={images.onboarding1} className="z-0 w-full h-[250px]" />
          <Text className="text-2xl text-black font-PoppinsBold absolute bottom-5 left-5">
            Create Your Account
          </Text>
        </View>
        <View className="p-5">
          <InputField
            label="Name"
            placeholder="Enter your name"
            icon={icons.person}
            value={form.name}
            onChangeText={(value) => setForm({ ...form, name: value })}
          />
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
        </View>
      </View>
    </ScrollView>
  );
};

export default Sign_Up;
