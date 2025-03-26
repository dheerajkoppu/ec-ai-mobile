import { useState, useEffect } from "react";
import { Tabs } from "expo-router";
import {
  Image,
  View,
  ImageSourcePropType,
  TouchableOpacity,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { icons } from "@/constants";
import { useNavigation } from "@react-navigation/native"; // Import navigation hook

// TabIcon Component for custom icons
const TabIcon = ({
  source,
  focused,
  screenName,
  isProfile,
  profileImage,
}: {
  source: ImageSourcePropType;
  focused: boolean;
  screenName: string;
  isProfile?: boolean;
  profileImage?: string | null;
}) => {
  const navigation = useNavigation(); // Get navigation instance

  return (
    <TouchableOpacity
      onPress={() => navigation.navigate(screenName as never)} // Navigate correctly
      hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }} // Expands tap area
      activeOpacity={1} // Prevents flickering effect
    >
      <View
        className={`flex flex-row justify-center items-center rounded-full ${
          focused ? "#F5F7FA" : ""
        }`}
      >
        <View
          className={`rounded-full w-14 h-14 items-center justify-center ${
            focused ? "bg-primary-900" : ""
          }`}
        >
          {isProfile && profileImage ? (
            <Image
              source={{ uri: profileImage }}
              className="w-10 h-10 rounded-full"
            />
          ) : (
            <Image source={source} resizeMode="contain" className="w-7 h-7" />
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

// Layout Component for the tab bar
const Layout = () => {
  const [profileImage, setProfileImage] = useState<string | null>(null);

  useEffect(() => {
    const loadProfileImage = async () => {
      // Fetch the profile image from AsyncStorage
      const storedImage = await AsyncStorage.getItem("profileImage");
      if (storedImage) {
        setProfileImage(storedImage);
      }
    };
    loadProfileImage();
  }, []);

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
              isProfile={true} // Mark as Profile tab
              profileImage={profileImage} // Pass profileImage to the icon
            />
          ),
        }}
      />
    </Tabs>
  );
};

export default Layout;
