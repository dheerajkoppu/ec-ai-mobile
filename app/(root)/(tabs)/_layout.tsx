import { Tabs } from "expo-router";
import { Image, View, TouchableOpacity } from "react-native";
import { useUser } from "@clerk/clerk-expo";
import { useNavigation } from "@react-navigation/native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

interface TabIconProps {
  filledIconName: keyof typeof MaterialCommunityIcons.glyphMap;
  outlineIconName: keyof typeof MaterialCommunityIcons.glyphMap;
  focused: boolean;
  screenName: string;
  isProfile?: boolean;
  profileImage?: string | null;
}

const TabIcon = ({
  filledIconName,
  outlineIconName,
  focused,
  screenName,
  isProfile,
  profileImage,
}: TabIconProps) => {
  const navigation = useNavigation();
  return (
    <TouchableOpacity
      onPress={() => navigation.navigate(screenName as never)}
      hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
      activeOpacity={1}
    >
      <View
        className={`flex flex-row justify-center items-center rounded-full ${focused ? "#F5F7FA" : ""}`}
      >
        <View className="rounded-full w-14 h-14 items-center justify-center">
          {isProfile && profileImage ? (
            // When the profile icon is focused, add a black outline.
            <View
              className={`${focused ? "border-2 border-black rounded-full" : ""}`}
            >
              <Image
                source={{ uri: profileImage }}
                className="w-10 h-10 rounded-full"
              />
            </View>
          ) : (
            <MaterialCommunityIcons
              name={focused ? filledIconName : outlineIconName}
              size={35}
              color={focused ? "white" : "#F5F7FA"}
            />
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const Layout = () => {
  const { user } = useUser();
  const profileImage = user?.imageUrl;

  return (
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
          paddingVertical: 20,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              filledIconName="home"
              outlineIconName="home-outline"
              screenName="home"
            />
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
              filledIconName="clipboard-list"
              outlineIconName="clipboard-list-outline"
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
              filledIconName="plus-thick"
              outlineIconName="plus-outline"
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
              filledIconName="briefcase"
              outlineIconName="briefcase-outline"
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
              filledIconName="account"
              outlineIconName="account-outline"
              screenName="profile"
              isProfile={true}
              profileImage={profileImage}
            />
          ),
        }}
      />
    </Tabs>
  );
};

export default Layout;
