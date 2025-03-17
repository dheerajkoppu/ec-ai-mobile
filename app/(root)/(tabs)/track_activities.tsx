import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FontAwesome } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";

interface Activity {
  id: number;
  name: string;
  category: string;
  hours: number;
  weeksPerYear: number;
  description: string;
}

const activitiesData: Activity[] = [
  {
    id: 1,
    name: "Volunteering at Shelter",
    category: "Volunteering",
    hours: 20,
    weeksPerYear: 40,
    description: "Helping at a local animal shelter.",
  },
  {
    id: 2,
    name: "Basketball Training",
    category: "Sports",
    hours: 15,
    weeksPerYear: 35,
    description: "Weekly basketball practice and games.",
  },
  {
    id: 3,
    name: "Math Club",
    category: "Academic Clubs",
    hours: 10,
    weeksPerYear: 30,
    description: "Problem-solving and competition prep.",
  },
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
    <SafeAreaView className="flex-1 bg-[#f5f7fa] px-4 py-6">
      <Text className="text-2xl font-black text-black mb-4 font-poppins">
        Track Activities
      </Text>

      {/* Search Bar */}
      <TextInput
        className="bg-gray-100 p-2 rounded-lg mb-4 font-poppins"
        placeholder="Search activities..."
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      {/* Filter Dropdown */}
      <Picker
        selectedValue={sortOption}
        onValueChange={(itemValue: string) => sortActivities(itemValue)}
        className="bg-gray-200 p-2 rounded-lg mb-4 font-poppins"
      >
        <Picker.Item label="Sort by Hours" value="hours" />
        <Picker.Item label="Sort by Category" value="category" />
      </Picker>

      {/* Activities List */}
      <FlatList
        data={filteredActivities}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View className="bg-[#5b55f6] p-4 rounded-lg mb-3">
            <Text className="text-white font-poppins text-lg font-bold">
              {item.name}
            </Text>
            <Text className="text-white font-poppins">
              {item.category} ({item.hours} hrs per week, {item.weeksPerYear}{" "}
              weeks per year)
            </Text>
            <Text className="text-white font-poppins text-sm">
              {item.description}
            </Text>
            <View className="flex-row justify-end mt-2">
              <TouchableOpacity className="mr-4">
                <FontAwesome name="pencil" size={20} color="white" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => deleteActivity(item.id)}>
                <FontAwesome name="trash" size={20} color="white" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
};

export default TrackActivities;
