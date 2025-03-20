import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import InputField from "@/components/InputField";
import CustomButton from "@/components/CustomButton";

interface Opportunity {
  id: string;
  title: string;
  careerField: string;
  location: string;
  duration?: string;
  deadline?: string;
}

const opportunitiesData: Opportunity[] = [
  {
    id: "1",
    title: "Robotics Club",
    careerField: "Clubs",
    location: "In-Person",
    duration: "3 months",
    deadline: "March 20",
  },
  {
    id: "2",
    title: "Summer Internship at Tech Co.",
    careerField: "Internships",
    location: "Remote",
    duration: "2 months",
    deadline: "April 10",
  },
  {
    id: "3",
    title: "Math Competition",
    careerField: "Competitions",
    location: "In-Person",
    duration: "1 day",
    deadline: "March 25",
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

  const handleSave = (id: string) => {
    setSavedOpportunities((prev) => new Set([...prev, id]));
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

  // Filter out removed opportunities only after refresh
  const filteredOpportunities = opportunities.filter(
    (opportunity) => !removedOpportunities.has(opportunity.id),
  );

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
              <Text className="font-PoppinsSemiBold">Field:</Text>{" "}
              {item.careerField}
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

            {/* Buttons */}
            <View className="flex-row justify-between mt-4">
              <CustomButton
                title={
                  addedOpportunities.has(item.id) ? "Added" : "Add Activity"
                }
                onPress={() => handleAutoAdd(item.id)}
                bgVariant="primary" // Keep valid value
                textVariant="default"
                className={`px-4 py-2 rounded-lg flex-1 mr-2 items-center ${
                  addedOpportunities.has(item.id)
                    ? "bg-primary-900"
                    : "bg-primary"
                }`}
              />

              <CustomButton
                title={savedOpportunities.has(item.id) ? "Saved" : "Save"}
                onPress={() => handleSave(item.id)}
                bgVariant="primary" // Keep valid value
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
