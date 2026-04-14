import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import type { TokenCache } from "@clerk/clerk-expo";
import { fetchAPI } from "@/lib/fetch";

const createTokenCache = (): TokenCache => {
  return {
    getToken: async (key: string) => {
      try {
        const item = await SecureStore.getItemAsync(key);
        return item;
      } catch (error) {
        console.error("secure store get item error: ", error);
        await SecureStore.deleteItemAsync(key);
        return null;
      }
    },
    saveToken: (key: string, token: string) => {
      return SecureStore.setItemAsync(key, token);
    },
  };
};

// SecureStore is not supported on the web
export const tokenCache =
  Platform.OS !== "web" ? createTokenCache() : undefined;

export const OAUTH_REDIRECT_PATH = "oauth-redirect";
export const OAUTH_REDIRECT_URL = "ec-ai://oauth-redirect";

export const getOAuthRedirectUrl = () => OAUTH_REDIRECT_URL;

async function oauthSignIn(
  provider: "Google" | "Apple",
  startOAuthFlow: any,
  getToken: () => Promise<string | null>,
) {
  try {
    const { createdSessionId, setActive, signUp } = await startOAuthFlow();

    if (createdSessionId && setActive) {
      await setActive({ session: createdSessionId });

      if (signUp?.createdUserId) {
        const token = await getToken();
        await fetchAPI("https://ec-ai.expo.app/user", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: `${signUp.firstName ?? ""} ${signUp.lastName ?? ""}`.trim(),
            email: signUp.emailAddress,
            clerkId: signUp.createdUserId,
          }),
        });

        return {
          success: true,
          code: "success",
          message: `You have successfully signed in with ${provider}`,
          date: Date.now(),
        };
      }

      return {
        success: true,
        code: "success",
        message: `You have successfully signed in with ${provider}`,
      };
    }

    return {
      success: false,
      message: `An error occurred while signing in with ${provider}`,
    };
  } catch (err: any) {
    console.error(err);
    return {
      success: false,
      code: err.code,
      message: err?.errors?.[0]?.longMessage ?? "Unknown error occurred.",
    };
  }
}

export const googleOAuth = (
  startOAuthFlow: any,
  getToken: () => Promise<string | null>,
) => oauthSignIn("Google", startOAuthFlow, getToken);

export const appleOAuth = (
  startOAuthFlow: any,
  getToken: () => Promise<string | null>,
) => oauthSignIn("Apple", startOAuthFlow, getToken);
