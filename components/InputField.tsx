import React, { forwardRef, useState, useEffect } from "react";
import {
  TextInput,
  View,
  Text,
  Image,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { InputFieldProps } from "@/types/type";

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
    // 1. Local state for immediate typing
    const [local, setLocal] = useState<string>(value ?? "");

    // 2. Sync local if parent value changes externally
    useEffect(() => {
      if (value !== undefined && value !== local) {
        setLocal(value);
      }
    }, [value]);

    return (
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
              // 3. Render local state for snappy typing
              value={local}
              onChangeText={setLocal}
              // 4. Only propagate to parent on blur
              onEndEditing={() => {
                onChangeText?.(local);
              }}
              className={`text-[15px] flex-1 font-Poppins text-left ${inputStyle}`}
              placeholderTextColor="#A0A3BD"
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
