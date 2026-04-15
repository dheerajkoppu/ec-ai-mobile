import { useAuth } from "@clerk/clerk-expo";
import { useEffect, useRef } from "react";
import { AppState, Platform } from "react-native";
import Purchases from "react-native-purchases";
import { initializeNotifications } from "@/lib/notifications";
import { PREMIUM_ENTITLEMENT_ID } from "@/lib/premium";

const SYNC_COOLDOWN_MS = 5 * 60 * 1000;

export default function NotificationBootstrap() {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const lastSyncRef = useRef(0);

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

        const isPremium =
          !!customerInfo?.entitlements.active[PREMIUM_ENTITLEMENT_ID];
        await initializeNotifications({ authToken, isPremium });
      } catch (error) {
        console.error("Failed to sync notifications:", error);
      }
    };

    void syncNotifications();
    lastSyncRef.current = Date.now();

    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        const now = Date.now();
        if (now - lastSyncRef.current < SYNC_COOLDOWN_MS) return;
        lastSyncRef.current = now;
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
