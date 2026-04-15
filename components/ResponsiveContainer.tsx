import type { ReactNode } from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";
import { useResponsiveLayout } from "@/lib/responsive";

type ResponsiveContainerProps = {
  children: ReactNode;
  maxWidth?: number;
  style?: StyleProp<ViewStyle>;
};

const ResponsiveContainer = ({
  children,
  maxWidth,
  style,
}: ResponsiveContainerProps) => {
  const { contentMaxWidth } = useResponsiveLayout();

  return (
    <View
      style={[
        {
          width: "100%",
          alignSelf: "center",
          maxWidth: maxWidth ?? contentMaxWidth,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
};

export default ResponsiveContainer;
