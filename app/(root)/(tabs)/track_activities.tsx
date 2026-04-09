import React, { useState, useEffect, useMemo } from "react";
import { formatDateToYMD } from "@/lib/formatters";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Platform,
} from "react-native";
import {
  Host,
  Menu,
  Button as SwiftUIButton,
  HStack,
  Text as SwiftText,
  Image as SwiftImage,
} from "@expo/ui/swift-ui";
import {
  bold,
  buttonStyle,
  controlSize,
  foregroundStyle,
} from "@expo/ui/swift-ui/modifiers";
import { SafeAreaView } from "react-native-safe-area-context";
import { Activity } from "@/types/type";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import InputField from "@/components/InputField";
import DropdownField from "@/components/DropdownField";

import ReactNativeModal from "react-native-modal";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import CustomButton from "@/components/CustomButton";
import { confirmDestructiveAction } from "@/lib/confirmDestructiveAction";
import { useFetch, fetchAPI } from "@/lib/fetch";
import { useUser, useAuth } from "@clerk/clerk-expo";
import Purchases from "react-native-purchases";
import { useLocalSearchParams } from "expo-router";
import { PAYWALL_RESULT } from "react-native-purchases-ui";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback } from "react";
import * as Haptics from "expo-haptics";
import { useColorScheme } from "react-native";
import { presentPremiumPaywallIfNeeded } from "@/lib/premium";

const gradeOptions = ["Pre-9", "9", "10", "11", "12", "Post-12"];

const TrackActivities = () => {
  const { user } = useUser();
  const { getToken } = useAuth();
  const email = user?.primaryEmailAddress?.emailAddress;
  const [activities, setActivities] = useState<Activity[]>([]);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const primaryTextColor = isDark ? "#f5f5f5" : "#111827";
  const secondaryTextColor = isDark ? "#d4d4d8" : "#374151";
  const mutedTextColor = isDark ? "#a1a1aa" : "#6b7280";
  const surfaceColor = isDark ? "#1e1e1e" : "#ffffff";
  const elevatedSurfaceColor = isDark ? "#1a1a1a" : "#ffffff";
  const borderColor = isDark ? "#3f3f46" : "#d1d5db";
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortOption, setSortOption] = useState<string>("mostRecent");
  const [showSortModal, setShowSortModal] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [editingGrades, setEditingGrades] = useState<string[]>([]);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [logs, setLogs] = useState<any[]>([]);
  const [showLogsModal, setShowLogsModal] = useState<boolean>(false);
  const { fromAdd } = useLocalSearchParams();
  const [hasRefetchedFromAdd, setHasRefetchedFromAdd] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(null);

  // New state for the AI description modal
  const [aiDescription, setAiDescription] = useState<string>("");
  const [showAIDescriptionModal, setShowAIDescriptionModal] =
    useState<boolean>(false);
  const [
    selectedActivityForAIDescription,
    setSelectedActivityForAIDescription,
  ] = useState<Activity | null>(null);
  const [aiDescriptionLoading, setAiDescriptionLoading] =
    useState<boolean>(false);
  const [pendingAIResult, setPendingAIResult] = useState<boolean>(false);

  const resetAIDescriptionState = () => {
    setShowAIDescriptionModal(false);
    setSelectedActivityForAIDescription(null);
    setAiDescription("");
    setPendingAIResult(false);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return formatDateToYMD(date);
  };

  // Load auth token once; Clerk caches it and refreshes automatically
  useEffect(() => {
    getToken().then((token) => setAuthToken(token));
  }, [getToken]);

  const requestOptions = useMemo(() => {
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

  const {
    data: fetchedActivities,
    loading,
    error,
    refetch,
  } = useFetch<Activity[]>(
    "https://ec-ai.expo.app/getactivities",
    requestOptions,
    { enabled: !!requestOptions },
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
        const token = await getToken();
        await fetchAPI("https://ec-ai.expo.app/alteractivity", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
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
        console.log("Update error:", error);
        Alert.alert("Error", "Failed to update activity.");
      }
    }
  };

  const deleteActivity = async (activity: Activity) => {
    try {
      const token = await getToken();
      const res = await fetch("https://ec-ai.expo.app/deleteactivity", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ activityId: activity.id }),
      });
      if (!res.ok) {
        console.log("Delete failed with status", res.status);
        Alert.alert("Error", "Failed to delete activity.");
        return;
      }
      setActivities((prev) => prev.filter((a) => a.id !== activity.id));
      Alert.alert("Deleted", "Activity deleted successfully.");
    } catch (error) {
      console.log("Delete error:", error);
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

  const sortLabels: Record<string, string> = {
    mostRecent: "Most Recent",
    hours: "Hours",
    category: "Career Field",
  };
  const sortChoices = [
    {
      key: "mostRecent",
      label: "Most Recent",
      icon: "clock-outline" as const,
    },
    {
      key: "hours",
      label: "Hours",
      icon: "timer-sand" as const,
    },
    {
      key: "category",
      label: "Career Field",
      icon: "briefcase-variant-outline" as const,
    },
  ];

  const sortActivities = (option: string) => {
    if (option === "mostRecent") {
      if (fetchedActivities && Array.isArray(fetchedActivities)) {
        setActivities(fetchedActivities);
      }
    } else {
      let sortedActivities = [...activities];
      if (option === "hours") {
        sortedActivities.sort((a, b) => b.hoursPerWeek - a.hoursPerWeek);
      } else if (option === "category") {
        sortedActivities.sort((a, b) => a.category.localeCompare(b.category));
      }
      setActivities(sortedActivities);
    }
    setSortOption(option);
  };

  const showSortOptions = () => {
    setShowSortModal(true);
  };

  const filteredActivities = activities.filter((activity) =>
    activity.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const openLogs = async (activity: Activity) => {
    try {
      const token = await getToken();
      const response = await fetch(`https://ec-ai.expo.app/getactivitylogs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ activity_id: activity.id }),
      });
      const result = await response.json();

      if (!response.ok) {
        Alert.alert("Error", result?.error || "Failed to fetch activity logs.");
        return;
      }

      if (!Array.isArray(result.data) || result.data.length === 0) {
        setLogs([]);
        Alert.alert("Error", "No logs found for this activity.");
        return;
      }

      setLogs(result.data);
      setShowLogsModal(true);
    } catch (error) {
      console.log("Error fetching logs:", error);
      Alert.alert("Error", "Failed to fetch activity logs.");
    }
  };

  const getAIDescription = async (activity: Activity) => {
    if (aiDescriptionLoading) return;

    try {
      resetAIDescriptionState();

      const customerInfo = await Purchases.getCustomerInfo();
      let isPremium = customerInfo.entitlements.active["premium"] !== undefined;

      if (!isPremium) {
        const result = await presentPremiumPaywallIfNeeded();

        if (
          result === PAYWALL_RESULT.PURCHASED ||
          result === PAYWALL_RESULT.RESTORED
        ) {
          isPremium = true;
        } else {
          return;
        }
      }

      setAiDescriptionLoading(true);

      const token = await getToken();
      const response = await fetch("https://ec-ai.expo.app/getaidescription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ activity_id: activity.id }),
      });

      const result = await response.json();

      if (!response.ok) {
        Alert.alert(
          "Error",
          result?.error || "Failed to generate AI activity summary.",
        );
        return;
      }

      if (!result?.description) {
        Alert.alert("Error", "No AI summary was returned.");
        return;
      }

      setSelectedActivityForAIDescription(activity);
      setAiDescription(result.description);
      setPendingAIResult(true);
    } catch (error) {
      console.log("Error in getAIDescription:", error);
      Alert.alert("Error", "Something went wrong. Please try again.");
    } finally {
      setAiDescriptionLoading(false);
    }
  };

  // Function to call the new updatedescription+api endpoint when "Replace Current Description" is pushed.
  const replaceAIDescription = async () => {
    if (!selectedActivityForAIDescription) return;
    try {
      const token = await getToken();
      await fetchAPI("https://ec-ai.expo.app/updatedescription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          activityId: selectedActivityForAIDescription.id,
          description: aiDescription,
        }),
      });
      await refetch();
      resetAIDescriptionState();
      Alert.alert("Success", "Activity description replaced successfully.");
    } catch (error) {
      console.log("Error replacing description:", error);
      Alert.alert("Error", "Failed to replace description.");
    }
  };

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      className={`flex-1 px-4 py-6 ${isDark ? "bg-[#121212]" : "bg-primary-200"}`}
    >
      <Text
        style={{
          fontSize: 30,
          fontFamily: "Poppins-Bold",
          paddingBottom: 8,
          color: primaryTextColor,
        }}
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
      <View className="flex-row mb-4">
        {Platform.OS === "ios" &&
        !showEditModal &&
        !showLogsModal &&
        !showAIDescriptionModal ? (
          <Host
            matchContents={{ vertical: true }}
            colorScheme={isDark ? "dark" : "light"}
            style={{ minWidth: 200, minHeight: 44 }}
          >
            <Menu
              label={
                <HStack spacing={4}>
                  <HStack spacing={0}>
                    <SwiftText
                      modifiers={[
                        foregroundStyle(isDark ? "#f5f5f5" : "#111827"),
                        bold(),
                      ]}
                    >
                      {"Sort: "}
                    </SwiftText>
                    <SwiftText
                      modifiers={[
                        foregroundStyle(isDark ? "#f5f5f5" : "#111827"),
                      ]}
                    >
                      {sortLabels[sortOption]}
                    </SwiftText>
                  </HStack>
                  <SwiftImage
                    systemName="chevron.up.chevron.down"
                    size={10}
                    color={isDark ? "#a1a1aa" : "#6b7280"}
                  />
                </HStack>
              }
              modifiers={[buttonStyle("bordered"), controlSize("small")]}
            >
              {sortChoices.map((choice) => (
                <SwiftUIButton
                  key={choice.key}
                  label={choice.label}
                  systemImage={
                    sortOption === choice.key ? "checkmark" : undefined
                  }
                  onPress={() => sortActivities(choice.key)}
                />
              ))}
            </Menu>
          </Host>
        ) : (
          <TouchableOpacity
            onPress={showSortOptions}
            style={{
              backgroundColor: surfaceColor,
              borderRadius: 12,
              borderWidth: 1,
              borderColor,
              paddingHorizontal: 12,
              paddingVertical: 7,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: isDark ? 0.2 : 0.08,
              shadowRadius: 12,
              elevation: 2,
            }}
          >
            <View>
              <Text
                style={{
                  color: primaryTextColor,
                  fontFamily: "Poppins-Regular",
                  fontSize: 13,
                }}
              >
                <Text style={{ fontFamily: "Poppins-Bold" }}>Sort:</Text>{" "}
                {sortLabels[sortOption]}
              </Text>
            </View>
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: isDark ? "#27272a" : "#eef2ff",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <MaterialCommunityIcons
                name="chevron-down"
                size={20}
                color={isDark ? "#c4b5fd" : "#5b55f6"}
              />
            </View>
          </TouchableOpacity>
        )}
      </View>
      {!loading && filteredActivities.length === 0 ? (
        <Text
          style={{
            textAlign: "center",
            color: mutedTextColor,
            fontFamily: "Poppins-Regular",
            marginTop: 40,
          }}
        >
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
                backgroundColor: surfaceColor,
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
              <View
                style={{
                  alignSelf: "flex-start",
                  backgroundColor: isDark ? "#2d2b5e" : "#ededfd",
                  borderRadius: 6,
                  paddingHorizontal: 10,
                  paddingVertical: 3,
                  marginBottom: 10,
                }}
              >
                <Text
                  style={{
                    fontFamily: "Poppins-SemiBold",
                    fontSize: 12,
                    color: "#5b55f6",
                  }}
                >
                  {item.category}
                </Text>
              </View>

              <View className="flex-row">
                <View className="w-24">
                  <Text
                    style={{
                      fontFamily: "Poppins-Regular",
                      fontSize: 12,
                      marginBottom: 4,
                      color: secondaryTextColor,
                    }}
                  >
                    {item.grade}
                  </Text>

                  <Text
                    style={{
                      fontFamily: "Poppins-Regular",
                      fontSize: 12,
                      marginBottom: 4,
                      color: secondaryTextColor,
                    }}
                  >
                    {" "}
                    {item.hoursPerWeek} hr/wk
                  </Text>
                  <Text
                    style={{
                      fontFamily: "Poppins-Regular",
                      fontSize: 12,
                      marginBottom: 4,
                      color: secondaryTextColor,
                    }}
                  >
                    {" "}
                    {item.weeksPerYear} wk/yr
                  </Text>
                </View>
                <View className="flex-1">
                  <Text
                    style={{
                      fontFamily: "Poppins-SemiBold",
                      marginBottom: 4,
                      color: primaryTextColor,
                    }}
                  >
                    {item.name}
                  </Text>

                  {item.roles && (
                    <Text
                      style={{
                        fontFamily: "Poppins-Regular",
                        fontSize: 12,
                        color: secondaryTextColor,
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
                      color: mutedTextColor,
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
                  disabled={aiDescriptionLoading}
                  className="mr-4"
                >
                  <MaterialCommunityIcons
                    name="robot"
                    size={24}
                    color={aiDescriptionLoading ? "#A9A5D9" : "#5b55f6"}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    confirmDestructiveAction({
                      title: "Delete Activity",
                      message: `Delete "${item.name}"? This action cannot be undone.`,
                      onConfirm: () => deleteActivity(item),
                    });
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
      {Platform.OS !== "ios" && (
        <ReactNativeModal
          isVisible={showSortModal}
          backdropOpacity={0.4}
          onBackdropPress={() => setShowSortModal(false)}
          onBackButtonPress={() => setShowSortModal(false)}
          useNativeDriver={true}
          useNativeDriverForBackdrop={true}
          animationIn="slideInUp"
          animationOut="slideOutDown"
          style={{ justifyContent: "flex-end", margin: 0 }}
        >
          <View
            style={{
              backgroundColor: elevatedSurfaceColor,
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              paddingHorizontal: 20,
              paddingTop: 14,
              paddingBottom: 28,
              borderWidth: 1,
              borderColor,
            }}
          >
            <View
              style={{
                alignSelf: "center",
                width: 44,
                height: 5,
                borderRadius: 999,
                backgroundColor: isDark ? "#3f3f46" : "#d4d4d8",
                marginBottom: 18,
              }}
            />
            <Text
              style={{
                color: mutedTextColor,
                fontFamily: "Poppins-Bold",
                fontSize: 12,
                letterSpacing: 1,
                textTransform: "uppercase",
                marginBottom: 4,
                textAlign: "center",
              }}
            >
              Organize Activities
            </Text>
            <Text
              style={{
                color: primaryTextColor,
                fontFamily: "Poppins-Bold",
                fontSize: 24,
                textAlign: "center",
                marginBottom: 20,
              }}
            >
              Sort By
            </Text>

            {sortChoices.map((choice) => {
              const isSelected = sortOption === choice.key;

              return (
                <TouchableOpacity
                  key={choice.key}
                  onPress={() => {
                    sortActivities(choice.key);
                    setShowSortModal(false);
                  }}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    backgroundColor: isSelected
                      ? isDark
                        ? "rgba(91, 85, 246, 0.18)"
                        : "#eef2ff"
                      : surfaceColor,
                    borderRadius: 18,
                    borderWidth: 1,
                    borderColor: isSelected
                      ? "#5b55f6"
                      : isDark
                        ? "#3f3f46"
                        : "#e5e7eb",
                    paddingHorizontal: 16,
                    paddingVertical: 15,
                    marginBottom: 12,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 12,
                    }}
                  >
                    <View
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 18,
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: isSelected
                          ? "#5b55f6"
                          : isDark
                            ? "#27272a"
                            : "#f3f4f6",
                      }}
                    >
                      <MaterialCommunityIcons
                        name={choice.icon}
                        size={18}
                        color={isSelected ? "#fff" : secondaryTextColor}
                      />
                    </View>
                    <View>
                      <Text
                        style={{
                          color: primaryTextColor,
                          fontFamily: isSelected
                            ? "Poppins-Bold"
                            : "Poppins-SemiBold",
                          fontSize: 16,
                        }}
                      >
                        {choice.label}
                      </Text>
                      {isSelected && (
                        <Text
                          style={{
                            color: "#5b55f6",
                            fontFamily: "Poppins-SemiBold",
                            fontSize: 12,
                            marginTop: 2,
                          }}
                        >
                          Current sort
                        </Text>
                      )}
                    </View>
                  </View>
                  {isSelected ? (
                    <MaterialCommunityIcons
                      name="check-circle"
                      size={22}
                      color="#5b55f6"
                    />
                  ) : (
                    <MaterialCommunityIcons
                      name="chevron-right"
                      size={20}
                      color={mutedTextColor}
                    />
                  )}
                </TouchableOpacity>
              );
            })}

            <TouchableOpacity
              onPress={() => setShowSortModal(false)}
              style={{
                marginTop: 4,
                borderRadius: 18,
                borderWidth: 1,
                borderColor: "rgba(239, 68, 68, 0.28)",
                backgroundColor: isDark ? "rgba(127, 29, 29, 0.28)" : "#fef2f2",
                paddingVertical: 16,
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  color: "#dc2626",
                  fontFamily: "Poppins-Bold",
                  fontSize: 16,
                }}
              >
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </ReactNativeModal>
      )}
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
            backgroundColor: elevatedSurfaceColor,
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
              color={primaryTextColor}
            />
          </TouchableOpacity>
          <Text
            style={{
              fontSize: 24,
              fontFamily: "Poppins-Bold",
              color: primaryTextColor,
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
                <DropdownField
                  label={
                    <Text
                      style={{
                        fontWeight: "600",
                        fontSize: 18,
                        fontFamily: "Poppins-Bold",
                        color: primaryTextColor,
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
                  placeholder={
                    loadingCareerFields
                      ? "Loading..."
                      : errorCareerFields
                        ? "Failed to load career fields"
                        : "Select a career field"
                  }
                />
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
                      color: primaryTextColor,
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
                                : "#111827",
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
            backgroundColor: surfaceColor,
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
              color={primaryTextColor}
            />
          </TouchableOpacity>

          <Text
            style={{
              fontSize: 24,
              fontWeight: "bold",
              color: primaryTextColor,
              marginBottom: 16,
            }}
          >
            Activity Logs
          </Text>

          {logs.length === 0 ? (
            <Text style={{ color: mutedTextColor, marginBottom: 16 }}>
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
                      color: primaryTextColor,
                    }}
                  >
                    Date: {formatDate(item.date_of_activity)}
                  </Text>
                  <Text
                    style={{
                      fontFamily: "Poppins-Regular",
                      color: secondaryTextColor,
                    }}
                  >
                    Hours Logged: {item.hours_logged}
                  </Text>
                  <Text
                    style={{
                      fontFamily: "Poppins-Regular",
                      color: secondaryTextColor,
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
        onBackdropPress={resetAIDescriptionState}
        onBackButtonPress={resetAIDescriptionState}
      >
        <View
          style={{
            backgroundColor: surfaceColor,
            paddingHorizontal: 28,
            paddingVertical: 36,
            borderRadius: 16,
            shadowColor: "#000",
          }}
        >
          <TouchableOpacity
            onPress={resetAIDescriptionState}
            style={{ position: "absolute", top: 20, right: 20, zIndex: 1 }}
          >
            <MaterialCommunityIcons
              name="close"
              size={24}
              color={primaryTextColor}
            />
          </TouchableOpacity>

          <Text
            style={{
              fontSize: 24,
              fontFamily: "Poppins-SemiBold",
              color: primaryTextColor,
              marginBottom: 16,
            }}
          >
            AI Activity Summary
          </Text>

          <Text
            style={{
              fontSize: 16,
              fontFamily: "Poppins-Regular",
              color: secondaryTextColor,
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
      {/* AI Loading Overlay */}
      <ReactNativeModal
        isVisible={aiDescriptionLoading}
        backdropOpacity={0.6}
        backdropColor="#000"
        useNativeDriver={true}
        useNativeDriverForBackdrop={true}
        animationIn="fadeIn"
        animationOut="fadeOut"
        animationInTiming={200}
        animationOutTiming={200}
        backdropTransitionInTiming={200}
        backdropTransitionOutTiming={200}
        style={{ margin: 0 }}
        onModalHide={() => {
          if (pendingAIResult) {
            setPendingAIResult(false);
            setShowAIDescriptionModal(true);
          }
        }}
      >
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <View
            style={{
              backgroundColor: surfaceColor,
              borderRadius: 16,
              paddingHorizontal: 40,
              paddingVertical: 36,
              alignItems: "center",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.2,
              shadowRadius: 8,
              elevation: 8,
            }}
          >
            <ActivityIndicator size="large" color="#5b55f6" />
            <Text
              style={{
                fontFamily: "Poppins-SemiBold",
                fontSize: 16,
                color: primaryTextColor,
                marginTop: 16,
              }}
            >
              Generating AI Summary
            </Text>
            <Text
              style={{
                fontFamily: "Poppins-Regular",
                fontSize: 13,
                color: mutedTextColor,
                marginTop: 6,
              }}
            >
              This may take a moment...
            </Text>
          </View>
        </View>
      </ReactNativeModal>
    </SafeAreaView>
  );
};

export default TrackActivities;
