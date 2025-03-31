import React, { useState } from "react";
import {
  Text,
  TouchableOpacity,
  View,
  Alert,
  Pressable,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import InputField from "@/components/InputField";
import DropdownField from "@/components/DropdownField";
import CustomButton from "@/components/CustomButton";
import { fetchAPI, useFetch } from "@/lib/fetch";
import { useUser } from "@clerk/clerk-expo";

const gradeOptions = ["Pre-9", "9", "10", "11", "12", "Post-12"];

const ActivityTabs = () => {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState("add");
  const [activityName, setActivityName] = useState("");
  const [activityType, setActivityType] = useState("");
  const [timeSpent, setTimeSpent] = useState("");
  const [weeksPerYear, setWeeksPerYear] = useState("");
  const [roles, setRoles] = useState("");
  const [description, setDescription] = useState("");
  const [selectedGrades, setSelectedGrades] = useState<string[]>([]);
  const [logDate, setLogDate] = useState(new Date());
  const [logHours, setLogHours] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch full activity types for the "Add New Activity" tab
  const { data: activities } = useFetch("/(api)/activitytypes");

  // Prepare request options for the new endpoint using the user's email
  const activityNamesRequestOptions = user?.primaryEmailAddress?.emailAddress
    ? {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.primaryEmailAddress.emailAddress,
        }),
      }
    : undefined;

  // Fetch only activity names and ids for the "Log Hours" tab
  const { data: activityNames } = useFetch(
    "/(api)/getactivitynames",
    activityNamesRequestOptions,
  );

  // Format the data so that each object has { label, value }
  const formattedActivityNames = (
    Array.isArray(activityNames) ? activityNames : activityNames?.data || []
  ).map((item) => ({
    label: item.name,
    value: item.id,
  }));

  const handleTabSwitch = (tab) => setActiveTab(tab);

  const toggleGradeSelection = (grade) => {
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
      <View className="flex-row justify-center mb-4">
        <TouchableOpacity
          className={`flex-1 py-2 rounded-2xl ${
            activeTab === "add" ? "bg-[#5b55f6]" : "bg-gray-300"
          }`}
          onPress={() => handleTabSwitch("add")}
        >
          <Text className="text-center text-white font-PoppinsBold">
            Add New Activity
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          className={`flex-1 py-2 rounded-2xl ${
            activeTab === "log" ? "bg-[#5b55f6]" : "bg-gray-300"
          }`}
          onPress={() => handleTabSwitch("log")}
        >
          <Text className="text-center text-white font-PoppinsBold">
            Log Hours
          </Text>
        </TouchableOpacity>
      </View>
      <KeyboardAwareScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        extraScrollHeight={90}
      >
        {activeTab === "add" ? (
          <View className="bg-white px-4 py-6 rounded-lg shadow-md mb-16">
            <InputField
              label={
                <Text className="font-medium text-lg font-PoppinsBold">
                  Name of Activity <Text className="text-red-500">*</Text>
                </Text>
              }
              value={activityName}
              onChangeText={setActivityName}
            />
            <DropdownField
              label={
                <Text className="font-medium text-lg font-PoppinsBold">
                  Activity Type <Text className="text-red-500">*</Text>
                </Text>
              }
              data={activities || []}
              value={activityType}
              onChange={(item) => setActivityType(item.value)}
            />
            <InputField
              label={
                <Text className="font-medium text-lg font-PoppinsBold">
                  Hours Per Week <Text className="text-red-500">*</Text>
                </Text>
              }
              value={timeSpent}
              onChangeText={setTimeSpent}
              keyboardType="number-pad"
            />
            <InputField
              label={
                <Text className="font-medium text-lg font-PoppinsBold">
                  Weeks per Year <Text className="text-red-500">*</Text>
                </Text>
              }
              value={weeksPerYear}
              onChangeText={setWeeksPerYear}
              keyboardType="number-pad"
            />
            <InputField
              label={
                <Text className="font-medium text-lg font-PoppinsBold">
                  Roles <Text className="text-red-500">*</Text>
                </Text>
              }
              value={roles}
              onChangeText={setRoles}
            />
            {/* Grade Level Section */}
            <Text className="font-medium text-lg font-PoppinsBold mt-4">
              Grade Level <Text className="text-red-500">*</Text>
            </Text>
            <View className="flex-wrap flex-row mt-2">
              {gradeOptions.map((grade) => (
                <Pressable
                  key={grade}
                  onPress={() => toggleGradeSelection(grade)}
                  className={`mr-4 mb-2 px-4 py-2 rounded-lg border border-gray-300 ${
                    selectedGrades.includes(grade) ? "bg-[#5b55f7]" : "bg-white"
                  }`}
                >
                  <Text
                    className={`text-sm font-PoppinsMedium ${
                      selectedGrades.includes(grade)
                        ? "text-white"
                        : "text-black"
                    }`}
                  >
                    {grade}
                  </Text>
                </Pressable>
              ))}
            </View>
            <InputField
              label="Description / Notes (Optional)"
              value={description}
              onChangeText={setDescription}
              multiline
            />
            <CustomButton
              title={isSubmitting ? "Submitting..." : "Add Activity"}
              onPress={handleAddActivity}
              className="mt-5"
            />
          </View>
        ) : (
          <View className="bg-white px-4 py-6 rounded-lg shadow-md mb-16">
            <DropdownField
              label={
                <Text className="font-medium text-lg font-PoppinsBold">
                  Name of Activity <Text className="text-red-500">*</Text>
                </Text>
              }
              // Use the formatted activity names data for logging hours
              data={formattedActivityNames}
              value={activityName}
              onChange={(item) => setActivityName(item.value)}
            />
            {/* Updated Date of Activity Input Field */}
            <DateInputField logDate={logDate} setLogDate={setLogDate} />
            <InputField
              label={
                <Text className="font-medium text-lg font-PoppinsBold">
                  Hours <Text className="text-red-500">*</Text>
                </Text>
              }
              value={logHours}
              onChangeText={setLogHours}
              keyboardType="number-pad"
            />
            <CustomButton
              title="Log Hours"
              onPress={() => {}}
              className="mt-5"
            />
          </View>
        )}
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
};

// Custom Date Input Field
const DateInputField = ({ logDate, setLogDate }) => {
  const [dateText, setDateText] = useState(logDate.toLocaleDateString("en-US"));

  const formatDate = (text) => {
    // Remove non-numeric characters
    const digits = text.replace(/\D/g, "");
    let formattedText = "";
    if (digits.length <= 2) {
      formattedText = digits;
    } else if (digits.length <= 4) {
      formattedText = `${digits.slice(0, 2)}/${digits.slice(2)}`;
    } else if (digits.length <= 8) {
      formattedText = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
    } else {
      formattedText = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
    }
    return formattedText;
  };

  const isValidDate = (dateString) => {
    const [month, day, year] = dateString.split("/").map(Number);
    if (month < 1 || month > 12 || day < 1 || year < 1000 || year > 9999) {
      return false;
    }
    const date = new Date(year, month - 1, day);
    return (
      date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day
    );
  };

  const handleDateChange = (text) => {
    const formattedText = formatDate(text);
    setDateText(formattedText);
    if (formattedText.length === 10 && isValidDate(formattedText)) {
      setLogDate(new Date(formattedText));
    }
  };

  return (
    <View>
      <Text className="font-medium text-lg font-PoppinsBold">
        Date of Activity <Text className="text-red-500">*</Text>
      </Text>
      <TextInput
        value={dateText}
        onChangeText={handleDateChange}
        placeholder="MM/DD/YYYY"
        keyboardType="numeric"
        maxLength={10}
        style={{
          backgroundColor: "white",
          color: "black",
          height: 40,
          borderWidth: 1,
          borderColor: "#ccc",
          borderRadius: 8,
          paddingHorizontal: 12,
          marginTop: 4,
        }}
      />
    </View>
  );
};

export default ActivityTabs;
