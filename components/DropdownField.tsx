import React, { useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Dropdown } from "react-native-element-dropdown";

// Define TypeScript types for the props
interface DropdownFieldProps {
  label: string;
  data: { label: string; value: string }[]; // Expecting an array of objects
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

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <Dropdown
        data={data}
        labelField="label"
        valueField="value"
        value={value}
        onChange={onChange}
        placeholder={!isFocus ? placeholder : "..."}
        onFocus={() => setIsFocus(true)}
        onBlur={() => setIsFocus(false)}
        style={styles.dropdown}
        containerStyle={styles.dropdownContainer}
        itemTextStyle={styles.itemText}
        selectedTextStyle={styles.selectedText}
      />
    </View>
  );
};

// Styles to mimic `InputField`
const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
    width: "100%",
  },
  label: {
    fontSize: 18,
    fontFamily: "Poppins-Bold",
    marginBottom: 5,
    color: "#333",
  },
  dropdown: {
    backgroundColor: "white",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  dropdownContainer: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 10,
  },
  itemText: {
    fontSize: 15,
    fontFamily: "Poppins-Regular",
    color: "#555",
  },
  selectedText: {
    fontSize: 15,
    fontFamily: "Poppins-Regular",
    color: "#111",
  },
});

export default DropdownField;
