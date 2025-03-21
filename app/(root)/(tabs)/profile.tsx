import { useUser, useClerk } from "@clerk/clerk-expo";
import {
  View,
  Text,
  Image,
  ScrollView,
  Switch,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState } from "react";
import { SignOutButton } from "@/components/SignOutButton";

const Profile = () => {
  const { user } = useUser();
  const { signOut } = useClerk();
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);

  return (
    <SafeAreaView className="flex-1 bg-primary-200 px-4 py-6">
      <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
        {/* Profile Information */}
        <View className="items-center mb-6">
          <Image
            source={{ uri: user?.imageUrl }}
            className="w-24 h-24 rounded-full"
          />
          <Text className="text-lg font-PoppinsSemiBold mt-2">
            {user?.fullName}
          </Text>
          <Text className="text-primary-900 font-PoppinsRegular">
            {user?.primaryEmailAddress?.emailAddress}
          </Text>
        </View>

        {/* Customization */}
        <View className="mb-4">
          <Text className="text-md font-semibold mb-2">Customization</Text>
          <TouchableOpacity className="bg-gray-100 p-3 rounded-lg mb-2">
            <Text>Preferred Extracurricular Categories</Text>
          </TouchableOpacity>
          <TouchableOpacity className="bg-gray-100 p-3 rounded-lg">
            <Text>Goal Tracking (Weekly/Monthly)</Text>
          </TouchableOpacity>
        </View>

        {/* Account Settings */}
        <View className="mb-4">
          <Text className="text-md font-semibold mb-2">Account Settings</Text>
          <View className="flex-row justify-between py-2">
            <Text>Notifications</Text>
            <Switch value={notifications} onValueChange={setNotifications} />
          </View>
          <TouchableOpacity className="bg-gray-100 p-3 rounded-lg">
            <Text>Privacy Preferences</Text>
          </TouchableOpacity>
          <TouchableOpacity className="bg-gray-100 p-3 rounded-lg mt-2">
            <Text>Export Data (PDF/CSV)</Text>
          </TouchableOpacity>
        </View>

        {/* App Settings */}
        <View className="mb-4">
          <Text className="text-md font-semibold mb-2">App Settings</Text>
          <View className="flex-row justify-between py-2">
            <Text>AI Features</Text>
            <Switch value={darkMode} onValueChange={setDarkMode} />
          </View>
          <TouchableOpacity className="bg-gray-100 p-3 rounded-lg">
            <Text>Language Preferences</Text>
          </TouchableOpacity>
        </View>

        {/* Help & Support */}
        <View className="mb-4">
          <Text className="text-md font-semibold mb-2">Help & Support</Text>
          <TouchableOpacity className="bg-gray-100 p-3 rounded-lg mb-2">
            <Text>FAQs</Text>
          </TouchableOpacity>
          <TouchableOpacity className="bg-gray-100 p-3 rounded-lg mb-2">
            <Text>Contact Support</Text>
          </TouchableOpacity>
          <TouchableOpacity className="bg-gray-100 p-3 rounded-lg">
            <Text>Submit Feedback</Text>
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <SignOutButton />
      </ScrollView>
    </SafeAreaView>
  );
};

export default Profile;
