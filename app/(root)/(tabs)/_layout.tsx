import * as Haptics from "expo-haptics";
import { NativeTabs } from "expo-router/unstable-native-tabs";
import { DynamicColorIOS, Platform, useColorScheme } from "react-native";

const BRAND_COLOR = "#5B55F6";
const BRAND_COLOR_DARK = "#8D88FF";

const getSelectedTabColor = () => {
  if (Platform.OS === "ios") {
    return DynamicColorIOS({
      light: BRAND_COLOR,
      dark: BRAND_COLOR_DARK,
    });
  }

  return BRAND_COLOR_DARK;
};

const getDefaultTabColor = (isDark: boolean) => {
  if (Platform.OS === "ios") {
    return DynamicColorIOS({
      light: "#8F8AB8",
      dark: "#A9A5D9",
    });
  }

  return isDark ? "#A9A5D9" : "#8F8AB8";
};

const Layout = () => {
  const isDark = useColorScheme() === "dark";
  const selectedColor = getSelectedTabColor();
  const defaultColor = getDefaultTabColor(isDark);
  const nativeTabsProps =
    Platform.OS === "ios"
      ? {
          minimizeBehavior: "never" as const,
          backgroundColor: "transparent",
          tintColor: DynamicColorIOS({
            light: BRAND_COLOR,
            dark: BRAND_COLOR_DARK,
          }),
        }
      : {
          backgroundColor: isDark ? "#121126" : "#F3F1FF",
          indicatorColor: BRAND_COLOR,
          rippleColor: "rgba(91, 85, 246, 0.12)",
        };

  return (
    <NativeTabs
      {...nativeTabsProps}
      iconColor={{
        default: defaultColor,
        selected: selectedColor,
      }}
      labelStyle={{
        default: { color: defaultColor },
        selected: { color: selectedColor },
      }}
      screenListeners={{
        tabPress: () => {
          void Haptics.selectionAsync().catch(() => undefined);
        },
      }}
    >
      <NativeTabs.Trigger name="opportunity_match">
        <NativeTabs.Trigger.Icon
          sf={{ default: "house", selected: "house.fill" }}
          md="home"
        />
        <NativeTabs.Trigger.Label>Match</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="track_activities">
        <NativeTabs.Trigger.Icon sf="checklist" md="checklist" />
        <NativeTabs.Trigger.Label>Track</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="add_activity">
        <NativeTabs.Trigger.Icon
          sf={{ default: "plus.circle", selected: "plus.circle.fill" }}
          md="add_circle"
        />
        <NativeTabs.Trigger.Label>Add</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="saved_opportunities">
        <NativeTabs.Trigger.Icon
          sf={{ default: "star", selected: "star.fill" }}
          md="star"
        />
        <NativeTabs.Trigger.Label>Saved</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="profile" disableTransparentOnScrollEdge>
        <NativeTabs.Trigger.Icon
          sf={{ default: "person.circle", selected: "person.circle.fill" }}
          md="person"
        />
        <NativeTabs.Trigger.Label>Profile</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
};

export default Layout;
