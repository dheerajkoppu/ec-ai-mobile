import React, { useState } from "react";
import {
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const AddActivity = () => {
  const [activityName, setActivityName] = useState("");
  const [careerField, setCareerField] = useState("");
  const [timeSpent, setTimeSpent] = useState("");
  const [weeksPerYear, setWeeksPerYear] = useState("");
  const [roles, setRoles] = useState("");
  const [description, setDescription] = useState("");

  return (
    <SafeAreaView className="flex-1 bg-gray-100 p-6">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          className="space-y-6"
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          <Text className="text-3xl font-bold text-gray-800 font-poppins">
            Add New Activity
          </Text>

          <Text className="text-gray-700 font-medium font-poppins">
            Name of Activity <Text className="text-red-500">*</Text>
          </Text>
          <TextInput
            className="border border-gray-300 rounded-lg p-4 bg-white shadow-sm font-poppins"
            placeholder="Enter activity name"
            placeholderTextColor="#4B5563"
            value={activityName}
            onChangeText={setActivityName}
          />

          <Text className="text-gray-700 font-medium font-poppins">
            Career Field <Text className="text-red-500">*</Text>
          </Text>
          <TextInput
            className="border border-gray-300 rounded-lg p-4 bg-white shadow-sm font-poppins"
            placeholder="e.g., Engineering, Medicine"
            placeholderTextColor="#4B5563"
            value={careerField}
            onChangeText={setCareerField}
          />

          <Text className="text-gray-700 font-medium font-poppins">
            Hours per Week <Text className="text-red-500">*</Text>
          </Text>
          <TextInput
            className="border border-gray-300 rounded-lg p-4 bg-white shadow-sm font-poppins"
            placeholder="Enter hours"
            placeholderTextColor="#4B5563"
            keyboardType="numeric"
            value={timeSpent}
            onChangeText={setTimeSpent}
          />

          <Text className="text-gray-700 font-medium font-poppins">
            Weeks Per Year <Text className="text-red-500">*</Text>
          </Text>
          <TextInput
            className="border border-gray-300 rounded-lg p-4 bg-white shadow-sm font-poppins"
            placeholder="Enter weeks"
            placeholderTextColor="#4B5563"
            keyboardType="numeric"
            value={weeksPerYear}
            onChangeText={setWeeksPerYear}
          />

          <Text className="text-gray-700 font-medium font-poppins">
            Roles <Text className="text-red-500">*</Text>
          </Text>
          <TextInput
            className="border border-gray-300 rounded-lg p-4 bg-white shadow-sm font-poppins"
            placeholder="Enter roles"
            placeholderTextColor="#4B5563"
            value={roles}
            onChangeText={setRoles}
          />

          <Text className="text-gray-700 font-medium font-poppins">
            Description / Notes (Optional)
          </Text>
          <TextInput
            className="border border-gray-300 rounded-lg p-4 bg-white shadow-sm font-poppins"
            placeholder="Optional"
            placeholderTextColor="#4B5563"
            multiline
            value={description}
            onChangeText={setDescription}
          />

          <TouchableOpacity className="bg-[#5b55f6] p-4 rounded-lg items-center shadow-md mt-4">
            <Text className="text-white font-bold font-poppins">
              Add Activity
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default AddActivity;
