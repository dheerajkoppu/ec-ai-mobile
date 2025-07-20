// components/NativeAdCard.web.tsx
import { View, Text } from "react-native";

export default function NativeAdCard() {
  return (
    <View
      style={{
        height: 100,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text style={{ color: "#999" }}>Ad placeholder (not shown on web)</Text>
    </View>
  );
}
