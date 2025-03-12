import { Tabs } from "expo-router";
import {
  Image,
  View,
  ImageSourcePropType,
  TouchableOpacity,
} from "react-native";
import { icons } from "@/constants";
import { useNavigation } from "@react-navigation/native"; // Import navigation hook

const TabIcon = ({
  source,
  focused,
  screenName,
}: {
  source: ImageSourcePropType;
  focused: boolean;
  screenName: string;
}) => {
  const navigation = useNavigation(); // Get navigation instance

  return (
    <TouchableOpacity
      onPress={() => navigation.navigate(screenName as never)} // Navigate correctly
      hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }} // Expands tap area
      activeOpacity={1} // Prevents flickering effect
    >
      <View
        className={`flex flex-row justify-center items-center rounded-full ${focused ? "#F5F7FA" : ""}`}
      >
        <View
          className={`rounded-full w-14 h-14 items-center justify-center ${focused ? "bg-primary-900" : ""}`}
        >
          <Image source={source} resizeMode="contain" className="w-7 h-7" />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const Layout = () => (
  <Tabs
    initialRouteName="home"
    screenOptions={{
      tabBarActiveTintColor: "white",
      tabBarInactiveTintColor: "#F5F7FA",
      tabBarShowLabel: false,
      tabBarStyle: {
        backgroundColor: "#5b55f6",
        paddingBottom: 50,
        height: 100,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexDirection: "row",
        position: "absolute",
      },
      tabBarItemStyle: {
        paddingVertical: 20, // Expands the touch area vertically
      },
    }}
  >
    <Tabs.Screen
      name="home"
      options={{
        title: "Home",
        headerShown: false,
        tabBarIcon: ({ focused }) => (
          <TabIcon focused={focused} source={icons.home1} screenName="home" />
        ),
      }}
    />
    <Tabs.Screen
      name="track_activities"
      options={{
        title: "Track Activities",
        headerShown: false,
        tabBarIcon: ({ focused }) => (
          <TabIcon
            focused={focused}
            source={icons.track_activities1}
            screenName="track_activities"
          />
        ),
      }}
    />
    <Tabs.Screen
      name="add_activity"
      options={{
        title: "Add Activity",
        headerShown: false,
        tabBarIcon: ({ focused }) => (
          <TabIcon
            focused={focused}
            source={icons.add_activity1}
            screenName="add_activity"
          />
        ),
      }}
    />
    <Tabs.Screen
      name="new_opportunities"
      options={{
        title: "New Opportunities",
        headerShown: false,
        tabBarIcon: ({ focused }) => (
          <TabIcon
            focused={focused}
            source={icons.new_opportunities1}
            screenName="new_opportunities"
          />
        ),
      }}
    />
    <Tabs.Screen
      name="profile"
      options={{
        title: "Profile",
        headerShown: false,
        tabBarIcon: ({ focused }) => (
          <TabIcon
            focused={focused}
            source={icons.profile1}
            screenName="profile"
          />
        ),
      }}
    />
  </Tabs>
);

export default Layout;
