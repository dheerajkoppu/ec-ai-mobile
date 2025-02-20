import { Image, ScrollView, View, Text } from "react-native";
import { images } from "@/constants";

const Sign_Up = () => {
  return (
    <ScrollView className={"flex-1 bg-primary-200"}>
      <View className="flex-1 bg-primary-200">
        <View className="relative w-full h-[250px]">
          <Image source={images.onboarding1} className="z-0 w-full h-[250px]" />
          <Text className="text-2xl text-black font-PoppinsBold absolute bottom-5 left-5">
            Create Your Account
          </Text>
        </View>
        <View className="p-5"></View>
      </View>
    </ScrollView>
  );
};

export default Sign_Up;
