import React, { forwardRef, useState } from "react";
import {
  TextInput,
  View,
  Text,
  Image,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { InputFieldProps } from "@/types/type";
import { useColorScheme } from "react-native";

const InputField = forwardRef<TextInput, InputFieldProps>(
  (
    {
      label,
      icon,
      secureTextEntry = false,
      labelStyle,
      containerStyle,
      inputStyle,
      iconStyle,
      value,
      onChangeText,
      ...props
    },
    ref,
  ) => {
    const isDark = useColorScheme() === "dark";
    const [isFocused, setIsFocused] = useState(false);

    return (
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View className="my-2 w-full">
          {label && (
            <Text
              style={[
                {
                  fontSize: 18,
                  fontFamily: "Poppins-Bold",
                  marginBottom: 8,
                  color: isDark ? "#ffffff" : "#000000",
                },
                labelStyle,
              ]}
            >
              {label}
            </Text>
          )}
          <View
            style={[
              {
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: isDark ? "#1e1e1e" : "#ffffff",
                borderRadius: 12,
                borderWidth: 1.5,
                borderColor: isFocused
                  ? isDark
                    ? "#6C5CE7"
                    : "#5b55f6"
                  : isDark
                    ? "#444"
                    : "#e5e7eb",
                padding: 16,
              },
              containerStyle,
            ]}
          >
            {icon && (
              <Image source={icon} className={`w-6 h-6 mr-3 ${iconStyle}`} />
            )}
            <TextInput
              ref={ref}
              value={value ?? ""}
              onChangeText={onChangeText}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              style={[
                {
                  fontSize: 15,
                  flex: 1,
                  fontFamily: "Poppins-Regular",
                  textAlign: "left",
                  color: isDark ? "#ffffff" : "#000000",
                },
                inputStyle,
              ]}
              placeholderTextColor={isDark ? "#888888" : "#A0A3BD"}
              secureTextEntry={secureTextEntry}
              {...props}
            />
          </View>
        </View>
      </TouchableWithoutFeedback>
    );
  },
);

InputField.displayName = "InputField";
export default InputField;
