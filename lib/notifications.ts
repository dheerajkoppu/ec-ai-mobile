import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { fetchAPI } from "@/lib/fetch";

export const NOTIFICATIONS_ENABLED_KEY = "@notifications_enabled";
export const NOTIFICATIONS_PROMPT_SEEN_KEY = "@notifications_prompt_seen";

const API_ORIGIN =
  Constants.expoConfig?.extra?.API_ORIGIN ?? "https://ec-ai.expo.app";
const ACTIVITY_REMINDER_ID = "activity-weekly-reminder";
const OPPORTUNITY_REMINDER_ID = "opportunity-weekly-reminder";

type NotificationSyncOptions = {
  authToken?: string | null;
  isPremium?: boolean;
};

async function ensureAndroidNotificationChannel(): Promise<void> {
  if (Platform.OS !== "android") return;

  await Notifications.setNotificationChannelAsync("default", {
    name: "EC-AI Alerts",
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: "#5B55F6",
  });
}

function hasGrantedPermission(
  permissions: Notifications.NotificationPermissionsStatus,
): boolean {
  if (permissions.granted) return true;

  if (Platform.OS === "ios") {
    const iosStatus = permissions.ios?.status;
    return (
      iosStatus === Notifications.IosAuthorizationStatus.AUTHORIZED ||
      iosStatus === Notifications.IosAuthorizationStatus.PROVISIONAL
    );
  }

  return false;
}

export async function requestNotificationPermission(): Promise<boolean> {
  await ensureAndroidNotificationChannel();

  const existingPermissions = await Notifications.getPermissionsAsync();
  if (hasGrantedPermission(existingPermissions)) return true;

  const requestedPermissions = await Notifications.requestPermissionsAsync();
  return hasGrantedPermission(requestedPermissions);
}

async function scheduleReminders(): Promise<void> {
  await cancelReminders();

  await Notifications.scheduleNotificationAsync({
    identifier: ACTIVITY_REMINDER_ID,
    content: {
      title: "Log your activities",
      body: "Don't forget to log this week's hours and activities!",
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday: 1,
      hour: 18,
      minute: 0,
    },
  });

  await Notifications.scheduleNotificationAsync({
    identifier: OPPORTUNITY_REMINDER_ID,
    content: {
      title: "New opportunities waiting",
      body: "Fresh curated opportunities match your goals — check them out!",
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday: 2,
      hour: 9,
      minute: 0,
    },
  });
}

async function cancelReminders(): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(
    ACTIVITY_REMINDER_ID,
  ).catch(() => undefined);
  await Notifications.cancelScheduledNotificationAsync(
    OPPORTUNITY_REMINDER_ID,
  ).catch(() => undefined);
}

async function registerPushToken(
  authToken: string,
  expoPushToken: string,
): Promise<void> {
  await fetchAPI(`${API_ORIGIN}/registerpush`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify({
      expoPushToken,
      platform: Platform.OS,
    }),
  });
}

async function disableRemotePush(authToken?: string | null): Promise<void> {
  if (!authToken) return;

  await fetchAPI(`${API_ORIGIN}/notificationpreferences`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify({ enabled: false }),
  });
}

async function getExpoPushToken(): Promise<string | null> {
  if (Platform.OS === "web" || !Device.isDevice) {
    return null;
  }

  await ensureAndroidNotificationChannel();

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;

  if (!projectId) {
    throw new Error("Missing Expo projectId for push token registration");
  }

  const token = await Notifications.getExpoPushTokenAsync({ projectId });
  return token.data;
}

async function enablePremiumNotifications(
  authToken?: string | null,
): Promise<boolean> {
  const expoPushToken = await getExpoPushToken().catch((error) => {
    console.error("Failed to fetch Expo push token:", error);
    return null;
  });

  if (authToken && expoPushToken) {
    await cancelReminders();
    await registerPushToken(authToken, expoPushToken);
    return true;
  }

  // Fall back to generic local reminders when personalized push is unavailable.
  await scheduleReminders();
  await disableRemotePush(authToken).catch(() => undefined);
  return true;
}

async function enableFreeNotifications(authToken?: string | null): Promise<boolean> {
  await scheduleReminders();
  await disableRemotePush(authToken).catch(() => undefined);
  return true;
}

export async function getNotificationsEnabled(): Promise<boolean> {
  const value = await AsyncStorage.getItem(NOTIFICATIONS_ENABLED_KEY);
  return value === "true";
}

export async function hasSeenNotificationsPrompt(): Promise<boolean> {
  const value = await AsyncStorage.getItem(NOTIFICATIONS_PROMPT_SEEN_KEY);
  return value === "true";
}

export async function markNotificationsPromptSeen(): Promise<void> {
  await AsyncStorage.setItem(NOTIFICATIONS_PROMPT_SEEN_KEY, "true");
}

export async function setNotificationsEnabled(
  enabled: boolean,
  options: NotificationSyncOptions = {},
): Promise<boolean> {
  const { authToken, isPremium = false } = options;

  if (enabled) {
    const granted = await requestNotificationPermission();
    if (!granted) {
      await cancelReminders();
      await disableRemotePush(authToken).catch(() => undefined);
      await AsyncStorage.setItem(NOTIFICATIONS_ENABLED_KEY, "false");
      return false;
    }

    const synced = isPremium
      ? await enablePremiumNotifications(authToken)
      : await enableFreeNotifications(authToken);

    await AsyncStorage.setItem(NOTIFICATIONS_ENABLED_KEY, String(synced));
    return synced;
  }

  await cancelReminders();
  await disableRemotePush(authToken).catch(() => undefined);
  await AsyncStorage.setItem(NOTIFICATIONS_ENABLED_KEY, "false");
  return false;
}

export async function initializeNotifications(
  options: NotificationSyncOptions = {},
): Promise<void> {
  const { authToken, isPremium = false } = options;
  const enabled = await getNotificationsEnabled();
  if (!enabled) return;

  const granted = await requestNotificationPermission();
  if (!granted) {
    await cancelReminders();
    await disableRemotePush(authToken).catch(() => undefined);
    await AsyncStorage.setItem(NOTIFICATIONS_ENABLED_KEY, "false");
    return;
  }

  const synced = isPremium
    ? await enablePremiumNotifications(authToken)
    : await enableFreeNotifications(authToken);

  if (!synced) {
    await AsyncStorage.setItem(NOTIFICATIONS_ENABLED_KEY, "false");
  }
}
