import { useEffect } from "react";
import Purchases from "react-native-purchases";
import { useUser } from "@clerk/clerk-expo";

export default function RevenueCatInit() {
  const { isLoaded, user } = useUser();

  useEffect(() => {
    if (isLoaded && user) {
      const appUserId = user.id;

      Purchases.logIn(appUserId)
        .then(({ customerInfo, created }) => {
          console.log("✅ RevenueCat logged in", { created, customerInfo });
        })
        .catch((err) => {
          console.error("❌ RevenueCat login error", err);
        });
    }
  }, [isLoaded, user]);

  return null;
}
