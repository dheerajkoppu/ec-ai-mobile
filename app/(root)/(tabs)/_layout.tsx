import { Tabs } from "expo-router";
import { Image, View, ImageSourcePropType } from "react-native";
import { icons } from "@/constants";

const TabIcon = ({
  source,
  focused,
}: {
  source: ImageSourcePropType;
  focused: boolean;
}) => (
  <View
    className={`flex flex-row justify-center items-center rounded-full ${focused ? "bg-general-400" : ""}`}
  >
    <View
      className={`rounded-full w-12 h-12 items-center justify-center ${focused ? "bg-general-400" : ""}`}
    >
      <Image source={source} resizeMode="contain" className="w-7 h-7" />
    </View>
  </View>
);

const Layout = () => (
  <Tabs
    initialRouteName="home"
    screenOptions={{
      tabBarActiveTintColor: "white",
      tabBarInactiveTintColor: "white",
      tabBarShowLabel: false,
      tabBarStyle: {
        backgroundColor: "#f5f7fa",
        borderRadius: 50,
        paddingBottom: 0,
        overflow: "hidden",
        marginHorizontal: 20,
        marginBottom: 20,
        height: 78,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexDirection: "row",
        position: "absolute",
      },
    }}
  >
    <Tabs.Screen
      name="home"
      options={{
        title: "Home",
        headerShown: false,
        tabBarIcon: ({ focused }) => (
          <TabIcon focused={focused} source={icons.home1} />
        ),
      }}
    />
    <Tabs.Screen
      name="track_activities"
      options={{
        title: "Track Activities",
        headerShown: false,
        tabBarIcon: ({ focused }) => (
          <TabIcon focused={focused} source={icons.track_activities1} />
        ),
      }}
    />
    <Tabs.Screen
      name="add_activity"
      options={{
        title: "Add Activity",
        headerShown: false,
        tabBarIcon: ({ focused }) => (
          <TabIcon focused={focused} source={icons.add_activity1} />
        ),
      }}
    />
    <Tabs.Screen
      name="new_opportunities"
      options={{
        title: "New Opportunities",
        headerShown: false,
        tabBarIcon: ({ focused }) => (
          <TabIcon focused={focused} source={icons.new_opportunities1} />
        ),
      }}
    />
    <Tabs.Screen
      name="profile"
      options={{
        title: "Profile",
        headerShown: false,
        tabBarIcon: ({ focused }) => (
          <TabIcon focused={focused} source={icons.profile1} />
        ),
      }}
    />
  </Tabs>
);

export default Layout;
