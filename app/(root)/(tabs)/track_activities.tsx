import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface Activity {
  id: number;
  name: string;
  category: string;
  hours: number;
}

const activitiesData: Activity[] = [
  {
    id: 1,
    name: "Volunteering at Shelter",
    category: "Volunteering",
    hours: 20,
  },
  { id: 2, name: "Basketball Training", category: "Sports", hours: 15 },
  { id: 3, name: "Math Club", category: "Academic Clubs", hours: 10 },
];

const TrackActivities = () => {
  const [activities, setActivities] = useState<Activity[]>(activitiesData);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortOption, setSortOption] = useState<string>("mostRecent");

  // Sorting function
  const sortActivities = (option: string) => {
    let sortedActivities = [...activities];

    if (option === "hours") {
      sortedActivities.sort((a, b) => b.hours - a.hours);
    } else if (option === "category") {
      sortedActivities.sort((a, b) => a.category.localeCompare(b.category));
    }

    setSortOption(option);
    setActivities(sortedActivities);
  };

  // Delete function
  const deleteActivity = (id: number) => {
    setActivities(activities.filter((activity) => activity.id !== id));
  };

  // Filter activities based on search query
  const filteredActivities = activities.filter((activity) =>
    activity.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <SafeAreaView className="flex-1 bg-white px-4 py-6">
      <Text className="text-lg font-bold mb-4">📋 Activities List</Text>

      {/* Search Bar */}
      <TextInput
        className="bg-gray-100 p-2 rounded-lg mb-4"
        placeholder="Search activities..."
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      {/* Sorting Options */}
      <View className="flex-row justify-between mb-4">
        <TouchableOpacity onPress={() => sortActivities("hours")}>
          <Text
            className={`text-blue-500 ${sortOption === "hours" ? "font-bold" : ""}`}
          >
            Sort by Hours
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => sortActivities("category")}>
          <Text
            className={`text-blue-500 ${sortOption === "category" ? "font-bold" : ""}`}
          >
            Sort by Category
          </Text>
        </TouchableOpacity>
      </View>

      {/* Activities List */}
      <FlatList
        data={filteredActivities}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View className="bg-gray-100 p-3 rounded-lg mb-2 flex-row justify-between">
            <Text>
              {item.name} - {item.category} ({item.hours} hrs)
            </Text>
            <TouchableOpacity onPress={() => deleteActivity(item.id)}>
              <Text className="text-red-500">Delete</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </SafeAreaView>
  );
};

export default TrackActivities;
