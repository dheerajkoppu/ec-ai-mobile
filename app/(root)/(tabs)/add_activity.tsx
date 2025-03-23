import React, { useState, useRef } from "react";
import {
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import InputField from "@/components/InputField";
import DropdownField from "@/components/DropdownField";
import CustomButton from "@/components/CustomButton";
import { fetchAPI, useFetch } from "@/lib/fetch";
import { useUser } from "@clerk/clerk-expo";

const gradeOptions = ["Pre-9", "9", "10", "11", "12", "Post-12"];

const AddActivity = () => {
  const { user } = useUser();
  const [activityName, setActivityName] = useState("");
  const [activityType, setActivityType] = useState("");
  const [timeSpent, setTimeSpent] = useState("");
  const [weeksPerYear, setWeeksPerYear] = useState("");
  const [roles, setRoles] = useState("");
  const [description, setDescription] = useState("");
  const [selectedGrades, setSelectedGrades] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    data: activityTypes,
    loading,
    error,
  } = useFetch("/(api)/activitytypes");

  const timeSpentRef = useRef<TextInput>(null);
  const weeksPerYearRef = useRef<TextInput>(null);
  const rolesRef = useRef<TextInput>(null);
  const descriptionRef = useRef<TextInput>(null);

  const toggleGradeSelection = (grade: string) => {
    if (selectedGrades.includes(grade)) {
      setSelectedGrades(selectedGrades.filter((g) => g !== grade));
    } else {
      setSelectedGrades([...selectedGrades, grade]);
    }
  };

  const handleAddActivity = async () => {
    if (
      !user?.primaryEmailAddress?.emailAddress ||
      !activityName ||
      !activityType ||
      !timeSpent ||
      !weeksPerYear ||
      !roles ||
      selectedGrades.length === 0
    ) {
      Alert.alert("Missing Fields", "Please fill out all required fields.");
      return;
    }

    try {
      setIsSubmitting(true);

      await fetchAPI("/(api)/adduseractivity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userEmail: user.primaryEmailAddress.emailAddress,
          name: activityName,
          activity_type: activityType,
          hours_per_week: timeSpent,
          weeks_per_year: weeksPerYear,
          roles,
          description,
          grades: selectedGrades.join(","),
        }),
      });

      Alert.alert("Success", "Your activity was added successfully!");

      // Reset form
      setActivityName("");
      setActivityType("");
      setTimeSpent("");
      setWeeksPerYear("");
      setRoles("");
      setDescription("");
      setSelectedGrades([]);
    } catch (error) {
      console.error("Error adding activity:", error);
      Alert.alert("Error", "Something went wrong while adding your activity.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-primary-200 px-4 py-6">
      <View>
        <Text className="text-3xl font-bold text-gray-800 font-PoppinsBold pb-2">
          Add New Activity
        </Text>
      </View>
      <KeyboardAwareScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        extraScrollHeight={90}
      >
        <View className="bg-white px-4 py-6 rounded-lg shadow-md mb-16">
          <InputField
            label={
              <Text className="font-medium text-lg font-PoppinsBold">
                Name of Activity <Text className="text-red-500">*</Text>
              </Text>
            }
            placeholder="Enter activity name"
            value={activityName}
            onChangeText={setActivityName}
            returnKeyType="next"
            onSubmitEditing={() => timeSpentRef.current?.focus()}
          />

          {loading ? (
            <ActivityIndicator size="large" color="#5b55f6" className="my-4" />
          ) : error ? (
            <Text className="text-red-500 font-PoppinsRegular">
              Failed to load activity types
            </Text>
          ) : (
            <DropdownField
              label={
                <Text className="font-medium text-lg font-PoppinsBold">
                  Activity Type <Text className="text-red-500">*</Text>
                </Text>
              }
              data={activityTypes || []}
              value={activityType}
              onChange={(item) => setActivityType(item.value)}
              placeholder="Select an activity type"
            />
          )}

          <InputField
            ref={timeSpentRef}
            label={
              <Text className="font-medium text-lg font-PoppinsBold">
                Hours Per Week <Text className="text-red-500">*</Text>
              </Text>
            }
            placeholder="Enter hours"
            keyboardType="number-pad"
            value={timeSpent}
            onChangeText={setTimeSpent}
            returnKeyType="next"
            onSubmitEditing={() => weeksPerYearRef.current?.focus()}
          />
          <InputField
            ref={weeksPerYearRef}
            label={
              <Text className="font-medium text-lg font-PoppinsBold">
                Weeks per Year <Text className="text-red-500">*</Text>
              </Text>
            }
            placeholder="Enter weeks"
            keyboardType="number-pad"
            value={weeksPerYear}
            onChangeText={setWeeksPerYear}
            returnKeyType="next"
            onSubmitEditing={() => rolesRef.current?.focus()}
          />
          <InputField
            ref={rolesRef}
            label={
              <Text className="font-medium text-lg font-PoppinsBold">
                Roles <Text className="text-red-500">*</Text>
              </Text>
            }
            placeholder="Enter roles"
            value={roles}
            onChangeText={setRoles}
            returnKeyType="next"
            onSubmitEditing={() => descriptionRef.current?.focus()}
          />
          <InputField
            ref={descriptionRef}
            label="Description / Notes (Optional)"
            placeholder="Enter Description"
            scrollEnabled={false}
            value={description}
            onChangeText={setDescription}
            multiline
          />

          <View>
            <Text className="text-gray-700 font-medium text-lg font-PoppinsBold mb-2">
              Grades <Text className="text-red-500">*</Text>
            </Text>
            <View className="flex-row flex-wrap gap-3">
              {gradeOptions.map((grade) => (
                <TouchableOpacity
                  key={grade}
                  onPress={() => toggleGradeSelection(grade)}
                  className={`px-2 py-2 border rounded-lg ${
                    selectedGrades.includes(grade)
                      ? "bg-[#5b55f6] border-[#5b55f6]"
                      : "border-gray-300 bg-white"
                  }`}
                >
                  <Text
                    className={`font-PoppinsRegular ${
                      selectedGrades.includes(grade)
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

          <CustomButton
            title={isSubmitting ? "Submitting..." : "Add Activity"}
            onPress={handleAddActivity}
            className="mt-5"
          />
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
};

export default AddActivity;
