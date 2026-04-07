import {
  StyleProp,
  TextInputProps,
  TextStyle,
  TouchableOpacityProps,
  ViewStyle,
} from "react-native";

declare interface Activity {
  id: number;
  name: string;
  roles: string;
  category: string;
  hours: number;
  hoursPerWeek: number;
  weeksPerYear: number;
  description: string;
  grade: string; // e.g., "11, 12"
}

declare interface ButtonProps extends TouchableOpacityProps {
  title: string;
  bgVariant?: "primary" | "secondary" | "danger" | "outline" | "success";
  textVariant?:
    | "primary"
    | "default"
    | "secondary"
    | "danger"
    | "success"
    | "black"
    | "white";
  IconLeft?: React.ComponentType<any>;
  IconRight?: React.ComponentType<any>;
  className?: string;
}

declare interface InputFieldProps extends TextInputProps {
  label: any;
  icon?: any;
  secureTextEntry?: boolean;
  labelStyle?: StyleProp<TextStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  maxLength?: number;
  inputStyle?: StyleProp<TextStyle>;
  iconStyle?: string;
  className?: string;
  keyboardShouldPersistTaps?: string;
}
