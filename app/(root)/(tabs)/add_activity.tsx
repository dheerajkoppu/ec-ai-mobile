import React, { useState } from "react";
import {
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";

const AddActivity = () => {
  const [activityName, setActivityName] = useState("");
  const [category, setCategory] = useState("");
  const [timeSpent, setTimeSpent] = useState("");
  const [date, setDate] = useState(new Date());
  const [description, setDescription] = useState("");
  const [proofImage, setProofImage] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, // Fixed TS2820 Error
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setProofImage(result.assets[0].uri);
    }
  };

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
          <Text className="text-3xl font-bold text-gray-800">
            Add New Activity
          </Text>

          <Text className="text-gray-700 font-medium">Name of Activity</Text>
          <TextInput
            className="border border-gray-300 rounded-lg p-4 bg-white shadow-sm"
            placeholder="Enter activity name"
            value={activityName}
            onChangeText={setActivityName}
          />

          <Text className="text-gray-700 font-medium">Category</Text>
          <TextInput
            className="border border-gray-300 rounded-lg p-4 bg-white shadow-sm"
            placeholder="e.g., Sports, Volunteering"
            value={category}
            onChangeText={setCategory}
          />

          <Text className="text-gray-700 font-medium">Hours per Week</Text>
          <TextInput
            className="border border-gray-300 rounded-lg p-4 bg-white shadow-sm"
            placeholder="Enter hours"
            keyboardType="numeric"
            value={timeSpent}
            onChangeText={setTimeSpent}
          />

          <Text className="text-gray-700 font-medium">Date of Activity</Text>
          <TouchableOpacity
            onPress={() => setShowDatePicker(true)}
            className="border border-gray-300 rounded-lg p-4 bg-white shadow-sm"
          >
            <Text className="text-gray-600">{date.toDateString()}</Text>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={date}
              mode="date"
              display="default"
              onChange={(_, selectedDate) => {
                setShowDatePicker(false);
                if (selectedDate) setDate(selectedDate);
              }}
            />
          )}

          <Text className="text-gray-700 font-medium">Description / Notes</Text>
          <TextInput
            className="border border-gray-300 rounded-lg p-4 bg-white shadow-sm"
            placeholder="Optional"
            multiline
            value={description}
            onChangeText={setDescription}
          />

          <Text className="text-gray-700 font-medium">Upload Proof</Text>
          <TouchableOpacity
            onPress={pickImage}
            className="bg-purple-600 p-4 rounded-lg items-center shadow-md"
          >
            <Text className="text-white font-bold">Upload Image</Text>
          </TouchableOpacity>
          {proofImage && (
            <Image
              source={{ uri: proofImage }}
              className="w-full h-40 rounded-lg mt-4"
            />
          )}

          <TouchableOpacity className="bg-purple-600 p-4 rounded-lg items-center shadow-md mt-4">
            <Text className="text-white font-bold">Save Activity</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default AddActivity;
