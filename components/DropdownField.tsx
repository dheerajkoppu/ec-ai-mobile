import React, { useState } from "react";
import { View, Text, StyleSheet, useColorScheme } from "react-native";
import { Dropdown } from "react-native-element-dropdown";

interface DropdownFieldProps {
  label: any;
  data: { label: string; value: string }[];
  value: string;
  onChange: (item: { label: string; value: string }) => void;
  placeholder: string;
}

const DropdownField: React.FC<DropdownFieldProps> = ({
  label,
  data,
  value,
  onChange,
  placeholder,
}) => {
  const [isFocus, setIsFocus] = useState(false);
  const scheme = useColorScheme();
  const isDark = scheme === "dark";

  return (
    <View style={styles.container}>
      {label && (
        <Text style={[styles.label, { color: isDark ? "#fff" : "#333" }]}>
          {label}
        </Text>
      )}
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
    marginBottom: 5,
  },
  dropdown: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
});

export default DropdownField;
