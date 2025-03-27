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
import CustomButton from "@/components/CustomButton";
import { useFetch, fetchAPI } from "@/lib/fetch";
import { useUser } from "@clerk/clerk-expo";

const gradeOptions = ["Pre-9", "9", "10", "11", "12", "Post-12"];

const TrackActivities = () => {
  const { user } = useUser();
  const email = user?.primaryEmailAddress?.emailAddress;
  const [activities, setActivities] = useState<Activity[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortOption, setSortOption] = useState<string>("mostRecent");
  const [showSortDropdown, setShowSortDropdown] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [editingGrades, setEditingGrades] = useState<string[]>([]);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);

  const [deleteTarget, setDeleteTarget] = useState<Activity | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

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
  } = useFetch<Activity[]>("/(api)/getactivities", requestOptions);

  const {
    data: careerFields = [],
    loading: loadingCareerFields,
    error: errorCareerFields,
  } = useFetch<{ label: string; value: string }[]>("/(api)/activitytypes");

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

  const updateActivity = async () => {
    if (editingActivity && email) {
      const updatedActivity = {
        ...editingActivity,
        grade: editingGrades.join(", "),
      };

      try {
        await fetchAPI("/(api)/alteractivity", {
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
      const res = await fetch("/(api)/deleteactivity", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activityId: deleteTarget.id }),
      });

      if (!res.ok) throw new Error("Delete failed");

      setActivities((prev) => prev.filter((a) => a.id !== deleteTarget.id));
      setShowDeleteModal(false);
      setDeleteTarget(null);
      Alert.alert("Deleted", "Activity deleted successfully.");
    } catch (error) {
      console.error("Delete error:", error);
      Alert.alert("Error", "Failed to delete activity.");
    }
  };

  const handleEditPress = (item: Activity) => {
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

  return (
    <SafeAreaView className="flex-1 bg-primary-200 px-4 py-6">
      <Text className="text-3xl font-bold text-gray-800 font-PoppinsBold pb-2">
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

      <FlatList
        data={filteredActivities}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        renderItem={({ item }) => (
          <View className="bg-white p-4 mb-4 rounded-lg shadow">
            <Text className="font-bold font-PoppinsSemiBold text-base mb-2">
              {item.category}
            </Text>
            <View className="flex-row">
              <View className="w-24">
                <Text className="font-PoppinsRegular mb-1 text-xs">
                  {item.grade}
                </Text>
                <Text className="font-PoppinsRegular text-xs mb-1">
                  {item.hoursPerWeek} hr/wk
                </Text>
                <Text className="font-PoppinsRegular text-xs mb-1">
                  {item.weeksPerYear} wk/yr
                </Text>
              </View>
              <View className="flex-1">
                <Text className="font-PoppinsSemiBold mb-1">{item.name}</Text>
                {item.roles && (
                  <Text className="font-PoppinsRegular text-xs text-gray-600 mb-1">
                    Roles: {item.roles}
                  </Text>
                )}
                <Text className="font-PoppinsRegular text-xs text-gray-800">
                  {item.description}
                </Text>
              </View>
            </View>
            <View className="flex-row justify-end mt-2">
              <TouchableOpacity
                onPress={() => handleEditPress(item)}
                className="mr-4"
              >
                <MaterialCommunityIcons
                  name="pencil-outline"
                  size={24}
                  color="#5b55f6"
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
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
          </View>
        )}
      />

      {/* Delete Activity Confirmation Modal */}
      <ReactNativeModal isVisible={showDeleteModal}>
        <View className="bg-white px-7 py-9 rounded-2xl">
          <Text className="text-xl font-PoppinsSemiBold text-center mb-4">
            Confirm Delete
          </Text>
          <Text className="text-base font-PoppinsSemiBold text-center mb-6">
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
        <View className="bg-primary-200 px-7 py-9 rounded-2xl mb-16 shadow-md ">
          <TouchableOpacity
            onPress={() => {
              setEditingActivity(null);
              setShowEditModal(false);
            }}
            style={{ position: "absolute", top: 20, right: 20, zIndex: 1 }}
          >
            <MaterialCommunityIcons name="close" size={24} color="#000" />
          </TouchableOpacity>
          <Text className="text-3xl font-bold text-gray-800 font-PoppinsBold pb-2">
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
                    className="my-2"
                  />
                ) : errorCareerFields ? (
                  <Text className="text-red-500 font-PoppinsRegular mb-2">
                    Failed to load career fields
                  </Text>
                ) : (
                  <DropdownField
                    label={
                      <Text className="font-medium text-lg font-PoppinsBold">
                        Career Field <Text className="text-red-500">*</Text>
                      </Text>
                    }
                    data={careerFields ?? []} // Ensures careerFields is never undefined
                    value={editingActivity?.category} // Prevents errors if editingActivity is null
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
                <View className="mb-4">
                  <Text className="text-gray-700 font-medium text-lg font-PoppinsBold mb-2">
                    Grades <Text className="text-red-500">*</Text>
                  </Text>
                  <View className="flex-row flex-wrap gap-3">
                    {gradeOptions.map((grade) => (
                      <TouchableOpacity
                        key={grade}
                        onPress={() => toggleEditingGrade(grade)}
                        className={`px-2 py-2 border rounded-lg ${
                          editingGrades.includes(grade)
                            ? "bg-[#5b55f6] border-[#5b55f6]"
                            : "border-gray-300 bg-white"
                        }`}
                      >
                        <Text
                          className={`font-PoppinsRegular ${
                            editingGrades.includes(grade)
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
                  className="mt-5 mb-5 rounded-lg shadow-md"
                />
              </>
            )}
          </KeyboardAwareScrollView>
        </View>
      </ReactNativeModal>
    </SafeAreaView>
  );
};

export default TrackActivities;
