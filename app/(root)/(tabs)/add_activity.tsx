import React, { useState, useRef } from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import InputField from "@/components/InputField";
import DropdownField from "@/components/DropdownField";
import CustomButton from "@/components/CustomButton";

const gradeOptions = ["Pre-9", "9", "10", "11", "12", "Post-12"];
const careerFields = [
  { label: "Engineering", value: "engineering" },
  { label: "Medicine", value: "medicine" },
  { label: "Business", value: "business" },
  { label: "Law", value: "law" },
  { label: "Arts", value: "arts" },
  { label: "Technology", value: "technology" },
];

const AddActivity = () => {
  const [activityName, setActivityName] = useState("");
  const [careerField, setCareerField] = useState("");
  const [timeSpent, setTimeSpent] = useState("");
  const [weeksPerYear, setWeeksPerYear] = useState("");
  const [roles, setRoles] = useState("");
  const [description, setDescription] = useState("");
  const [selectedGrades, setSelectedGrades] = useState<string[]>([]);

  // Creating refs for each input field
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

          {/* Dropdown for Career Field */}
          <DropdownField
            label={
              <Text className="font-medium text-lg font-PoppinsBold">
                Career Field <Text className="text-red-500">*</Text>
              </Text>
            }
            data={careerFields}
            value={careerField}
            onChange={(item) => setCareerField(item.value)}
            placeholder="Select a career field"
          />

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
            value={description}
            onChangeText={setDescription}
            multiline
          />

          {/* Grade Selection Buttons */}
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
