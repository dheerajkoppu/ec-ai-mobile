import { Text, View, FlatList, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState } from "react";

interface Opportunity {
  id: string;
  title: string;
  category: string;
  location: string;
  difficulty: string;
  deadline?: string;
}

const opportunitiesData: Opportunity[] = [
  {
    id: "1",
    title: "Robotics Club",
    category: "Clubs",
    location: "In-Person",
    difficulty: "Medium",
    deadline: "March 20",
  },
  {
    id: "2",
    title: "Summer Internship at Tech Co.",
    category: "Internships",
    location: "Remote",
    difficulty: "Hard",
    deadline: "April 10",
  },
  {
    id: "3",
    title: "Math Competition",
    category: "Competitions",
    location: "In-Person",
    difficulty: "Hard",
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
    <SafeAreaView style={{ padding: 20 }}>
      <Text style={{ fontSize: 20, fontWeight: "bold", marginBottom: 10 }}>
        New Opportunities
      </Text>
      <FlatList
        data={opportunities}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View
            style={{
              padding: 10,
              backgroundColor: "#EEE",
              marginBottom: 10,
              borderRadius: 8,
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: "bold" }}>
              {item.title}
            </Text>
            <Text>Category: {item.category}</Text>
            <Text>Location: {item.location}</Text>
            <Text>Difficulty: {item.difficulty}</Text>
            {item.deadline && <Text>Deadline: {item.deadline}</Text>}
            <TouchableOpacity
              onPress={() => handleSave(item.id)}
              style={{
                marginTop: 5,
                backgroundColor: "purple",
                padding: 5,
                borderRadius: 5,
              }}
            >
              <Text style={{ color: "white", textAlign: "center" }}>
                {savedOpportunities.has(item.id) ? "Saved" : "Save for Later"}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </SafeAreaView>
  );
};

export default New_Opportunities;
