import { Tabs } from "expo-router";
import { Image, View, TouchableOpacity } from "react-native";
import { useUser } from "@clerk/clerk-expo";
import { useNavigation } from "@react-navigation/native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

// @ts-ignore
const TabIcon = ({
  filledIconName,
  outlineIconName,
  filledImageSource, // <-- ADD
  outlineImageSource, // <-- ADD
  focused,
  screenName,
  isProfile,
  profileImage,
}: TabIconProps) => {
  const navigation = useNavigation();
  const icon = focused ? filledIconName : outlineIconName;
  const purple = "#5b55f6";
  const size = 53;

  return (
    <TouchableOpacity
      onPress={() => navigation.navigate(screenName as never)}
      hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
      activeOpacity={1}
    >
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: "white",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {isProfile && profileImage ? (
          <View
            style={{
              borderWidth: focused ? 2 : 0,
              borderColor: "#5b55f6",
              borderRadius: size / 2,
              padding: focused ? 2 : 0,
            }}
          >
            <Image
              source={{ uri: profileImage }}
              style={{
                width: size - 16,
                height: size - 16,
                borderRadius: (size - 16) / 2,
              }}
            />
          </View>
        ) : filledImageSource && outlineImageSource ? (
          <Image
            source={focused ? filledImageSource : outlineImageSource}
            style={{
              width: 28,
              height: 28,
              resizeMode: "contain",
            }}
          />
        ) : (
          <MaterialCommunityIcons name={icon} size={28} color={purple} />
        )}
      </View>
    </TouchableOpacity>
  );
};

const Layout = () => {
  const { user } = useUser();
  const profileImage = user?.imageUrl;

  return (
    <Tabs
      initialRouteName="saved_opportunities"
      screenOptions={{
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: "#F5F7FA",
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
        name="opportunity_match"
        options={{
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              filledIconName="home"
              outlineIconName="home-outline"
              screenName="opportunity_match"
            />
          ),
        }}
      />

      <Tabs.Screen
        name="track_activities"
        options={{
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
        name="saved_opportunities"
        options={{
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              filledIconName="star"
              outlineIconName="star-outline"
              screenName="saved_opportunities"
            />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              filledIconName="account"
              outlineIconName="account-outline"
              screenName="profile"
              isProfile
              profileImage={profileImage}
            />
          ),
        }}
      />
    </Tabs>
  );
};

export default Layout;
