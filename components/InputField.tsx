import {
  TextInput,
  View,
  Text,
  Image,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
} from "react-native";
import { InputFieldProps } from "@/types/type";
import React, { forwardRef } from "react";

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
      ...props
    },
    ref,
  ) => {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View className="my-2 w-full">
            {label && (
              <Text className={`text-lg font-PoppinsBold mb-2 ${labelStyle}`}>
                {label}
              </Text>
            )}
            <View
              className={`flex flex-row items-center bg-white rounded-xl border border-gray-200 focus:border-[#6C5CE7] p-4 ${containerStyle}`}
            >
              {icon && (
                <Image source={icon} className={`w-6 h-6 mr-3 ${iconStyle}`} />
              )}
              <TextInput
                ref={ref}
                className={`text-[15px] flex-1 font-Poppins text-left ${inputStyle}`}
                placeholderTextColor="#A0A3BD"
                secureTextEntry={secureTextEntry}
                {...props}
              />
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    );
  },
);

export default InputField;
