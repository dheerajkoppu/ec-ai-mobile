import { useEffect } from "react";
import Purchases from "react-native-purchases";
import { useUser } from "@clerk/clerk-expo";

/** Links RevenueCat purchases to the signed-in Clerk user. */
export default function RevenueCatInit() {
  const { isLoaded, user } = useUser();

  useEffect(() => {
    if (isLoaded && user) {
      Purchases.logIn(user.id).catch((err) => {
        console.error("❌ RevenueCat login error", err);
      });
    }
  }, [isLoaded, user]);

  return null;
}
