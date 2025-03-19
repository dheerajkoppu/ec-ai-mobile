import React, { useState, useRef } from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import InputField from "@/components/InputField";
import CustomButton from "@/components/CustomButton";

const gradeOptions = ["9", "10", "11", "12", "Post-12", "Pre-9"];

const AddActivity = () => {
  const [activityName, setActivityName] = useState("");
  const [careerField, setCareerField] = useState("");
  const [timeSpent, setTimeSpent] = useState("");
  const [weeksPerYear, setWeeksPerYear] = useState("");
  const [roles, setRoles] = useState("");
  const [description, setDescription] = useState("");
  const [selectedGrades, setSelectedGrades] = useState<string[]>([]);

  // Creating refs for each input field
  const careerFieldRef = useRef<TextInput>(null);
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

  return (
    <SafeAreaView className="flex-1 bg-gray-100 p-3">
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
            label="Name of Activity"
            placeholder="Enter activity name"
            value={activityName}
            onChangeText={setActivityName}
            returnKeyType="next"
            onSubmitEditing={() => careerFieldRef.current?.focus()}
          />
          <InputField
            ref={careerFieldRef}
            label="Career Field"
            placeholder="e.g., Engineering, Medicine"
            value={careerField}
            onChangeText={setCareerField}
            returnKeyType="next"
            onSubmitEditing={() => timeSpentRef.current?.focus()}
          />
          <InputField
            ref={timeSpentRef}
            label="Hours per Week"
            placeholder="Enter hours"
            keyboardType="number-pad"
            value={timeSpent}
            onChangeText={setTimeSpent}
            returnKeyType="next"
            onSubmitEditing={() => weeksPerYearRef.current?.focus()}
          />
          <InputField
            ref={weeksPerYearRef}
            label="Weeks Per Year"
            placeholder="Enter weeks"
            keyboardType="number-pad"
            value={weeksPerYear}
            onChangeText={setWeeksPerYear}
            returnKeyType="next"
            onSubmitEditing={() => rolesRef.current?.focus()}
          />
          <InputField
            ref={rolesRef}
            label="Roles"
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
            title="Add Activity"
            onPress={() => {}}
            disabled
            className="mt-5"
          />
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
};

export default AddActivity;
