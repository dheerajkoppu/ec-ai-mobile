import { SignedIn, useUser } from "@clerk/clerk-expo";
import { View, Text, Image, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Home() {
  const { user } = useUser();

  // Placeholder data (replace with actual API calls or state management)
  const activitiesThisWeek = 5;
  const totalHoursLogged = 40;
  const streak = 7;
  const recentActivities = [
    { name: "Volunteered at shelter", timestamp: "2 days ago" },
    { name: "Hackathon Participation", timestamp: "4 days ago" },
    { name: "Comp Sci Club Meeting", timestamp: "6 days ago" },
  ];

  return (
    <SafeAreaView className="flex-1 bg-white px-4 py-6">
      <SignedIn>
        <ScrollView>
          {/* User Snapshot */}
          <View className="flex-row items-center mb-4">
            <Image
              source={{ uri: user?.imageUrl }}
              className="w-16 h-16 rounded-full"
            />
            <View className="ml-4">
              <Text className="text-lg font-semibold">
                Hello, {user?.fullName}!
              </Text>
              <Text className="text-gray-500">
                Total Hours Logged: {totalHoursLogged}
              </Text>
            </View>
          </View>

          {/* Quick Stats */}
          <View className="bg-gray-100 p-4 rounded-lg mb-4">
            <Text className="text-md font-semibold">Quick Stats</Text>
            <Text>Activities this week: {activitiesThisWeek}</Text>
            <Text>Streak: {streak} days</Text>
          </View>

          {/* Recent Activities */}
          <View className="mb-4">
            <Text className="text-md font-semibold mb-2">
              Recent Activities
            </Text>
            {recentActivities.map((activity, index) => (
              <View
                key={index}
                className="flex-row justify-between py-2 border-b border-gray-200"
              >
                <Text>{activity.name}</Text>
                <Text className="text-gray-500 text-sm">
                  {activity.timestamp}
                </Text>
              </View>
            ))}
          </View>

          {/* Shortcuts */}
          <View className="mb-4">
            <Text className="text-md font-semibold mb-2">Quick Actions</Text>
            <TouchableOpacity className="bg-blue-500 p-3 rounded-lg mb-2">
              <Text className="text-white text-center">Track Activities</Text>
            </TouchableOpacity>
            <TouchableOpacity className="bg-green-500 p-3 rounded-lg">
              <Text className="text-white text-center">
                Discover New Opportunities
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SignedIn>
    </SafeAreaView>
  );
}
