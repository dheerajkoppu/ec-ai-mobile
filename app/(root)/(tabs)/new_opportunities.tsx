import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import InputField from "@/components/InputField";
import CustomButton from "@/components/CustomButton";
import { Linking } from "react-native";

interface Opportunity {
  id: string;
  title: string;
  activityType: string;
  location: string;
  duration?: string;
  deadline?: string;
  apply?: string;
}

const opportunitiesData: Opportunity[] = [
  {
    id: "1",
    title: "Robotics Club",
    activityType: "Clubs",
    location: "In-Person",
    duration: "3 months",
    deadline: "March 20",
    apply: "https://www.youtube.com",
  },
  {
    id: "2",
    title: "Summer Internship at Tech Co.",
    activityType: "Internships",
    location: "Remote",
    duration: "2 months",
    deadline: "April 10",
    apply: "https://www.youtube.com",
  },
  {
    id: "3",
    title: "Math Competition",
    activityType: "Competitions",
    location: "In-Person",
    duration: "1 day",
    deadline: "March 25",
    apply: "https://www.youtube.com",
  },
];

const Opportunities = () => {
  const [opportunities, setOpportunities] =
    useState<Opportunity[]>(opportunitiesData);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [savedOpportunities, setSavedOpportunities] = useState<Set<string>>(
    new Set(),
  );
  const [addedOpportunities, setAddedOpportunities] = useState<Set<string>>(
    new Set(),
  );
  const [removedOpportunities, setRemovedOpportunities] = useState<Set<string>>(
    new Set(),
  );
  const [showSortDropdown, setShowSortDropdown] = useState<boolean>(false);

  // Save opportunity to AsyncStorage and update saved state
  const handleSave = async (opportunity: Opportunity) => {
    try {
      const savedOpportunities =
        await AsyncStorage.getItem("savedOpportunities");
      const savedList = savedOpportunities
        ? JSON.parse(savedOpportunities)
        : [];
      const isAlreadySaved = savedList.some(
        (item: Opportunity) => item.id === opportunity.id,
      );

      if (!isAlreadySaved) {
        const updatedList = [...savedList, opportunity];
        await AsyncStorage.setItem(
          "savedOpportunities",
          JSON.stringify(updatedList),
        );
        setSavedOpportunities((prev) => new Set([...prev, opportunity.id]));
      }
    } catch (error) {
      console.error("Error saving opportunity:", error);
    }
  };

  const handleAutoAdd = (id: string) => {
    setAddedOpportunities((prev) => new Set([...prev, id]));
  };

  // Refresh function - removes saved or added opportunities on refresh
  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRemovedOpportunities(
        new Set([...savedOpportunities, ...addedOpportunities]),
      );
      setSavedOpportunities(new Set()); // Reset saved state
      setAddedOpportunities(new Set()); // Reset added state
      setRefreshing(false);
    }, 1000);
  };

  const filteredOpportunities = opportunities
    .filter((opportunity) => !removedOpportunities.has(opportunity.id))
    .filter(
      (opportunity) =>
        opportunity.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        opportunity.activityType
          .toLowerCase()
          .includes(searchQuery.toLowerCase()),
    );

  // Sorting function
  const sortOpportunities = () => {
    const sortedOpportunities = [...opportunities].sort((a, b) =>
      a.activityType.localeCompare(b.activityType),
    );
    setOpportunities(sortedOpportunities);
    setShowSortDropdown(false);
  };

  return (
    <SafeAreaView className="flex-1 bg-primary-200 px-4 py-6">
      <Text className="text-3xl font-bold text-gray-800 font-PoppinsBold pb-2">
        New Opportunities
      </Text>

      {/* Search Bar */}
      <View className="mb-4">
        <InputField
          label=""
          keyboardShouldPersistTaps="never"
          placeholder="Search Opportunities"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Sorting Options */}
      <View className="flex-row mb-4 relative z-10">
        <TouchableOpacity
          onPress={() => setShowSortDropdown(!showSortDropdown)}
        >
          <Text className="text-general-400 font-PoppinsBold">Sort By ▾</Text>
        </TouchableOpacity>
        {showSortDropdown && (
          <View className="absolute bg-white p-2 rounded-lg shadow-lg px-5 mt-6 py-2.5 z-20">
            <TouchableOpacity onPress={sortOpportunities}>
              <Text className="text-general-400 font-PoppinsSemiBold">
                Career Field
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* List of Opportunities */}
      <FlatList
        data={filteredOpportunities}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 80 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        renderItem={({ item }) => (
          <View className="bg-white p-4 mb-4 rounded-lg shadow">
            <Text className="font-PoppinsSemiBold text-base mb-2">
              {item.title}
            </Text>
            <Text className="font-PoppinsRegular text-xs mb-1">
              <Text className="font-PoppinsSemiBold">Activity Type:</Text>{" "}
              {item.activityType}
            </Text>
            <Text className="font-PoppinsRegular text-xs mb-1">
              <Text className="font-PoppinsSemiBold">Location: </Text>{" "}
              {item.location}
            </Text>
            {item.duration && (
              <Text className="font-PoppinsRegular text-xs mb-1">
                <Text className="font-PoppinsSemiBold">Duration: </Text>{" "}
                {item.duration}
              </Text>
            )}
            {item.deadline && (
              <Text className="font-PoppinsRegular text-xs mb-1">
                <Text className="font-PoppinsSemiBold">Deadline: </Text>{" "}
                {item.deadline}
              </Text>
            )}
            {item.apply && (
              <View className="flex-row flex-wrap items-center">
                <Text className="font-PoppinsSemiBold text-xs">Apply: </Text>
                <TouchableOpacity onPress={() => Linking.openURL(item.apply!)}>
                  <Text className="text-blue-500 underline font-PoppinsRegular text-xs">
                    {item.apply}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
            {/* Buttons */}
            <View className="flex-row justify-between mt-4">
              <CustomButton
                title={
                  addedOpportunities.has(item.id) ? "Added" : "Add Activity"
                }
                onPress={() => handleAutoAdd(item.id)}
                bgVariant="primary"
                textVariant="default"
                className={`px-4 py-2 rounded-lg flex-1 mr-2 items-center ${
                  addedOpportunities.has(item.id)
                    ? "bg-primary-900"
                    : "bg-primary"
                }`}
              />

              <CustomButton
                title={savedOpportunities.has(item.id) ? "Saved" : "Save"}
                onPress={() => handleSave(item)}
                bgVariant="primary"
                textVariant="default"
                className={`px-4 py-2 rounded-lg flex-1 items-center ${
                  savedOpportunities.has(item.id)
                    ? "bg-primary-900"
                    : "bg-primary"
                }`}
              />
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
};

export default Opportunities;
