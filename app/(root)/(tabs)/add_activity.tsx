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

type DropdownItem = {
  label: string;
  value: string;
};

const ActivityTabs = () => {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState<string>("add");
  const [activityName, setActivityName] = useState<string>("");
  const [activityType, setActivityType] = useState<string>("");
  const [timeSpent, setTimeSpent] = useState<string>("");
  const [weeksPerYear, setWeeksPerYear] = useState<string>("");
  const [roles, setRoles] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [milestone, setMilestone] = useState<string>("");
  const [selectedGrades, setSelectedGrades] = useState<string[]>([]);
  const [logDate, setLogDate] = useState<Date>(new Date());
  const [logHours, setLogHours] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const { data: activitiesRaw } = useFetch("/(api)/activitytypes");
  const activities: DropdownItem[] = Array.isArray(activitiesRaw)
    ? activitiesRaw
    : [];

  const activityNamesRequestOptions = user?.primaryEmailAddress?.emailAddress
    ? {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.primaryEmailAddress.emailAddress,
        }),
      }
    : undefined;

  const { data: activityNamesRaw } = useFetch<{ name: string; id: string }[]>(
    "/(api)/getactivitynames",
    activityNamesRequestOptions,
  );

  const formattedActivityNames: DropdownItem[] = Array.isArray(activityNamesRaw)
    ? activityNamesRaw.map((item) => ({
        label: item.name,
        value: item.id,
      }))
    : [];

  const handleTabSwitch = (tab: string) => setActiveTab(tab);

  const toggleGradeSelection = (grade: string) => {
    if (selectedGrades.includes(grade)) {
      setSelectedGrades(selectedGrades.filter((g) => g !== grade));
    } else {
      setSelectedGrades([...selectedGrades, grade]);
    }
  };

  const formatDateToISO = (date: Date) => {
    if (isNaN(date.getTime())) throw new Error("Invalid date");
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
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
      setMilestone("");
      setSelectedGrades([]);
    } catch (error) {
      console.error("Error adding activity:", error);
      Alert.alert("Error", "Something went wrong while adding your activity.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogHours = async () => {
    if (!activityName || !logDate || !logHours) {
      Alert.alert("Missing Fields", "Please fill out all required fields.");
      return;
    }

    const parsedHours = parseFloat(logHours);
    if (isNaN(parsedHours) || parsedHours < 0) {
      Alert.alert("Invalid Input", "Please enter a valid number of hours.");
      return;
    }

    if (parsedHours > 24) {
      Alert.alert(
        "Invalid Hours",
        "You cannot log more than 24 hours per day.",
      );
      return;
    }

    try {
      setIsSubmitting(true);
      await fetchAPI("/(api)/loghours", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user?.id,
          activity_id: activityName,
          date_of_activity: formatDateToISO(logDate),
          hours_logged: parsedHours,
          description: milestone,
        }),
      });

      Alert.alert("Success", "Your hours were logged successfully!");
      setActivityName("");
      setLogDate(new Date());
      setLogHours("");
      setMilestone("");
    } catch (error) {
      console.error("Error logging hours:", error);
      Alert.alert("Error", "Something went wrong while logging your hours.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-primary-200 px-4 py-6">
      <View className="flex-row justify-center mb-4">
        {["add", "log"].map((tab) => (
          <TouchableOpacity
            key={tab}
            className={`flex-1 py-2 rounded-2xl ${
              activeTab === tab ? "bg-[#5b55f6]" : "bg-gray-300"
            }`}
            onPress={() => handleTabSwitch(tab)}
          >
            <Text className="text-center text-white font-PoppinsBold">
              {tab === "add" ? "Add New Activity" : "Log Hours"}
            </Text>
          </TouchableOpacity>
        ))}
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
              placeholder="ex. Future Business Leader of America"
              onChangeText={setActivityName}
            />
            <DropdownField
              label={
                <Text className="font-medium text-lg font-PoppinsBold">
                  Activity Type <Text className="text-red-500">*</Text>
                </Text>
              }
              placeholder="Select activity type"
              data={activities}
              value={activityType}
              onChange={(item: DropdownItem) => setActivityType(item.value)}
            />
            <InputField
              label={
                <Text className="font-medium text-lg font-PoppinsBold">
                  Hours Per Week <Text className="text-red-500">*</Text>
                </Text>
              }
              value={timeSpent}
              placeholder="Enter hours"
              onChangeText={setTimeSpent}
              keyboardType="number-pad"
            />
            <InputField
              label={
                <Text className="font-medium text-lg font-PoppinsBold">
                  Weeks Per Year <Text className="text-red-500">*</Text>
                </Text>
              }
              value={weeksPerYear}
              placeholder="Enter weeks"
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
              placeholder="ex. President (12)"
              onChangeText={setRoles}
            />
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
              label="Description / Notes"
              value={description}
              placeholder="ex. Grew club 7x..."
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
              placeholder="Select activity"
              data={formattedActivityNames}
              value={activityName}
              onChange={(item: DropdownItem) => setActivityName(item.value)}
            />
            <DateInputField logDate={logDate} setLogDate={setLogDate} />
            <InputField
              label={
                <Text className="font-medium text-lg font-PoppinsBold">
                  Hours <Text className="text-red-500">*</Text>
                </Text>
              }
              value={logHours}
              placeholder="Enter hours"
              onChangeText={setLogHours}
              keyboardType="number-pad"
            />
            <InputField
              label="Milestone"
              placeholder="ex. FBLA Club Meeting"
              value={milestone}
              onChangeText={setMilestone}
            />
            <CustomButton
              title={isSubmitting ? "Submitting..." : "Log Hours"}
              onPress={handleLogHours}
              className="mt-5"
            />
          </View>
        )}
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
};

const DateInputField = ({
  logDate,
  setLogDate,
}: {
  logDate: Date;
  setLogDate: (date: Date) => void;
}) => {
  const [dateText, setDateText] = useState<string>(
    logDate.toLocaleDateString("en-US"),
  );

  const formatDate = (text: string) => {
    const digits = text.replace(/\D/g, "");
    if (digits.length <= 2) return digits;
    if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    if (digits.length <= 8)
      return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
  };

  const isValidDate = (dateString: string) => {
    const [month, day, year] = dateString.split("/").map(Number);
    if (month < 1 || month > 12 || day < 1 || year < 1000 || year > 9999)
      return false;
    const date = new Date(year, month - 1, day);
    return (
      date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day
    );
  };

  const handleDateChange = (text: string) => {
    const formattedText = formatDate(text);
    setDateText(formattedText);
    if (formattedText.length === 10 && isValidDate(formattedText)) {
      const [month, day, year] = formattedText.split("/").map(Number);
      setLogDate(new Date(year, month - 1, day));
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
