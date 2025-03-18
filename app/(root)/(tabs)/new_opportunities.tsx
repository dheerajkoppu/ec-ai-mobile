import { Text, View, FlatList, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState } from "react";
import { Picker } from "@react-native-picker/picker";

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

const New_Opportunities = () => {
  const [opportunities, setOpportunities] =
    useState<Opportunity[]>(opportunitiesData);
  const [savedOpportunities, setSavedOpportunities] = useState<Set<string>>(
    new Set(),
  );
  const [addedOpportunities, setAddedOpportunities] = useState<Set<string>>(
    new Set(),
  );
  const [sortOption, setSortOption] = useState<string>("default");

  const handleSave = (id: string) => {
    setSavedOpportunities((prev) => new Set([...prev, id]));
  };

  const handleAutoAdd = (id: string) => {
    setAddedOpportunities((prev) => new Set([...prev, id]));
  };

  const sortOpportunities = (option: string) => {
    let sortedOpportunities = [...opportunities];
    if (option === "careerField") {
      sortedOpportunities.sort((a, b) =>
        a.careerField.localeCompare(b.careerField),
      );
    }
    setSortOption(option);
    setOpportunities(sortedOpportunities);
  };

  return (
    <SafeAreaView style={{ padding: 20 }}>
      <Text
        style={{
          fontSize: 30,
          fontWeight: "bold",
          marginBottom: 10,
          fontFamily: "Poppins",
        }}
      >
        New Opportunities
      </Text>

      {/* Sorting Dropdown */}
      <View style={{ marginBottom: 15 }}>
        <Picker
          selectedValue={sortOption}
          onValueChange={(itemValue) => sortOpportunities(itemValue)}
          style={{ height: 50, backgroundColor: "white", borderRadius: 8 }}
        >
          <Picker.Item label="Sort by Career Field" value="default" />
          <Picker.Item label="Career Field" value="careerField" />
        </Picker>
      </View>

      <FlatList
        data={opportunities}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View
            style={{
              padding: 15,
              backgroundColor: "white",
              marginBottom: 10,
              borderRadius: 8,
            }}
          >
            <Text
              style={{
                fontSize: 16,
                fontWeight: "bold",
                fontFamily: "Poppins",
              }}
            >
              {item.title}
            </Text>
            <Text style={{ fontFamily: "Poppins" }}>
              Career Field: {item.careerField}
            </Text>
            <Text style={{ fontFamily: "Poppins" }}>
              Location: {item.location}
            </Text>
            {item.duration && (
              <Text style={{ fontFamily: "Poppins" }}>
                Duration: {item.duration}
              </Text>
            )}
            {item.deadline && (
              <Text style={{ fontFamily: "Poppins" }}>
                Deadline: {item.deadline}
              </Text>
            )}

            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginTop: 10,
              }}
            >
              <TouchableOpacity
                onPress={() => handleAutoAdd(item.id)}
                style={{
                  backgroundColor: "#5b55f6",
                  paddingVertical: 8,
                  paddingHorizontal: 15,
                  borderRadius: 5,
                  flex: 1,
                  marginRight: 10,
                  alignItems: "center",
                }}
              >
                <Text style={{ color: "white", fontFamily: "Poppins" }}>
                  {addedOpportunities.has(item.id)
                    ? "Added"
                    : "Auto-add Activity"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleSave(item.id)}
                style={{
                  backgroundColor: "#5b55f6",
                  paddingVertical: 8,
                  paddingHorizontal: 15,
                  borderRadius: 5,
                  flex: 1,
                  alignItems: "center",
                }}
              >
                <Text style={{ color: "white", fontFamily: "Poppins" }}>
                  {savedOpportunities.has(item.id) ? "Saved" : "Save"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
};

export default New_Opportunities;
