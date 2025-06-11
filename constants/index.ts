import checkmark from "@/assets/icons/check.png";
import close from "@/assets/icons/close.png";
import email from "@/assets/icons/email.png";
import eyecross from "@/assets/icons/eyecross.png";
import google from "@/assets/icons/google.png";
import home from "@/assets/icons/home.png";
import list from "@/assets/icons/list.png";
import lock from "@/assets/icons/lock.png";
import marker from "@/assets/icons/marker.png";
import out from "@/assets/icons/out.png";
import person from "@/assets/icons/person.png";
import profile from "@/assets/icons/profile.png";
import search from "@/assets/icons/search.png";
import star from "@/assets/icons/star.png";
import target from "@/assets/icons/target.png";
import check from "@/assets/images/check.png";
import onboarding1 from "@/assets/images/onboarding1.png";
import onboarding2 from "@/assets/images/onboarding2.png";
import onboarding3 from "@/assets/images/onboarding3.png";
import onboarding1dark from "@/assets/images/onboarding1-dark.png";
import onboarding2dark from "@/assets/images/onboarding2-dark.png";
import onboarding3dark from "@/assets/images/onboarding3-dark.png";
import icon from "@/assets/images/icon.png";
import logo from "@/assets/images/logo.png";
import logo_outline from "@/assets/images/logo_outline.png";
import { useColorScheme } from "react-native";

export const images = {
  onboarding1,
  onboarding2,
  onboarding3,
  onboarding1dark,
  onboarding2dark,
  onboarding3dark,
  check,
  icon,
};

export const icons = {
  logo,
  logo_outline,
  checkmark,
  close,
  google,
  list,
  lock,
  marker,
  out,
  person,
  search,
  star,
  target,
  email,
  eyecross,
  home,
  profile,
};

export const useOnboardingData = () => {
  const scheme = useColorScheme(); // ✅ Valid use of hook
  const isDark = scheme === "dark";

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
  ];
};

export const data = {};
