import email from "@/assets/icons/email.png";
import google from "@/assets/icons/google.png";
import applelight from "@/assets/icons/apple-light.png";
import appledark from "@/assets/icons/apple-dark.png";
import lock from "@/assets/icons/lock.png";
import person from "@/assets/icons/person.png";
import check from "@/assets/images/check.png";
import icon from "@/assets/images/icon.png";
import { useColorScheme } from "react-native";

export const images = {
  check,
  icon,
};

export const icons = {
  applelight,
  appledark,
  google,
  lock,
  person,
  email,
};

export const useOnboardingData = () => {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  // Dark and light mode images for onboarding
  return [
    {
      id: 1,
      video: isDark
        ? "https://res.cloudinary.com/ec-ai/video/upload/v1750828423/lzbjkpbvrkhz4bu1elov.mov" // dark mode video
        : "https://res.cloudinary.com/ec-ai/video/upload/v1750798121/lra27isr2rj6zr7ptle4.mov", // light mode video
    },
  ];
};
