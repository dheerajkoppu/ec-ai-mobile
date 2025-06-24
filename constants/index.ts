import email from "@/assets/icons/email.png";
import google from "@/assets/icons/google.png";
import applelight from "@/assets/icons/apple-light.png";
import appledark from "@/assets/icons/apple-dark.png";
import lock from "@/assets/icons/lock.png";
import person from "@/assets/icons/person.png";
import check from "@/assets/images/check.png";
import onboarding1 from "@/assets/images/onboarding1.png";
import onboarding2 from "@/assets/images/onboarding2.png";
import onboarding3 from "@/assets/images/onboarding3.png";
import onboarding4 from "@/assets/images/onboarding4.png";
import onboarding1dark from "@/assets/images/onboarding1-dark.png";
import onboarding2dark from "@/assets/images/onboarding2-dark.png";
import onboarding3dark from "@/assets/images/onboarding3-dark.png";
import onboarding4dark from "@/assets/images/onboarding4-dark.png";
import icon from "@/assets/images/icon.png";
import { useColorScheme } from "react-native";

export const images = {
  onboarding1,
  onboarding2,
  onboarding3,
  onboarding4,
  onboarding1dark,
  onboarding2dark,
  onboarding3dark,
  onboarding4dark,
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
      image: isDark ? images.onboarding1dark : images.onboarding1,
    },
    {
      id: 2,
      image: isDark ? images.onboarding2dark : images.onboarding2,
    },
    {
      id: 3,
      image: isDark ? images.onboarding3dark : images.onboarding3,
    },
    {
      id: 4,
      image: isDark ? images.onboarding4dark : images.onboarding4,
    },
  ];
};
