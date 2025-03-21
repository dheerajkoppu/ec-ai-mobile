import React, { useState } from "react";
import { View, Text, TouchableOpacity, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Activity } from "@/types/type";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { icons } from "@/constants";
import track_activities2 from "@/assets/icons/track_activities2.png";
import { Picker } from "@react-native-picker/picker";
import InputField from "@/components/InputField";
import DropdownField from "@/components/DropdownField"; // <-- New import
import { ReactNativeModal } from "react-native-modal";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import CustomButton from "@/components/CustomButton";

const gradeOptions = ["Pre-9", "9", "10", "11", "12", "Post-12"];

const careerFields = [
  { label: "Career Oriented", value: "Career Oriented" },
  { label: "Engineering", value: "engineering" },
  { label: "Medicine", value: "medicine" },
  { label: "Business", value: "business" },
  { label: "Law", value: "law" },
  { label: "Arts", value: "arts" },
  { label: "Technology", value: "technology" },
];

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
    roles: "Competition VP (12)",
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
    roles: "Treasurer (11)",
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
    roles: "Member (9-10)",
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
    roles: "Future Business Leaders of America (FBLA)",
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
    roles: "",
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
    roles: "",
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
    roles: "",
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
    roles: "",
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
    roles: "",
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
    roles: "",
  },
];

const TrackActivities = () => {
  const [activities, setActivities] = useState<Activity[]>(activitiesData);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortOption, setSortOption] = useState<string>("mostRecent");
  const [showSortDropdown, setShowSortDropdown] = useState<boolean>(false);

  // State for editing
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [editingGrades, setEditingGrades] = useState<string[]>([]);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);

  // Update function
  const updateActivity = () => {
    if (editingActivity) {
      const updatedActivity = {
        ...editingActivity,
        grade: editingGrades.join(", "),
      };
      setActivities((prevActivities) =>
        prevActivities.map((activity) =>
          activity.id === editingActivity.id ? updatedActivity : activity,
        ),
      );
      setEditingActivity(null);
      setShowEditModal(false);
    }
  };

  // Handler for edit button
  const handleEditPress = (item: Activity) => {
    setEditingActivity(item);
    setEditingGrades(item.grade.split(",").map((g) => g.trim()));
    setShowEditModal(true);
  };

  // Toggle function for grade selection in edit mode
  const toggleEditingGrade = (grade: string) => {
    if (editingGrades.includes(grade)) {
      setEditingGrades(editingGrades.filter((g) => g !== grade));
    } else {
      setEditingGrades([...editingGrades, grade]);
    }
  };

  // Sorting and delete functions remain unchanged...
  const sortActivities = (option: string) => {
    let sortedActivities = [...activities];
    if (option === "hours") {
      sortedActivities.sort((a, b) => b.hoursPerWeek - a.hoursPerWeek);
    } else if (option === "category") {
      sortedActivities.sort((a, b) => a.category.localeCompare(b.category));
    }
    setSortOption(option);
    setActivities([...sortedActivities]);
    setShowSortDropdown(false);
  };

  const deleteActivity = (id: number) => {
    setActivities(activities.filter((activity) => activity.id !== id));
  };

  const filteredActivities = activities.filter((activity) =>
    activity.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <SafeAreaView className="flex-1 bg-primary-200 px-4 py-6">
      <View className="flex-row">
        <Text className="text-3xl font-bold text-gray-800 font-PoppinsBold pb-2">
          Track Activities
        </Text>
      </View>

      {/* Search Bar */}
      <View className="mb-4">
        <InputField
          label=""
          placeholder="Search Activities"
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
          <View className="absolute bg-white p-2 rounded-lg shadow-lg px-5 mt-6 py-3 z-20">
            <TouchableOpacity onPress={() => sortActivities("hours")}>
              <Text className="text-general-400 font-PoppinsSemiBold mb-2">
                Hours
              </Text>
            </TouchableOpacity>
            <View className="border-b border-gray-300 mb-2" />
            <TouchableOpacity onPress={() => sortActivities("category")}>
              <Text className="text-general-400 font-PoppinsSemiBold">
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
        contentContainerStyle={{ paddingBottom: 100 }}
        renderItem={({ item }) => (
          <View className="bg-white p-4 mb-4 rounded-lg shadow">
            <Text className="font-bold font-PoppinsSemiBold text-base mb-2">
              {item.category}
            </Text>
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
                {/* New Roles Field Display */}
                {item.roles ? (
                  <Text className="font-PoppinsRegular text-xs text-gray-600 mb-1">
                    Roles: {item.roles}
                  </Text>
                ) : null}
                <Text className="font-PoppinsRegular text-xs text-gray-800">
                  {item.description}
                </Text>
              </View>
            </View>
            <View className="flex-row justify-end mt-2">
              <TouchableOpacity
                onPress={() => handleEditPress(item)}
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

      {/* React Native Modal for Editing */}
      <ReactNativeModal
        isVisible={showEditModal}
        style={{
          justifyContent: "flex-start",
          marginTop: 60,
          marginHorizontal: 10,
        }}
        onBackdropPress={() => {
          setEditingActivity(null);
          setShowEditModal(false);
        }}
        onBackButtonPress={() => {
          setEditingActivity(null);
          setShowEditModal(false);
        }}
      >
        <View className="bg-primary-200 px-7 py-9 rounded-2xl mb-16 shadow-md ">
          <TouchableOpacity
            onPress={() => {
              setEditingActivity(null);
              setShowEditModal(false);
            }}
            style={{ position: "absolute", top: 20, right: 20, zIndex: 1 }}
          >
            <MaterialCommunityIcons name="close" size={24} color="#000" />
          </TouchableOpacity>
          {/* Static header section */}
          <Text className="text-3xl font-bold text-gray-800 font-PoppinsBold pb-2">
            Edit Activity
          </Text>
          {/* Only the form fields below will be scrollable */}
          <KeyboardAwareScrollView
            keyboardShouldPersistTaps="handled"
            extraScrollHeight={90}
            showsVerticalScrollIndicator={false}
          >
            {editingActivity && (
              <>
                <InputField
                  label="Activity Name"
                  placeholder="Enter Activity Name"
                  value={editingActivity.name}
                  onChangeText={(value) =>
                    setEditingActivity({ ...editingActivity, name: value })
                  }
                />
                {/* New Dropdown for Career Field */}
                <DropdownField
                  label={
                    <Text className="font-medium text-lg font-PoppinsBold">
                      Career Field <Text className="text-red-500">*</Text>
                    </Text>
                  }
                  data={careerFields}
                  value={editingActivity.category}
                  onChange={(item) =>
                    setEditingActivity({
                      ...editingActivity,
                      category: item.value,
                    })
                  }
                  placeholder="Select a career field"
                />
                {/* New Roles Field in Edit Modal */}
                <InputField
                  label="Roles"
                  placeholder="Enter Roles"
                  value={editingActivity.roles || ""}
                  onChangeText={(value) =>
                    setEditingActivity({ ...editingActivity, roles: value })
                  }
                />

                <View className="mb-4">
                  <Text className="text-gray-700 font-medium text-lg font-PoppinsBold mb-2">
                    Grades <Text className="text-red-500">*</Text>
                  </Text>
                  <View className="flex-row flex-wrap gap-3">
                    {gradeOptions.map((grade) => (
                      <TouchableOpacity
                        key={grade}
                        onPress={() => toggleEditingGrade(grade)}
                        className={`px-2 py-2 border rounded-lg ${
                          editingGrades.includes(grade)
                            ? "bg-[#5b55f6] border-[#5b55f6]"
                            : "border-gray-300 bg-white"
                        }`}
                      >
                        <Text
                          className={`font-PoppinsRegular ${
                            editingGrades.includes(grade)
                              ? "text-white"
                              : "text-gray-700"
                          }`}
                        >
                          {grade}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <InputField
                  label="Hours/Week"
                  placeholder="e.g. 5.5"
                  keyboardType="numeric"
                  value={String(editingActivity.hoursPerWeek)}
                  onChangeText={(value) =>
                    setEditingActivity({
                      ...editingActivity,
                      hoursPerWeek: parseFloat(value) || 0,
                    })
                  }
                />

                <InputField
                  label="Weeks/Year"
                  placeholder="e.g. 43"
                  keyboardType="numeric"
                  value={String(editingActivity.weeksPerYear)}
                  onChangeText={(value) =>
                    setEditingActivity({
                      ...editingActivity,
                      weeksPerYear: parseInt(value) || 0,
                    })
                  }
                />

                <InputField
                  label="Description"
                  scrollEnabled={false}
                  placeholder="Describe your role..."
                  value={editingActivity.description}
                  onChangeText={(value) =>
                    setEditingActivity({
                      ...editingActivity,
                      description: value,
                    })
                  }
                  multiline
                />

                <CustomButton
                  title="Update Activity"
                  onPress={updateActivity}
                  className="mt-5 mb-5 rounded-lg shadow-md"
                />
              </>
            )}
          </KeyboardAwareScrollView>
        </View>
      </ReactNativeModal>
    </SafeAreaView>
  );
};

export default TrackActivities;
