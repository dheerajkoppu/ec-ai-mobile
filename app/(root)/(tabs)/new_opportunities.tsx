import { useState } from "react";
import { View, Text, TouchableOpacity, FlatList } from "react-native";
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
  const [savedOpportunities, setSavedOpportunities] = useState<Set<string>>(
    new Set(),
  );
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [addedOpportunities, setAddedOpportunities] = useState<Set<string>>(
    new Set(),
  );
  const [sortOption, setSortOption] = useState<string>("default");
  const [showSortDropdown, setShowSortDropdown] = useState<boolean>(false);

  const handleSave = (id: string) => {
    setSavedOpportunities((prev) => new Set([...prev, id]));
  };

  const handleAutoAdd = (id: string) => {
    setAddedOpportunities((prev) => new Set([...prev, id]));
  };

  // Sorting function
  const sortOpportunities = (option: string) => {
    let sortedOpportunities = [...opportunities];
    if (option === "careerField") {
      sortedOpportunities.sort((a, b) =>
        a.careerField.localeCompare(b.careerField),
      );
    }
    setSortOption(option);
    setOpportunities(sortedOpportunities);
    setShowSortDropdown(false);
  };

  // Filter activities based on search query
  const filteredOpportunities = opportunities.filter((opportunity) =>
    opportunity.title.toLowerCase().includes(searchQuery.toLowerCase()),
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

      {/* Sorting Options */}
      <View className="flex-row mb-4 relative z-10">
        <TouchableOpacity
          onPress={() => setShowSortDropdown(!showSortDropdown)}
        >
          <Text className="text-general-400 font-PoppinsBold">Sort By ▾</Text>
        </TouchableOpacity>
        {showSortDropdown && (
          <View className="absolute bg-white p-2 rounded-lg shadow-lg px-5 mt-6  py-3 z-20">
            <TouchableOpacity onPress={() => sortOpportunities("careerField")}>
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
                bgVariant="primary"
                textVariant="default"
                className="px-4 py-2 rounded-lg flex-1 mr-2 items-center"
              />
              <CustomButton
                title={savedOpportunities.has(item.id) ? "Saved" : "Save"}
                onPress={() => handleSave(item.id)}
                bgVariant="primary"
                textVariant="default"
                className="px-4 py-0 rounded-lg flex-1 items-center"
              />
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
};

export default Opportunities;
