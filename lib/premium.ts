import { Alert, Platform } from "react-native";
import Purchases from "react-native-purchases";

export const PREMIUM_ENTITLEMENT_ID = "premium";

const isAndroidBillingUnavailable = (error: unknown) => {
  const details = JSON.stringify(error ?? "").toLowerCase();

  return (
    details.includes("billing is not available") ||
    details.includes("problem with the store") ||
    details.includes("billing_unavailable") ||
    details.includes("google play in-app billing api version is less than 3")
  );
};

const showBillingUnavailableAlert = () => {
  Alert.alert(
    "Google Play Billing unavailable",
    "This Android emulator is not ready for subscriptions. Open the Play Store and sign in with a Google account, or test purchases on a physical Android device.",
  );
};

/**
 * Shows the RevenueCat paywall unless the user already has premium, and returns
 * the result. Returns null when the paywall could not be shown.
 */
export async function presentPremiumPaywallIfNeeded() {
  // Offerings are loaded first on Android, so a device without Play billing gets a clear message
  if (Platform.OS === "android") {
    try {
      await Purchases.getOfferings();
    } catch (error) {
      if (isAndroidBillingUnavailable(error)) {
        showBillingUnavailableAlert();
        return null;
      }

      Alert.alert(
        "Paywall unavailable",
        "We couldn't load the subscription options right now. Please try again.",
      );
      return null;
    }
  }

  try {
    const RevenueCatUI = (await import("react-native-purchases-ui")).default;
    return await RevenueCatUI.presentPaywallIfNeeded({
      requiredEntitlementIdentifier: PREMIUM_ENTITLEMENT_ID,
    });
  } catch (error) {
    if (Platform.OS === "android" && isAndroidBillingUnavailable(error)) {
      showBillingUnavailableAlert();
      return null;
    }

    Alert.alert(
      "Paywall unavailable",
      "We couldn't open the subscription screen right now. Please try again.",
    );
    return null;
  }
}
