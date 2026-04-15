import { useAuth } from "@clerk/clerk-expo";
import { useEffect } from "react";
import { AppState, Platform } from "react-native";
import Purchases from "react-native-purchases";
import { initializeNotifications } from "@/lib/notifications";

export default function NotificationBootstrap() {
  const { getToken, isLoaded, isSignedIn } = useAuth();

  useEffect(() => {
    if (!isLoaded || !isSignedIn || Platform.OS === "web") return;

    let cancelled = false;

    const syncNotifications = async () => {
      try {
        const [authToken, customerInfo] = await Promise.all([
          getToken(),
          Purchases.getCustomerInfo().catch(() => null),
        ]);

        if (cancelled) return;

        const isPremium = !!customerInfo?.entitlements.active["premium"];
        await initializeNotifications({ authToken, isPremium });
      } catch (error) {
        console.error("Failed to sync notifications:", error);
      }
    };

    void syncNotifications();

    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        void syncNotifications();
      }
    });

    return () => {
      cancelled = true;
      subscription.remove();
    };
  }, [getToken, isLoaded, isSignedIn]);

  return null;
}
