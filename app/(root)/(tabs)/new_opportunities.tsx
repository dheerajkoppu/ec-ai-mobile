import { Text, View, FlatList, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState } from "react";

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

  const handleSave = (id: string) => {
    setSavedOpportunities((prev) => new Set(prev).add(id));
  };

  return (
    <SafeAreaView style={{ padding: 20, backgroundColor: "#f5f7fa" }}>
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
      <FlatList
        data={opportunities}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View
            style={{
              padding: 10,
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
            <TouchableOpacity
              onPress={() => handleSave(item.id)}
              style={{
                marginTop: 5,
                backgroundColor: "#5b55f6",
                padding: 5,
                borderRadius: 5,
              }}
            >
              <Text
                style={{
                  color: "white",
                  textAlign: "center",
                  fontFamily: "Poppins",
                }}
              >
                {savedOpportunities.has(item.id) ? "Saved" : "Apply Now"}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </SafeAreaView>
  );
};

export default New_Opportunities;
