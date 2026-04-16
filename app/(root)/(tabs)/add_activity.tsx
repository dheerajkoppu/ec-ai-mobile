import React, { useEffect, useMemo, useState } from "react";
import {
  Text,
  TouchableOpacity,
  View,
  Alert,
  Pressable,
  Platform,
} from "react-native";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { controlSize, datePickerStyle } from "@expo/ui/swift-ui/modifiers";
import { SafeAreaView } from "react-native-safe-area-context";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import InputField from "@/components/InputField";
import DropdownField from "@/components/DropdownField";
import CustomButton from "@/components/CustomButton";
import { fetchAPI, useFetch } from "@/lib/fetch";
import { presentPremiumPaywallIfNeeded } from "@/lib/premium";
import { useUser, useAuth } from "@clerk/clerk-expo";
import { router } from "expo-router";
import Purchases from "react-native-purchases";
import { PAYWALL_RESULT } from "react-native-purchases-ui";
import * as Haptics from "expo-haptics";
import { useColorScheme } from "react-native";
import { formatDateToYMD } from "@/lib/formatters";
import { GRADE_OPTIONS } from "@/constants";
import ResponsiveContainer from "@/components/ResponsiveContainer";
import { useResponsiveLayout } from "@/lib/responsive";

type DropdownItem = {
  label: string;
  value: string;
};

const STATIC_LOOKUP_TTL_MS = 24 * 60 * 60 * 1000;

const getFormLabelStyle = (isDark: boolean) => ({
  color: isDark ? "#fff" : "#000",
  fontSize: 18,
  fontFamily: "Poppins-Bold" as const,
});

const renderRequiredLabel = (label: string, isDark: boolean) => (
  <Text style={getFormLabelStyle(isDark)}>
    {label} <Text style={{ color: "#ef4444" }}>*</Text>
  </Text>
);

const ActivityTabs = () => {
  const { user } = useUser();
  const { getToken } = useAuth();
  const [activeTab, setActiveTab] = useState<string>("add");
  const [activityName, setActivityName] = useState<string>("");
  const [selectedActivityId, setSelectedActivityId] = useState<string>("");
  const scheme = useColorScheme();

  const [activityType, setActivityType] = useState<string>("");
  const [timeSpent, setTimeSpent] = useState<string>("");
  const [weeksPerYear, setWeeksPerYear] = useState<string>("");
  const [roles, setRoles] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const isDark = scheme === "dark";
  const { contentMaxWidth } = useResponsiveLayout();
  const activityFormMaxWidth = Math.min(contentMaxWidth, 720);

  const [milestone, setMilestone] = useState<string>("");
  const [selectedGrades, setSelectedGrades] = useState<string[]>([]);
  const [logDate, setLogDate] = useState<Date>(new Date());
  const [logHours, setLogHours] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [authToken, setAuthToken] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    getToken()
      .then((token) => {
        if (isMounted) {
          setAuthToken(token ?? null);
        }
      })
      .catch((error) => {
        console.error("Error loading auth token for activities:", error);
      });

    return () => {
      isMounted = false;
    };
  }, [getToken]);

  // Fetch activity types for dropdown
  const { data: activitiesRaw } = useFetch(
    "https://ec-ai.expo.app/getactivitytypes",
    undefined,
    {
      cacheKey: "activity-types",
      staleTimeMs: STATIC_LOOKUP_TTL_MS,
    },
  );
  const activities: DropdownItem[] = Array.isArray(activitiesRaw)
    ? activitiesRaw
    : [];

  // Prepare request options to fetch activity names for current user
  const activityNamesRequestOptions = useMemo(() => {
    if (!authToken) return undefined;

    return {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({}),
    };
  }, [authToken]);

  // Fetch previously added activity names
  const { data: activityNamesRaw } = useFetch<{ name: string; id: string }[]>(
    "https://ec-ai.expo.app/getactivitynames",
    activityNamesRequestOptions,
    { enabled: !!activityNamesRequestOptions },
  );

  const formattedActivityNames: DropdownItem[] = Array.isArray(activityNamesRaw)
    ? activityNamesRaw.map((item) => ({
        label: item.name,
        value: item.id,
      }))
    : [];

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

      const customerInfo = await Purchases.getCustomerInfo();
      const isPremium =
        customerInfo.entitlements.active["premium"] !== undefined;

      if (!isPremium && formattedActivityNames.length >= 10) {
        const result = await presentPremiumPaywallIfNeeded();
        if (
          result !== PAYWALL_RESULT.PURCHASED &&
          result !== PAYWALL_RESULT.RESTORED
        ) {
          Alert.alert(
            "Activity Limit Reached",
            "Free accounts can track up to 10 activities. Upgrade to Premium to add unlimited activities.",
          );
          return;
        }
      }

      const token = await getToken();
      await fetchAPI("https://ec-ai.expo.app/adduseractivity", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: activityName,
          activity_type: activityType,
          hours_per_week: timeSpent,
          weeks_per_year: weeksPerYear,
          roles,
          description,
          grades: selectedGrades.join(","),
        }),
      });
      setActivityName("");
      setActivityType("");
      setTimeSpent("");
      setWeeksPerYear("");
      setRoles("");
      setDescription("");
      setMilestone("");
      setSelectedGrades([]);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Success", "Your activity was added successfully!", [
        {
          text: "OK",
          onPress: () => {
            router.replace({
              pathname: "/(root)/(tabs)/track_activities",
              params: { fromAdd: "true" },
            });
          },
        },
      ]);
    } catch (error) {
      console.error("Error adding activity:", error);
      Alert.alert("Error", "Something went wrong while adding your activity.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogHours = async () => {
    if (!selectedActivityId || !logDate || !logHours) {
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
      const token = await getToken();
      await fetchAPI("https://ec-ai.expo.app/loghours", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          activity_id: selectedActivityId,
          date_of_activity: formatDateToYMD(logDate),
          hours_logged: parsedHours,
          description: milestone,
        }),
      });

      setSelectedActivityId("");
      setLogDate(new Date());
      setLogHours("");
      setMilestone("");
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Success", "Your hours were logged successfully!", [
        {
          text: "OK",
          onPress: () => {
            router.navigate("/(root)/(tabs)/track_activities?fromAdd=true");
          },
        },
      ]);
    } catch (error) {
      console.error("Error logging hours:", error);
      Alert.alert("Error", "Something went wrong while logging your hours.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={{
        flex: 1,
        backgroundColor: isDark ? "#121212" : "#F5F7FA",
        paddingHorizontal: 16,
        paddingVertical: 24,
      }}
    >
      <ResponsiveContainer maxWidth={activityFormMaxWidth} style={{ flex: 1 }}>
        <View className="flex-row justify-center mb-4">
          {["add", "log"].map((tab) => (
            <TouchableOpacity
              key={tab}
              className={`flex-1 py-2 rounded-2xl ${
                activeTab === tab ? "bg-[#5b55f6]" : "bg-gray-300"
              }`}
              onPress={() => setActiveTab(tab)}
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
        >
          {activeTab === "add" ? (
            <View
              style={{
                backgroundColor: isDark ? "#1a1a1a" : "#ffffff",
                paddingHorizontal: 16,
                paddingVertical: 24,
                borderRadius: 12,
                marginBottom: 64,
                shadowColor: "#000",
                shadowOpacity: 0.1,
                shadowRadius: 8,
                shadowOffset: { width: 0, height: 2 },
              }}
            >
              <InputField
                label={renderRequiredLabel("Name of Activity", isDark)}
                value={activityName}
                placeholder="ex. Future Business Leader of America"
                onChangeText={setActivityName}
              />
              <DropdownField
                label={renderRequiredLabel("Activity Type", isDark)}
                placeholder="Select activity type"
                data={activities}
                value={activityType}
                onChange={(item: DropdownItem) => setActivityType(item.value)}
              />
              <InputField
                label={renderRequiredLabel("Hours Per Week", isDark)}
                value={timeSpent}
                placeholder="Enter hours"
                onChangeText={setTimeSpent}
                keyboardType="number-pad"
              />
              <InputField
                label={renderRequiredLabel("Weeks Per Year", isDark)}
                value={weeksPerYear}
                placeholder="Enter weeks"
                onChangeText={setWeeksPerYear}
                keyboardType="number-pad"
              />
              <InputField
                label={renderRequiredLabel("Roles", isDark)}
                value={roles}
                placeholder="ex. President (12)"
                onChangeText={setRoles}
              />
              <Text
                style={{
                  color: isDark ? "#fff" : "#000",
                  fontWeight: "500",
                  fontSize: 18,
                  fontFamily: "Poppins-Bold",
                  marginTop: 16,
                }}
              >
                Grade Level <Text className="text-red-500">*</Text>
              </Text>
              <View className="flex-wrap flex-row mt-2">
                {GRADE_OPTIONS.map((grade) => (
                  <Pressable
                    key={grade}
                    onPress={() => toggleGradeSelection(grade)}
                    style={{
                      marginRight: 16,
                      marginBottom: 8,
                      paddingVertical: 8,
                      paddingHorizontal: 16,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: isDark ? "#555" : "#ccc",
                      backgroundColor: selectedGrades.includes(grade)
                        ? "#5b55f7"
                        : isDark
                          ? "#1e1e1e"
                          : "#fff",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 14,
                        fontFamily: "Poppins-Medium",
                        color: selectedGrades.includes(grade)
                          ? "#fff"
                          : isDark
                            ? "#e0e0e0"
                            : "#000",
                      }}
                    >
                      {grade}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <InputField
                label="Description / Notes *"
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
            <View
              style={{
                backgroundColor: isDark ? "#1a1a1a" : "#ffffff",
                paddingHorizontal: 16,
                paddingVertical: 24,
                borderRadius: 12,
                marginBottom: 64,
                shadowColor: "#000",
                shadowOpacity: 0.1,
                shadowRadius: 8,
                shadowOffset: { width: 0, height: 2 },
              }}
            >
              <DropdownField
                label={renderRequiredLabel("Name of Activity", isDark)}
                placeholder="Select activity"
                data={formattedActivityNames}
                value={selectedActivityId}
                onChange={(item: DropdownItem) =>
                  setSelectedActivityId(item.value)
                }
              />
              <DateInputField logDate={logDate} setLogDate={setLogDate} />
              <InputField
                label={renderRequiredLabel("Hours", isDark)}
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
      </ResponsiveContainer>
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
  const isDark = useColorScheme() === "dark";
  const [showAndroidPicker, setShowAndroidPicker] = useState(false);
  const iosPicker = Platform.OS === "ios" ? require("@expo/ui/swift-ui") : null;

  const handleAndroidDateChange = (
    event: DateTimePickerEvent,
    selectedDate?: Date,
  ) => {
    setShowAndroidPicker(false);

    if (event.type === "set" && selectedDate) {
      setLogDate(selectedDate);
    }
  };

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 12,
      }}
    >
      <Text style={getFormLabelStyle(isDark)}>
        Date of Activity <Text style={{ color: "#ef4444" }}>*</Text>
      </Text>
      {Platform.OS === "ios" && iosPicker ? (
        <iosPicker.Host matchContents>
          <iosPicker.DatePicker
            title=""
            selection={logDate}
            displayedComponents={["date"]}
            range={{ end: new Date() }}
            modifiers={[datePickerStyle("compact"), controlSize("small")]}
            onDateChange={(date: Date) => setLogDate(date)}
          />
        </iosPicker.Host>
      ) : (
        <>
          <Pressable
            onPress={() => setShowAndroidPicker(true)}
            style={{
              borderWidth: 1,
              borderColor: isDark ? "#3f3f46" : "#d1d5db",
              backgroundColor: isDark ? "#1e1e1e" : "#ffffff",
              borderRadius: 10,
              paddingHorizontal: 12,
              paddingVertical: 8,
              minWidth: 128,
            }}
          >
            <Text
              style={{
                color: isDark ? "#fff" : "#111827",
                fontFamily: "Poppins-Regular",
                fontSize: 14,
              }}
            >
              {formatDateToYMD(logDate)}
            </Text>
          </Pressable>
          {showAndroidPicker ? (
            <DateTimePicker
              mode="date"
              value={logDate}
              maximumDate={new Date()}
              onChange={handleAndroidDateChange}
            />
          ) : null}
        </>
      )}
    </View>
  );
};

export default ActivityTabs;
