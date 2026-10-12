import { View, Text } from "react-native";

/** Web stand-in for the native ad card. AdMob only runs on iOS and Android. */
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
