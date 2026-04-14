import { useAuth } from "@clerk/clerk-expo";
import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { fetchAPI } from "@/lib/fetch";

const Page = () => {
  const { isSignedIn, getToken } = useAuth();
  const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(
    null,
  );

  useEffect(() => {
    if (!isSignedIn) return;

    const checkOnboarding = async () => {
      try {
        const token = await getToken();
        const response = await fetchAPI("https://ec-ai.expo.app/getuserdata", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        setOnboardingComplete(response?.user?.agreed_to_terms === true);
      } catch {
        // Network failure or user not found — fail safe for existing users
        setOnboardingComplete(true);
      }
    };

    checkOnboarding();
  }, [isSignedIn]);

  if (!isSignedIn) return <Redirect href="/(auth)/welcome" />;

  if (onboardingComplete === null) return null;

  if (!onboardingComplete) return <Redirect href="/(auth)/profile-setup" />;

  return <Redirect href="/(root)/(tabs)/opportunity_match" />;
};

export default Page;
