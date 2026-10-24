import { useAuth, useUser } from "@clerk/clerk-expo";
import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { fetchCachedAPI } from "@/lib/fetch";
import { useStableGetToken } from "@/lib/auth";

const USER_DATA_TTL_MS = 60 * 1000;

/** Entry route. Sends each visitor to sign-in, onboarding, or the app. */
const Page = () => {
  const { isSignedIn } = useAuth();
  const getToken = useStableGetToken();
  const { user } = useUser();
  const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(
    null,
  );

  useEffect(() => {
    if (!isSignedIn || !user?.id) return;

    const checkOnboarding = async () => {
      try {
        const token = await getToken();
        const response = await fetchCachedAPI<{
          user?: { agreed_to_terms?: boolean };
        }>(
          `user-data:${user.id}`,
          USER_DATA_TTL_MS,
          "https://ec-ai.expo.app/getuserdata",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          },
        );
        setOnboardingComplete(response?.user?.agreed_to_terms === true);
      } catch {
        // Fails open so a network error never sends an existing user back through onboarding
        setOnboardingComplete(true);
      }
    };

    checkOnboarding();
  }, [getToken, isSignedIn, user?.id]);

  if (!isSignedIn) return <Redirect href="/(auth)/welcome" />;

  if (onboardingComplete === null) return null;

  if (!onboardingComplete) return <Redirect href="/(auth)/profile-setup" />;

  return <Redirect href="/(root)/(tabs)/opportunity_match" />;
};

export default Page;
