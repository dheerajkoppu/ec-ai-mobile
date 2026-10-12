import { ActionSheetIOS, Alert, Platform } from "react-native";

type ConfirmDestructiveActionArgs = {
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void | Promise<void>;
};

/**
 * Asks the user to confirm a destructive action, with an action sheet on iOS and
 * an alert elsewhere.
 */
export const confirmDestructiveAction = ({
  title,
  message,
  confirmLabel = "Delete",
  onConfirm,
}: ConfirmDestructiveActionArgs) => {
  if (Platform.OS === "ios") {
    ActionSheetIOS.showActionSheetWithOptions(
      {
        title,
        message,
        options: ["Cancel", confirmLabel],
        cancelButtonIndex: 0,
        destructiveButtonIndex: 1,
      },
      (buttonIndex) => {
        if (buttonIndex === 1) {
          void onConfirm();
        }
      },
    );
    return;
  }

  Alert.alert(title, message, [
    { text: "Cancel", style: "cancel" },
    {
      text: confirmLabel,
      style: "destructive",
      onPress: () => void onConfirm(),
    },
  ]);
};
