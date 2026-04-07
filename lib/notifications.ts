import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { Alert } from "react-native";

export async function registerForPushNotificationsAsync() {
  if (!Device.isDevice) {
    Alert.alert("Must use physical device for push notifications");
    return;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    Alert.alert("Failed to get push token for push notification!");
    return;
  }

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId;

  if (!projectId) {
    console.warn(
      "Expo projectId is missing — push token may not be retrievable.",
    );
    return;
  }

  try {
    const token = (await Notifications.getExpoPushTokenAsync({ projectId }))
      .data;

    console.log("Expo Push Token:", token);
    return token;
  } catch (error) {
    console.error("Error fetching push token:", error);
  }
}
