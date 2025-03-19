import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Image,
  TouchableOpacity,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Activity } from "@/types/type";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { IMAGE_TYPES } from "expo-asset/plugin/build/utils";
import { icons } from "@/constants";
import track_activities2 from "@/assets/icons/track_activities2.png";
import { Picker } from "@react-native-picker/picker";

const activitiesData: Activity[] = [
  {
    id: 1,
    name: "Future Business Leaders of America (FBLA)",
    category: "Career Oriented",
    hours: 6,
    hoursPerWeek: 5.5,
    weeksPerYear: 43,
    description:
      "Grew club 7x, managed & raised finances, mentored peers for comp, organized study resources, & secured the CA Outstanding Local Chapter Advisor Award.",
    grade: "9, 10, 11, 12",
  },
  {
    id: 2,
    name: "Math Club",
    category: "Career Oriented",
    hours: 6,
    hoursPerWeek: 5.5,
    weeksPerYear: 43,
    description: "I LOVE MATH SO MUCH!",
    grade: "9, 10, 11, 12",
  },
  {
    id: 3,
    name: "Basketball Team",
    category: "Sports",
    hours: 8,
    hoursPerWeek: 6,
    weeksPerYear: 30,
    description:
      "Point guard and team captain; led team to regional playoffs, organized drills, and mentored younger players.",
    grade: "10, 11, 12",
  },
  {
    id: 4,
    name: "Community Coding Initiative",
    category: "Volunteer",
    hours: 10,
    hoursPerWeek: 4,
    weeksPerYear: 36,
    description:
      "Taught underprivileged kids Python & JavaScript basics; developed interactive coding challenges & ran hackathons.",
    grade: "11, 12",
  },
  {
    id: 5,
    name: "Debate Team",
    category: "Career Oriented",
    hours: 7,
    hoursPerWeek: 3.5,
    weeksPerYear: 40,
    description:
      "Specialized in policy debate; won 3 regional tournaments; coached younger debaters in argument construction & rebuttals.",
    grade: "9, 10, 11, 12",
  },
  {
    id: 6,
    name: "School Newspaper",
    category: "Creative",
    hours: 5,
    hoursPerWeek: 2.5,
    weeksPerYear: 35,
    description:
      "Editor-in-chief; managed a team of 15 writers; wrote investigative pieces on school policies & student achievements.",
    grade: "11, 12",
  },
  {
    id: 7,
    name: "Science Olympiad",
    category: "Academic",
    hours: 9,
    hoursPerWeek: 5,
    weeksPerYear: 38,
    description:
      "Competed in Physics and Chemistry events; developed lab experiments and won 2nd place at state competition.",
    grade: "9, 10, 11",
  },
  {
    id: 8,
    name: "Volunteering at Animal Shelter",
    category: "Volunteer",
    hours: 4,
    hoursPerWeek: 2,
    weeksPerYear: 30,
    description:
      "Cared for rescue dogs & cats, assisted in adoption events, and managed social media for shelter outreach.",
    grade: "10, 11, 12",
  },
  {
    id: 9,
    name: "YouTube Channel - Tech Tutorials",
    category: "Creative",
    hours: 12,
    hoursPerWeek: 3,
    weeksPerYear: 50,
    description:
      "Produced and edited videos on Python & AI topics; gained 5,000+ subscribers and collaborated with ed-tech companies.",
    grade: "11, 12",
  },
  {
    id: 10,
    name: "Student Government",
    category: "Leadership",
    hours: 8,
    hoursPerWeek: 4,
    weeksPerYear: 40,
    description:
      "Senior class president; planned school-wide events, led fundraising campaigns, and represented students in policy discussions.",
    grade: "12",
  },
];

const TrackActivities = () => {
  const [activities, setActivities] = useState<Activity[]>(activitiesData);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortOption, setSortOption] = useState<string>("mostRecent");
  const [showSortDropdown, setShowSortDropdown] = useState<boolean>(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);

  // Update function
  const updateActivity = () => {
    if (editingActivity) {
      setActivities((prevActivities) =>
        prevActivities.map((activity) =>
          activity.id === editingActivity.id ? editingActivity : activity,
        ),
      );
      setEditingActivity(null);
    }
  };

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
    setShowSortDropdown(false);
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
    <SafeAreaView className="flex-1 bg-primary-200 px-4 py-6">
      <View className="flex-row">
        <Image
          style={{ width: 30, height: 30, resizeMode: "contain" }}
          source={icons.track_activities2}
        />
        <Text className="ml-3 text-xl font-PoppinsSemiBold mb-4">
          Track Activities
        </Text>
      </View>
      {/* Search Bar */}
      <TextInput
        className="bg-white text-black p-2 rounded-lg font-PoppinsRegular mb-4"
        placeholder="Search Activities"
        placeholderTextColor="black"
        value={searchQuery}
        onChangeText={setSearchQuery}
      />
      {/* Sorting Options */}
      <View className="flex-row mb-4 relative z-10">
        <TouchableOpacity
          onPress={() => setShowSortDropdown(!showSortDropdown)}
        >
          <Text className="text-general-400 font-PoppinsSemiBold">
            Sort By ▾
          </Text>
        </TouchableOpacity>
        {showSortDropdown && (
          <View className="absolute bg-primary-200 p-2 rounded-lg shadow-lg mt-6 z-20">
            <TouchableOpacity onPress={() => sortActivities("hours")}>
              <Text className="text-general-400 font-PoppinsRegular mb-2">
                Hours
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => sortActivities("category")}>
              <Text className="text-general-400 font-PoppinsRegular">
                Career Field
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
      {/* Activities List */}
      <FlatList
        data={filteredActivities}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ paddingBottom: 100 }} // Add padding to the bottom
        renderItem={({ item }) => (
          <View className="bg-white p-4 mb-4 rounded-lg shadow z-0">
            {/* Category in bold */}
            <Text className="font-bold font-PoppinsSemiBold text-base mb-2">
              {item.category}
            </Text>

            {/* Two-column layout */}
            <View className="flex-row">
              <View className="w-24">
                <Text className="font-PoppinsRegular mb-1 text-xs">
                  {item.grade}
                </Text>
                <Text className="font-PoppinsRegular text-xs mb-1">
                  {item.hoursPerWeek} hr/wk
                </Text>
                <Text className="font-PoppinsRegular text-xs mb-1">
                  {item.weeksPerYear} wk/yr
                </Text>
              </View>
              <View className="flex-1">
                <Text className="font-PoppinsSemiBold mb-1">{item.name}</Text>
                <Text className="font-PoppinsRegular text-xs text-gray-800">
                  {item.description}
                </Text>
              </View>
            </View>

            {/* Edit & Delete buttons */}
            <View className="flex-row justify-end mt-2">
              <TouchableOpacity
                onPress={() => setEditingActivity(item)}
                className="mr-4"
              >
                <MaterialCommunityIcons
                  name="pencil-outline"
                  size={24}
                  color="#5b55f6"
                />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => deleteActivity(item.id)}>
                <MaterialCommunityIcons
                  name="trash-can-outline"
                  size={24}
                  color="#f56565"
                />
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
};

export default TrackActivities;
