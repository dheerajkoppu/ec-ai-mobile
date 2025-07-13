import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Activity } from "@/types/type";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import InputField from "@/components/InputField";
import DropdownField from "@/components/DropdownField";
import ReactNativeModal from "react-native-modal";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import AsyncStorage from "@react-native-async-storage/async-storage";
import CustomButton from "@/components/CustomButton";
import { useFetch, fetchAPI } from "@/lib/fetch";
import { useUser } from "@clerk/clerk-expo";
import Purchases from "react-native-purchases";
import { useLocalSearchParams } from "expo-router";
import RevenueCatUI, { PAYWALL_RESULT } from "react-native-purchases-ui";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback } from "react";
import * as Haptics from "expo-haptics";
import { useColorScheme } from "react-native";

const gradeOptions = ["Pre-9", "9", "10", "11", "12", "Post-12"];

const TrackActivities = () => {
  const { user } = useUser();
  const email = user?.primaryEmailAddress?.emailAddress;
  const userId = user?.id;
  const [activities, setActivities] = useState<Activity[]>([]);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortOption, setSortOption] = useState<string>("mostRecent");
  const [showSortDropdown, setShowSortDropdown] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [editingGrades, setEditingGrades] = useState<string[]>([]);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [deleteTarget, setDeleteTarget] = useState<Activity | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);
  const [showLogsModal, setShowLogsModal] = useState<boolean>(false);
  const { fromAdd } = useLocalSearchParams();
  const [hasRefetchedFromAdd, setHasRefetchedFromAdd] = useState(false);

  // New state for the AI description modal
  const [aiDescription, setAiDescription] = useState<string>("");
  const [showAIDescriptionModal, setShowAIDescriptionModal] =
    useState<boolean>(false);
  const [
    selectedActivityForAIDescription,
    setSelectedActivityForAIDescription,
  ] = useState<Activity | null>(null);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const requestOptions = useMemo(() => {
    if (!email) return undefined;
    return {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    };
  }, [email]);

  const {
    data: fetchedActivities,
    loading,
    error,
    refetch,
  } = useFetch<Activity[]>(
    "https://ec-ai.expo.app/getactivities",
    requestOptions,
  );

  const {
    data: careerFields = [],
    loading: loadingCareerFields,
    error: errorCareerFields,
  } = useFetch<{ label: string; value: string }[]>(
    "https://ec-ai.expo.app/getactivitytypes",
  );

  useEffect(() => {
    if (fetchedActivities && Array.isArray(fetchedActivities)) {
      setActivities(fetchedActivities);
    }
  }, [fetchedActivities]);

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await refetch();
    } finally {
      setRefreshing(false);
    }
  };
  useFocusEffect(
    useCallback(() => {
      if (fromAdd === "true" && !hasRefetchedFromAdd) {
        refetch();
        setHasRefetchedFromAdd(true);
      }
    }, [fromAdd, hasRefetchedFromAdd, refetch]),
  );
  const updateActivity = async () => {
    if (editingActivity && email) {
      const updatedActivity = {
        ...editingActivity,
        grade: editingGrades.join(", "),
      };

      try {
        await fetchAPI("https://ec-ai.expo.app/alteractivity", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userEmail: email,
            activityId: editingActivity.id,
            name: updatedActivity.name,
            category: updatedActivity.category,
            roles: updatedActivity.roles,
            grade: updatedActivity.grade,
            hoursPerWeek: updatedActivity.hoursPerWeek,
            weeksPerYear: updatedActivity.weeksPerYear,
            description: updatedActivity.description,
          }),
        });

        await refetch();
        setEditingActivity(null);
        setShowEditModal(false);
        Alert.alert("Success", "Activity updated successfully!");
      } catch (error) {
        console.error("Update error:", error);
        Alert.alert("Error", "Failed to update activity.");
      }
    }
  };

  const deleteActivity = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch("https://ec-ai.expo.app/deleteactivity", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activityId: deleteTarget.id }),
      });
      if (!res.ok) {
        console.error("Delete failed with status", res.status);
        Alert.alert("Error", "Failed to delete activity.");
        return;
      }
      setActivities((prev) => prev.filter((a) => a.id !== deleteTarget.id));
      setShowDeleteModal(false);
      setDeleteTarget(null);
      Alert.alert("Deleted", "Activity deleted successfully.");
    } catch (error) {
      console.error("Delete error:", error);
      Alert.alert("Error", "Failed to delete activity.");
    }
  };

  const handleEditPress = (item: Activity, e?: any) => {
    if (e && e.stopPropagation) e.stopPropagation();
    setEditingActivity(item);
    setEditingGrades(item.grade.split(",").map((g) => g.trim()));
    setShowEditModal(true);
  };

  const toggleEditingGrade = (grade: string) => {
    if (editingGrades.includes(grade)) {
      setEditingGrades(editingGrades.filter((g) => g !== grade));
    } else {
      setEditingGrades([...editingGrades, grade]);
    }
  };

  const sortActivities = (option: string) => {
    let sortedActivities = [...activities];
    if (option === "hours") {
      sortedActivities.sort((a, b) => b.hoursPerWeek - a.hoursPerWeek);
    } else if (option === "category") {
      sortedActivities.sort((a, b) => a.category.localeCompare(b.category));
    }
    setSortOption(option);
    setActivities(sortedActivities);
    setShowSortDropdown(false);
  };

  const filteredActivities = activities.filter((activity) =>
    activity.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const openLogs = async (activity: Activity) => {
    if (!userId) {
      Alert.alert("Error", "User not found");
      return;
    }
    try {
      const response = await fetch(`https://ec-ai.expo.app/getactivitylogs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, activity_id: activity.id }),
      });
      const result = await response.json();
      if (result.data) {
        setLogs(result.data);
      } else {
        setLogs([]);
        Alert.alert("Error", "No logs found for this activity.");
      }
      setShowLogsModal(true);
    } catch (error) {
      console.error("Error fetching logs:", error);
      Alert.alert("Error", "Failed to fetch activity logs.");
    }
  };

  const getAIDescription = async (activity: Activity) => {
    if (!email) {
      Alert.alert("Error", "No user email provided");
      return;
    }

    try {
      const customerInfo = await Purchases.getCustomerInfo();
      const isPremium =
        customerInfo.entitlements.active["premium"] !== undefined;

      if (!isPremium) {
        const aiUsageKey = `ai_desc_used_${user?.id}`;
        const hasUsed = await AsyncStorage.getItem(aiUsageKey);

        if (hasUsed) {
          const result = await RevenueCatUI.presentPaywallIfNeeded({
            requiredEntitlementIdentifier: "premium",
          });

          if (
            result === PAYWALL_RESULT.PURCHASED ||
            result === PAYWALL_RESULT.RESTORED
          ) {
            return await getAIDescription(activity); // Retry after upgrade
          } else {
            return;
          }
        }

        await AsyncStorage.setItem(aiUsageKey, "1"); // Mark as used
      }

      const response = await fetch("https://ec-ai.expo.app/getaidescription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, activity_id: activity.id }),
      });

      const result = await response.json();

      setSelectedActivityForAIDescription(activity);
      setAiDescription(result.description || "No description available.");
      setShowAIDescriptionModal(true);
    } catch (error) {
      console.error("Error in getAIDescription:", error);
      Alert.alert("Error", "Something went wrong. Please try again.");
    }
  };

  // Function to call the new updatedescription+api endpoint when "Replace Current Description" is pushed.
  const replaceAIDescription = async () => {
    if (!selectedActivityForAIDescription) return;
    try {
      await fetchAPI("https://ec-ai.expo.app/updatedescription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          activityId: selectedActivityForAIDescription.id,
          description: aiDescription,
        }),
      });
      await refetch();
      setShowAIDescriptionModal(false);
      setSelectedActivityForAIDescription(null);
      setAiDescription("");
      Alert.alert("Success", "Activity description replaced successfully.");
    } catch (error) {
      console.error("Error replacing description:", error);
      Alert.alert("Error", "Failed to replace description.");
    }
  };

  return (
    <SafeAreaView
      className={`flex-1 px-4 py-6 ${isDark ? "bg-[#121212]" : "bg-primary-200"}`}
    >
      <Text
        className={`text-3xl font-bold font-PoppinsBold pb-2 ${
          isDark ? "text-white" : "text-gray-800"
        }`}
      >
        {" "}
        Track Activities
      </Text>
      {loading && !refreshing && (
        <ActivityIndicator size="large" color="#5b55f6" className="my-4" />
      )}
      {error && (
        <Text className="text-red-500 font-PoppinsRegular my-4">
          Error loading activities: {error}
        </Text>
      )}
      <InputField
        label=""
        placeholder="Search Activities"
        value={searchQuery}
        onChangeText={setSearchQuery}
      />
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
      {!loading && filteredActivities.length === 0 ? (
        <Text className="text-center text-gray-500 font-PoppinsRegular mt-10">
          No activities found.
        </Text>
      ) : (
        <FlatList
          data={filteredActivities}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ paddingBottom: 100 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={async () => {
                await Haptics.selectionAsync();
                await openLogs(item);
              }}
              style={{
                backgroundColor: isDark ? "#1e1e1e" : "#ffffff",
                padding: 16,
                marginBottom: 16,
                borderRadius: 10,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 3,
              }}
            >
              <Text
                className={`font-bold font-PoppinsSemiBold text-base mb-2 ${
                  isDark ? "text-white" : "text-black"
                }`}
              >
                {item.category}
              </Text>

              <View className="flex-row">
                <View className="w-24">
                  <Text
                    className={`font-PoppinsRegular mb-1 text-xs ${
                      isDark ? "text-white" : "text-black"
                    }`}
                  >
                    {item.grade}
                  </Text>

                  <Text
                    className={`font-PoppinsRegular mb-1 text-xs ${
                      isDark ? "text-white" : "text-black"
                    }`}
                  >
                    {" "}
                    {item.hoursPerWeek} hr/wk
                  </Text>
                  <Text
                    className={`font-PoppinsRegular mb-1 text-xs ${
                      isDark ? "text-white" : "text-black"
                    }`}
                  >
                    {" "}
                    {item.weeksPerYear} wk/yr
                  </Text>
                </View>
                <View className="flex-1">
                  <Text
                    className={`font-PoppinsSemiBold mb-1 ${
                      isDark ? "text-white" : "text-black"
                    }`}
                  >
                    {item.name}
                  </Text>

                  {item.roles && (
                    <Text
                      style={{
                        fontFamily: "Poppins-Regular",
                        fontSize: 12,
                        color: isDark ? "#ccc" : "#444",
                        marginBottom: 4,
                      }}
                    >
                      Roles: {item.roles}
                    </Text>
                  )}
                  <Text
                    style={{
                      fontFamily: "Poppins-Regular",
                      fontSize: 12,
                      color: isDark ? "#bbb" : "#333",
                      marginBottom: 8,
                    }}
                  >
                    {" "}
                    {item.description}
                  </Text>
                </View>
              </View>
              <View className="flex-row justify-end mt-2">
                <TouchableOpacity
                  onPress={(e) => handleEditPress(item, e)}
                  className="mr-4"
                >
                  <MaterialCommunityIcons
                    name="pencil-outline"
                    size={24}
                    color="#5b55f6"
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    getAIDescription(item);
                  }}
                  className="mr-4"
                >
                  <MaterialCommunityIcons
                    name="robot"
                    size={24}
                    color="#5b55f6"
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    setDeleteTarget(item);
                    setShowDeleteModal(true);
                  }}
                >
                  <MaterialCommunityIcons
                    name="trash-can-outline"
                    size={24}
                    color="#f56565"
                  />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
      {/* Delete Activity Confirmation Modal */}
      <ReactNativeModal
        isVisible={showDeleteModal}
        backdropTransitionOutTiming={1}
        useNativeDriver={true}
        useNativeDriverForBackdrop={true}
      >
        <View
          className="bg-white px-7 py-9 rounded-2xl"
          style={{ backgroundColor: isDark ? "#121212" : "#FFFFFF" }}
        >
          <Text
            className="text-xl font-PoppinsSemiBold text-center mb-4"
            style={{ color: isDark ? "#FFFFFF" : "#000000" }}
          >
            Confirm Delete
          </Text>
          <Text
            className="text-base font-Poppins text-center mb-6"
            style={{ color: isDark ? "#FFFFFF" : "#000000" }}
          >
            Are you sure you want to delete this activity? This action cannot be
            undone.
          </Text>
          <View className="flex-row justify-between">
            <CustomButton
              title="Cancel"
              onPress={() => {
                setShowDeleteModal(false);
                setDeleteTarget(null);
              }}
              className="w-1/2 p-2 rounded-lg mr-2 font-PoppinsRegular shadow-md"
            />
            <CustomButton
              title="Delete"
              onPress={deleteActivity}
              bgVariant="danger"
              className="w-1/2 p-2 rounded-lg ml-2 font-PoppinsRegular shadow-md"
            />
          </View>
        </View>
      </ReactNativeModal>
      {/* Edit Modal */}
      <ReactNativeModal
        isVisible={showEditModal}
        backdropTransitionOutTiming={1}
        useNativeDriver={true}
        useNativeDriverForBackdrop={true}
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
        <View
          style={{
            backgroundColor: isDark ? "#1a1a1a" : "#ffffff",
            paddingHorizontal: 28,
            paddingVertical: 36,
            borderRadius: 16,
            marginBottom: 64,
            shadowColor: "#000",
          }}
        >
          <TouchableOpacity
            onPress={() => {
              setEditingActivity(null);
              setShowEditModal(false);
            }}
            style={{ position: "absolute", top: 20, right: 20, zIndex: 1 }}
          >
            <MaterialCommunityIcons
              name="close"
              size={24}
              color={isDark ? "#fff" : "#000"}
            />
          </TouchableOpacity>
          <Text
            style={{
              fontSize: 24,
              fontFamily: "Poppins-Bold",
              color: isDark ? "#fff" : "#1f2937",
              marginBottom: 12,
            }}
          >
            Edit Activity
          </Text>
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
                {loadingCareerFields ? (
                  <ActivityIndicator
                    size="small"
                    color="#5b55f6"
                    style={{ marginVertical: 8 }}
                  />
                ) : errorCareerFields ? (
                  <Text
                    style={{
                      color: "#ef4444",
                      fontFamily: "Poppins-Regular",
                      marginBottom: 8,
                    }}
                  >
                    Failed to load career fields
                  </Text>
                ) : (
                  <DropdownField
                    label={
                      <Text
                        style={{
                          fontWeight: "600",
                          fontSize: 18,
                          fontFamily: "Poppins-Bold",
                          color: isDark ? "#fff" : "#000",
                        }}
                      >
                        Career Field <Text style={{ color: "#ef4444" }}>*</Text>
                      </Text>
                    }
                    data={careerFields ?? []}
                    value={editingActivity?.category}
                    onChange={({ value }) =>
                      editingActivity &&
                      setEditingActivity({
                        ...editingActivity,
                        category: value,
                      })
                    }
                    placeholder="Select a career field"
                  />
                )}
                <InputField
                  label="Roles"
                  placeholder="Enter Roles"
                  value={editingActivity.roles || ""}
                  onChangeText={(value) =>
                    setEditingActivity({ ...editingActivity, roles: value })
                  }
                />
                <View style={{ marginBottom: 16 }}>
                  <Text
                    style={{
                      color: isDark ? "#fff" : "#000",
                      fontWeight: "600",
                      fontSize: 18,
                      fontFamily: "Poppins-Bold",
                      marginBottom: 8,
                    }}
                  >
                    Grades <Text style={{ color: "#ef4444" }}>*</Text>
                  </Text>
                  <View
                    style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}
                  >
                    {gradeOptions.map((grade) => (
                      <TouchableOpacity
                        key={grade}
                        onPress={() => toggleEditingGrade(grade)}
                        style={{
                          paddingVertical: 8,
                          paddingHorizontal: 16,
                          borderRadius: 8,
                          borderWidth: 1,
                          borderColor: editingGrades.includes(grade)
                            ? "#5b55f6"
                            : "#ccc",
                          backgroundColor: editingGrades.includes(grade)
                            ? "#5b55f6"
                            : isDark
                              ? "#1e1e1e"
                              : "#fff",
                          marginRight: 12,
                          marginBottom: 12,
                        }}
                      >
                        <Text
                          style={{
                            fontFamily: "Poppins-Regular",
                            color: editingGrades.includes(grade)
                              ? "#fff"
                              : isDark
                                ? "#e0e0e0"
                                : "#000",
                          }}
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
                  style={{ marginTop: 20, marginBottom: 20 }}
                />
              </>
            )}
          </KeyboardAwareScrollView>
        </View>
      </ReactNativeModal>
      {/* Activity Logs Modal */}
      <ReactNativeModal
        isVisible={showLogsModal}
        backdropTransitionOutTiming={1}
        useNativeDriver={true}
        useNativeDriverForBackdrop={true}
        onBackdropPress={() => setShowLogsModal(false)}
      >
        <View
          style={{
            backgroundColor: isDark ? "#1e1e1e" : "#ffffff",
            paddingHorizontal: 28,
            paddingVertical: 36,
            borderRadius: 16,
            shadowColor: "#000",
            maxHeight: "80%",
          }}
        >
          <TouchableOpacity
            onPress={() => setShowLogsModal(false)}
            style={{ position: "absolute", top: 20, right: 20, zIndex: 1 }}
          >
            <MaterialCommunityIcons
              name="close"
              size={24}
              color={isDark ? "#fff" : "#000"}
            />
          </TouchableOpacity>

          <Text
            style={{
              fontSize: 24,
              fontWeight: "bold",
              color: isDark ? "#fff" : "#1f2937",
              marginBottom: 16,
            }}
          >
            Activity Logs
          </Text>

          {logs.length === 0 ? (
            <Text
              style={{ color: isDark ? "#aaa" : "#4b5563", marginBottom: 16 }}
            >
              No logs found.
            </Text>
          ) : (
            <FlatList
              data={logs}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item }) => (
                <View
                  style={{
                    borderBottomWidth: 1,
                    borderBottomColor: isDark ? "#444" : "#d1d5db",
                    paddingBottom: 8,
                    marginBottom: 8,
                  }}
                >
                  <Text
                    style={{
                      fontFamily: "Poppins-Bold",
                      color: isDark ? "#fff" : "#000",
                    }}
                  >
                    Date: {formatDate(item.date_of_activity)}
                  </Text>
                  <Text
                    style={{
                      fontFamily: "Poppins-Regular",
                      color: isDark ? "#ccc" : "#222",
                    }}
                  >
                    Hours Logged: {item.hours_logged}
                  </Text>
                  <Text
                    style={{
                      fontFamily: "Poppins-Regular",
                      color: isDark ? "#ccc" : "#222",
                    }}
                  >
                    Description: {item.description}
                  </Text>
                </View>
              )}
            />
          )}

          <CustomButton
            title="Close"
            onPress={() => setShowLogsModal(false)}
            className="mt-4"
          />
        </View>
      </ReactNativeModal>
      {/* AI Description Modal */}
      <ReactNativeModal
        backdropTransitionOutTiming={1}
        useNativeDriver={true}
        useNativeDriverForBackdrop={true}
        isVisible={showAIDescriptionModal}
        onBackdropPress={() => setShowAIDescriptionModal(false)}
      >
        <View
          style={{
            backgroundColor: isDark ? "#1e1e1e" : "#ffffff",
            paddingHorizontal: 28,
            paddingVertical: 36,
            borderRadius: 16,
            shadowColor: "#000",
          }}
        >
          <TouchableOpacity
            onPress={() => setShowAIDescriptionModal(false)}
            style={{ position: "absolute", top: 20, right: 20, zIndex: 1 }}
          >
            <MaterialCommunityIcons
              name="close"
              size={24}
              color={isDark ? "#fff" : "#000"}
            />
          </TouchableOpacity>

          <Text
            style={{
              fontSize: 24,
              fontFamily: "Poppins-SemiBold",
              color: isDark ? "#fff" : "#1f2937",
              marginBottom: 16,
            }}
          >
            AI Activity Summary
          </Text>

          <Text
            style={{
              fontSize: 16,
              fontFamily: "Poppins-Regular",
              color: isDark ? "#ccc" : "#374151",
              marginBottom: 24,
            }}
            selectable={true}
          >
            {aiDescription}
          </Text>

          <CustomButton
            title="Replace Current Description"
            onPress={replaceAIDescription}
          />
        </View>
      </ReactNativeModal>
    </SafeAreaView>
  );
};

export default TrackActivities;
