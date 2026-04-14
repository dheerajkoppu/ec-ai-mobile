import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  Platform,
  StyleProp,
  ViewStyle,
} from "react-native";
import {
  Host,
  Menu,
  Button as SwiftUIButton,
  HStack,
  Text as SwiftText,
  Image as SwiftImage,
} from "@expo/ui/swift-ui";
import {
  buttonStyle,
  controlSize,
  disabled,
  frame,
  foregroundStyle,
  layoutPriority,
  lineLimit,
  opacity,
  truncationMode,
} from "@expo/ui/swift-ui/modifiers";
import { Dropdown } from "react-native-element-dropdown";

interface DropdownFieldProps {
  label: React.ReactNode;
  data: { label: string; value: string }[];
  value: string;
  onChange: (item: { label: string; value: string }) => void;
  placeholder: string;
  containerStyle?: StyleProp<ViewStyle>;
  nativeHostStyle?: StyleProp<ViewStyle>;
}

const DropdownField: React.FC<DropdownFieldProps> = ({
  label,
  data,
  value,
  onChange,
  placeholder,
  containerStyle,
  nativeHostStyle,
}) => {
  const [isFocus, setIsFocus] = useState(false);
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  const selectedItem = data.find((item) => item.value === value);
  const hasSelection = Boolean(selectedItem);
  const triggerLabel = selectedItem?.label ?? placeholder;
  const triggerTextColor = hasSelection
    ? isDark
      ? "#ffffff"
      : "#111827"
    : isDark
      ? "#a1a1aa"
      : "#6b7280";
  const triggerIconColor = isDark ? "#a1a1aa" : "#6b7280";

  const renderLabel = () => {
    if (!label) return null;

    if (typeof label === "string") {
      return (
        <Text style={[styles.label, { color: isDark ? "#fff" : "#333" }]}>
          {label}
        </Text>
      );
    }

    return <View style={styles.customLabel}>{label}</View>;
  };

  if (Platform.OS === "ios") {
    return (
      <View style={[styles.container, containerStyle]}>
        {renderLabel()}
        <Host
          matchContents={{ vertical: true }}
          colorScheme={isDark ? "dark" : "light"}
          style={[styles.nativeHost, nativeHostStyle]}
        >
          <Menu
            label={
              <HStack
                spacing={8}
                modifiers={[
                  frame({
                    maxWidth: 9999,
                    minHeight: 20,
                    alignment: "leading",
                  }),
                ]}
              >
                <SwiftText
                  modifiers={[
                    foregroundStyle(triggerTextColor),
                    frame({ maxWidth: 9999, alignment: "leading" }),
                    layoutPriority(1),
                    lineLimit(1),
                    truncationMode("tail"),
                  ]}
                >
                  {triggerLabel}
                </SwiftText>
                <SwiftImage
                  systemName="chevron.up.chevron.down"
                  size={12}
                  color={triggerIconColor}
                />
              </HStack>
            }
            modifiers={[
              buttonStyle("bordered"),
              controlSize("large"),
              frame({ maxWidth: 9999, alignment: "leading" }),
              disabled(data.length === 0),
              opacity(data.length === 0 ? 0.65 : 1),
            ]}
          >
            {data.map((item) => (
              <SwiftUIButton
                key={item.value}
                label={item.label}
                systemImage={item.value === value ? "checkmark" : undefined}
                onPress={() => onChange(item)}
              />
            ))}
          </Menu>
        </Host>
      </View>
    );
  }

  return (
    <View style={[styles.container, containerStyle]}>
      {renderLabel()}
      <Dropdown
        data={data}
        labelField="label"
        valueField="value"
        value={value}
        onChange={onChange}
        placeholder={!isFocus ? placeholder : "..."}
        onFocus={() => setIsFocus(true)}
        onBlur={() => setIsFocus(false)}
        style={[
          styles.dropdown,
          {
            backgroundColor: isDark ? "#1e1e1e" : "#ffffff",
            borderColor: isDark ? "#444" : "#D1D5DB",
          },
        ]}
        containerStyle={{
          borderWidth: 1,
          borderColor: isDark ? "#444" : "#D1D5DB",
          borderRadius: 10,
          backgroundColor: isDark ? "#2a2a2a" : "#fff",
        }}
        itemTextStyle={{
          color: isDark ? "#fff" : "#000",
          fontFamily: "Poppins-Regular",
          fontSize: 15,
        }}
        selectedTextStyle={{
          color: isDark ? "#fff" : "#111",
          fontFamily: "Poppins-Regular",
          fontSize: 15,
        }}
        placeholderStyle={{
          color: isDark ? "#aaa" : "#888",
          fontFamily: "Poppins-Regular",
          fontSize: 15,
        }}
        activeColor={isDark ? "#3a3a3a" : "#e5e5e5"} // 👈 this fixes the invisible highlight
        dropdownPosition="auto"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
    width: "100%",
  },
  label: {
    fontSize: 18,
    fontFamily: "Poppins-Bold",
    marginBottom: 8,
  },
  customLabel: {
    marginBottom: 8,
  },
  dropdown: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  nativeHost: {
    width: "100%",
    minHeight: 50,
    overflow: "visible",
    marginTop: 4,
  },
});

export default DropdownField;
