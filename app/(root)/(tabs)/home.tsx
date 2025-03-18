import { SignedIn, useUser } from "@clerk/clerk-expo";
import { View, Text, Image, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";

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
    <SafeAreaView className="flex-1 bg-primary-200 px-4 py-6 font-PoppinsBlack">
      <SignedIn>
        <ScrollView>
          {/* User Snapshot */}
          <View className="flex-row items-center mb-4">
            <Image
              source={{ uri: user?.imageUrl }}
              className="w-16 h-16 rounded-full"
            />
            <View className="ml-4">
              <Text className="text-lg font-PoppinsSemiBold">
                Hello, {user?.fullName}!
              </Text>
              <Text className="text-gray-500 font-PoppinsRegular">
                Total Hours Logged: {totalHoursLogged}
              </Text>
            </View>
          </View>

          {/* Quick Stats */}
          <View className="bg-general-400 p-6 rounded-lg mb-4 space-y-2">
            <Text className="text-xl text-white font-PoppinsSemiBold">
              Quick Stats
            </Text>
            <Text className="text-white text-base font-PoppinsSemiBold ">
              Activities this week:{" "}
              <Text className="font-normal">{activitiesThisWeek}</Text>
            </Text>
            <Text className="text-white text-base font-PoppinsSemiBold font-bold">
              Streak: <Text className="font-normal">{streak} days</Text>
            </Text>
          </View>

          {/* Quick Stats */}

          {/* Recent Activities */}
          <View className="bg-white p-6 rounded-xl shadow-lg mb-4">
            <Text className="text-xl font-PoppinsBold text-gray-900 mb-4">
              Recent Activities
            </Text>
            {recentActivities.map((activity, index) => (
              <View
                key={index}
                className="flex-row justify-between font-PoppinsRegular items-center py-3 border-b border-gray-200 last:border-b-0"
              >
                <Text className="text-base text-gray-800">{activity.name}</Text>
                <Text className="text-sm text-gray-500">
                  {activity.timestamp}
                </Text>
              </View>
            ))}
          </View>

          {/* Shortcuts */}
          <View className="mb-4">
            <TouchableOpacity
              onPress={() => {
                router.push("/track_activities");
              }}
              className="bg-general-400  p-3 rounded-lg mb-2"
            >
              <Text className="text-white font-PoppinsSemiBold text-base text-center">
                Track Activities
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                router.push("/new_opportunities");
              }}
              className="bg-general-400  p-3 rounded-lg"
            >
              <Text className="text-white font-PoppinsSemiBold text-base text-center">
                Discover New Opportunities
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SignedIn>
    </SafeAreaView>
  );
}
