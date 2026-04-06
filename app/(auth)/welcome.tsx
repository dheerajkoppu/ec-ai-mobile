import { router } from "expo-router";
import type { ComponentProps } from "react";
import { useRef, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Swiper from "react-native-swiper";
import CustomButton from "@/components/CustomButton";
import { useOnboardingData } from "@/constants";
import { useColorScheme } from "react-native";
import { useVideoPlayer, VideoView } from "expo-video";
import * as Haptics from "expo-haptics";

function OnboardingVideo({ uri }: { uri: string }) {
  const player = useVideoPlayer({ uri }, (videoPlayer) => {
    videoPlayer.loop = true;
    videoPlayer.muted = true;
    videoPlayer.play();
  });
  const videoViewPlayer = player as ComponentProps<typeof VideoView>["player"];

  return (
    <VideoView
      player={videoViewPlayer}
      nativeControls={false}
      contentFit="cover"
      style={{ width: "84.32432228%", height: "112.098789%" }}
    />
  );
}

const Home = () => {
  const swiperRef = useRef<Swiper>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const isDark = useColorScheme() === "dark";
  const onboarding = useOnboardingData();
  const isLastSlide = activeIndex === onboarding.length - 1;

  return (
    <SafeAreaView
      className="flex h-full items-center justify-between"
      style={{ backgroundColor: isDark ? "#121212" : "#F5F7FA" }}
    >
      <TouchableOpacity
        onPress={() => router.replace("/(auth)/sign-up")}
        className="w-full flex justify-end items-end p-5"
      >
        <Text
          className="text-md font-PoppinsBold"
          style={{ color: isDark ? "#fff" : "#000" }}
        >
          Skip
        </Text>
      </TouchableOpacity>

      <Swiper
        ref={swiperRef}
        loop={false}
        paginationStyle={{ bottom: -20 }}
        dot={<View className="w-[32px] h-[4px] mx-1 bg-white rounded-full" />}
        activeDot={
          <View className="w-[32px] h-[4px] mx-1 bg-primary-500 rounded-full" />
        }
        onIndexChanged={(index) => setActiveIndex(index)}
      >
        {onboarding.map((item) => (
          <View
            key={item.id}
            className="flex items-center justify-center w-full h-full"
          >
            <OnboardingVideo uri={item.video} />
          </View>
        ))}
      </Swiper>

      <CustomButton
        title={isLastSlide ? "Get Started" : "Next"}
        onPress={async () => {
          await Haptics.selectionAsync();
          if (isLastSlide) {
            router.replace("/(auth)/sign-up");
          } else {
            swiperRef.current?.scrollBy(1);
          }
        }}
        className="w-11/12 mt-16 mb-14"
      />
    </SafeAreaView>
  );
};

export default Home;
