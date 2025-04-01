import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  ScrollView,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import InputField from "@/components/InputField";
import CustomButton from "@/components/CustomButton";
import ReactNativeModal from "react-native-modal";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useUser } from "@clerk/clerk-expo";

interface Opportunity {
  id: string;
  school?: string;
  title: string; // from activity_name
  careerField?: string;
  activityType: string;
  location: string;
  duration?: string;
  deadline?: string;
  apply?: string; // from application_link
  gradeRequirements?: string;
  raceRequirements?: string;
  genderRequirements?: string;
  ageRequirements?: string;
  primaryCity?: string;
  onlyFRLStudents?: boolean;
  onlyFirstGen?: boolean;
  minGPA?: number;
  minSAT?: number;
  minACT?: number;
  minPSAT?: number;
  hasLeadershipRoles?: boolean;
  selectivityLevel?: string;
  outsideUS?: boolean;
  hoursPerWeek?: number;
  createdAt?: string;
}

const Opportunities = () => {
  const { user } = useUser();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [savedOpportunities, setSavedOpportunities] = useState<Set<string>>(
    new Set(),
  );
  const [addedOpportunities, setAddedOpportunities] = useState<Set<string>>(
    new Set(),
  );
  const [removedOpportunities, setRemovedOpportunities] = useState<Set<string>>(
    new Set(),
  );
  const [showSortDropdown, setShowSortDropdown] = useState<boolean>(false);
  // State for the detailed view modal
  const [selectedOpportunity, setSelectedOpportunity] =
    useState<Opportunity | null>(null);
  // State for the AI Suggested modal
  const [showAISuggestedModal, setShowAISuggestedModal] =
    useState<boolean>(false);

  // Fetch opportunities from the API and map fields accordingly
  const fetchOpportunities = async () => {
    if (!user) return; // Ensure the user is loaded
    try {
      const response = await fetch("/(api)/getopportunities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clerk_id: user.id }),
      });
      if (!response.ok) {
        throw new Error("Failed to fetch opportunities");
      }
      const json = await response.json();
      const formatted = json.data.map((op: any) => ({
        id: op.id,
        school: op.school,
        title: op.activityName, // mapping API's activityName to title
        careerField: op.careerField,
        activityType: op.activityType,
        location: op.location,
        duration: op.duration,
        deadline: op.deadline
          ? new Date(op.deadline).toISOString().split("T")[0]
          : undefined,
        apply: op.applicationLink, // mapping API's applicationLink to apply
        gradeRequirements: op.gradeRequirements,
        raceRequirements: op.raceRequirements,
        genderRequirements: op.genderRequirements,
        ageRequirements: op.ageRequirements,
        primaryCity: op.primaryCity,
        onlyFRLStudents: op.onlyFRLStudents,
        onlyFirstGen: op.onlyFirstGen,
        minGPA: op.minGPA,
        minSAT: op.minSAT,
        minACT: op.minACT,
        minPSAT: op.minPSAT,
        hasLeadershipRoles: op.hasLeadershipRoles,
        selectivityLevel: op.selectivityLevel,
        outsideUS: op.outsideUS,
        hoursPerWeek: op.hoursPerWeek,
        createdAt: op.createdAt,
      }));
      setOpportunities(formatted);
      setError(null);
    } catch (err: any) {
      console.error("Error fetching opportunities:", err);
      setError(err.message || "Error fetching opportunities");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchOpportunities();
    }
  }, [user]);

  // Save opportunity and call the API route to persist the saved opportunity.
  const handleSave = async (opportunity: Opportunity) => {
    try {
      if (!user) {
        console.error("User not logged in");
        return;
      }
      const clerk_id = user.id; // Using Clerk's user id as clerk_id

      // Avoid saving if already saved
      if (savedOpportunities.has(opportunity.id)) {
        return;
      }
      setSavedOpportunities((prev) => new Set([...prev, opportunity.id]));

      // Call the addsavedopportunity API route to add the saved opportunity
      const res = await fetch("/(api)/addsavedopportunity", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clerk_id,
          opportunity_id: opportunity.id,
        }),
      });
      if (!res.ok) {
        console.error("Failed to add saved opportunity to backend");
      }
    } catch (error) {
      console.error("Error saving opportunity:", error);
    }
  };

  const handleAutoAdd = (id: string) => {
    setAddedOpportunities((prev) => new Set([...prev, id]));
  };

  // Refresh function: refetch opportunities and clear temporary states
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchOpportunities();
      setRemovedOpportunities(
        new Set([...savedOpportunities, ...addedOpportunities]),
      );
      setSavedOpportunities(new Set());
      setAddedOpportunities(new Set());
    } catch (error) {
      console.error("Error on refresh:", error);
    } finally {
      setRefreshing(false);
    }
  };

  const filteredOpportunities = opportunities
    .filter((opportunity) => !removedOpportunities.has(opportunity.id))
    .filter(
      (opportunity) =>
        opportunity.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        opportunity.activityType
          .toLowerCase()
          .includes(searchQuery.toLowerCase()),
    );

  // Sorting function
  const sortOpportunities = () => {
    const sortedOpportunities = [...opportunities].sort((a, b) =>
      a.activityType.localeCompare(b.activityType),
    );
    setOpportunities(sortedOpportunities);
    setShowSortDropdown(false);
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-primary-200 px-4 py-6">
        <ActivityIndicator size="large" color="#5b55f6" />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-primary-200 px-4 py-6">
        <Text className="text-red-500">{error}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-primary-200 px-4 py-6">
      <Text className="text-3xl font-bold text-gray-800 font-PoppinsBold pb-2">
        New Opportunities
      </Text>

      {/* Search Bar */}
      <View className="mb-4">
        <InputField
          label=""
          keyboardShouldPersistTaps="never"
          placeholder="Search Opportunities"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Sorting and AI Suggested Options */}
      <View className="flex-row mb-4 items-center justify-between relative z-10">
        <TouchableOpacity
          onPress={() => setShowSortDropdown(!showSortDropdown)}
        >
          <Text className="text-general-400 font-PoppinsBold">Sort By ▾</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setShowAISuggestedModal(true)}>
          <Text className="text-general-400 font-PoppinsBold">
            AI Suggested ✨
          </Text>
        </TouchableOpacity>
        {showSortDropdown && (
          <View className="absolute bg-white p-2 rounded-lg shadow-lg px-5 mt-6 py-2.5 z-20">
            <TouchableOpacity onPress={sortOpportunities}>
              <Text className="text-general-400 font-PoppinsSemiBold">
                Career Field
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* List of Opportunities */}
      <FlatList
        data={filteredOpportunities}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 80 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={{ alignItems: "center", marginTop: 20 }}>
            <Text className="text-gray-500 text-base">
              No opportunities available.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          // Wrap each opportunity in a TouchableOpacity to allow clicking
          <TouchableOpacity onPress={() => setSelectedOpportunity(item)}>
            <View className="bg-white p-4 mb-4 rounded-lg shadow">
              <Text className="font-PoppinsSemiBold text-base mb-2">
                {item.title}
              </Text>
              <Text className="font-PoppinsRegular text-xs mb-1">
                <Text className="font-PoppinsSemiBold">Activity Type:</Text>{" "}
                {item.activityType}
              </Text>
              <Text className="font-PoppinsRegular text-xs mb-1">
                <Text className="font-PoppinsSemiBold">Location:</Text>{" "}
                {item.location}
              </Text>
              {item.duration && (
                <Text className="font-PoppinsRegular text-xs mb-1">
                  <Text className="font-PoppinsSemiBold">Duration:</Text>{" "}
                  {item.duration}
                </Text>
              )}
              {item.deadline && (
                <Text className="font-PoppinsRegular text-xs mb-1">
                  <Text className="font-PoppinsSemiBold">Deadline:</Text>{" "}
                  {item.deadline}
                </Text>
              )}
              {item.apply && (
                <View className="flex-row flex-wrap items-center">
                  <Text className="font-PoppinsSemiBold text-xs">Apply:</Text>
                  <TouchableOpacity
                    onPress={() => Linking.openURL(item.apply!)}
                    style={{ marginLeft: 8 }}
                  >
                    <Text className="text-blue-500 underline font-PoppinsRegular text-xs">
                      {item.apply}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
              {/* Save Button */}
              <View className="flex-row justify-between mt-4">
                <CustomButton
                  title={savedOpportunities.has(item.id) ? "Saved" : "Save"}
                  onPress={() => handleSave(item)}
                  bgVariant="primary"
                  textVariant="default"
                  className={`px-4 py-2 rounded-lg flex-1 items-center ${
                    savedOpportunities.has(item.id)
                      ? "bg-primary-900"
                      : "bg-primary"
                  }`}
                />
              </View>
            </View>
          </TouchableOpacity>
        )}
      />

      {/* Detailed Opportunity Modal */}
      <ReactNativeModal
        isVisible={selectedOpportunity !== null}
        onBackdropPress={() => setSelectedOpportunity(null)}
        style={{ marginTop: 60, marginHorizontal: 10 }}
      >
        <View className="bg-white p-6 rounded-lg max-h-full">
          <TouchableOpacity
            onPress={() => setSelectedOpportunity(null)}
            style={{ position: "absolute", top: 20, right: 20, zIndex: 1 }}
          >
            <MaterialCommunityIcons name="close" size={24} color="#000" />
          </TouchableOpacity>
          <Text className="text-2xl font-bold mb-2">
            {selectedOpportunity?.title}
          </Text>
          <ScrollView>
            <Text className="mb-1">
              <Text className="font-semibold">School:</Text>{" "}
              {selectedOpportunity?.school}
            </Text>
            <Text className="mb-1">
              <Text className="font-semibold">Career Field:</Text>{" "}
              {selectedOpportunity?.careerField}
            </Text>
            <Text className="mb-1">
              <Text className="font-semibold">Activity Type:</Text>{" "}
              {selectedOpportunity?.activityType}
            </Text>
            <Text className="mb-1">
              <Text className="font-semibold">Location:</Text>{" "}
              {selectedOpportunity?.location}
            </Text>
            {selectedOpportunity?.duration && (
              <Text className="mb-1">
                <Text className="font-semibold">Duration:</Text>{" "}
                {selectedOpportunity.duration}
              </Text>
            )}
            {selectedOpportunity?.deadline && (
              <Text className="mb-1">
                <Text className="font-semibold">Deadline:</Text>{" "}
                {selectedOpportunity.deadline}
              </Text>
            )}
            {selectedOpportunity?.apply && (
              <View className="mb-1 flex-row flex-wrap">
                <Text className="font-semibold">Apply:</Text>
                <TouchableOpacity
                  onPress={() => Linking.openURL(selectedOpportunity!.apply!)}
                  style={{ marginLeft: 8 }}
                >
                  <Text className="text-blue-500 underline">
                    {selectedOpportunity.apply}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
            {selectedOpportunity?.gradeRequirements && (
              <Text className="mb-1">
                <Text className="font-semibold">Grade Requirements:</Text>{" "}
                {selectedOpportunity.gradeRequirements}
              </Text>
            )}
            {selectedOpportunity?.raceRequirements && (
              <Text className="mb-1">
                <Text className="font-semibold">Race Requirements:</Text>{" "}
                {selectedOpportunity.raceRequirements}
              </Text>
            )}
            {selectedOpportunity?.genderRequirements && (
              <Text className="mb-1">
                <Text className="font-semibold">Gender Requirements:</Text>{" "}
                {selectedOpportunity.genderRequirements}
              </Text>
            )}
            {selectedOpportunity?.ageRequirements && (
              <Text className="mb-1">
                <Text className="font-semibold">Age Requirements:</Text>{" "}
                {selectedOpportunity.ageRequirements}
              </Text>
            )}
            {selectedOpportunity?.primaryCity && (
              <Text className="mb-1">
                <Text className="font-semibold">Primary City:</Text>{" "}
                {selectedOpportunity.primaryCity}
              </Text>
            )}
            <Text className="mb-1">
              <Text className="font-semibold">Only FRL Students:</Text>{" "}
              {selectedOpportunity?.onlyFRLStudents ? "Yes" : "No"}
            </Text>
            <Text className="mb-1">
              <Text className="font-semibold">Only First Gen:</Text>{" "}
              {selectedOpportunity?.onlyFirstGen ? "Yes" : "No"}
            </Text>
            {selectedOpportunity?.minGPA !== undefined && (
              <Text className="mb-1">
                <Text className="font-semibold">Min GPA:</Text>{" "}
                {selectedOpportunity.minGPA}
              </Text>
            )}
            {selectedOpportunity?.minSAT !== undefined && (
              <Text className="mb-1">
                <Text className="font-semibold">Min SAT:</Text>{" "}
                {selectedOpportunity.minSAT}
              </Text>
            )}
            {selectedOpportunity?.minACT !== undefined && (
              <Text className="mb-1">
                <Text className="font-semibold">Min ACT:</Text>{" "}
                {selectedOpportunity.minACT}
              </Text>
            )}
            {selectedOpportunity?.minPSAT !== undefined && (
              <Text className="mb-1">
                <Text className="font-semibold">Min PSAT:</Text>{" "}
                {selectedOpportunity.minPSAT}
              </Text>
            )}
            <Text className="mb-1">
              <Text className="font-semibold">Has Leadership Roles:</Text>{" "}
              {selectedOpportunity?.hasLeadershipRoles ? "Yes" : "No"}
            </Text>
            {selectedOpportunity?.selectivityLevel && (
              <Text className="mb-1">
                <Text className="font-semibold">Selectivity Level:</Text>{" "}
                {selectedOpportunity.selectivityLevel}
              </Text>
            )}
            <Text className="mb-1">
              <Text className="font-semibold">Outside US:</Text>{" "}
              {selectedOpportunity?.outsideUS ? "Yes" : "No"}
            </Text>
            {selectedOpportunity?.hoursPerWeek !== undefined && (
              <Text className="mb-1">
                <Text className="font-semibold">Hours per Week:</Text>{" "}
                {selectedOpportunity.hoursPerWeek}
              </Text>
            )}
            {selectedOpportunity?.createdAt && (
              <Text className="mb-1">
                <Text className="font-semibold">Created At:</Text>{" "}
                {selectedOpportunity.createdAt}
              </Text>
            )}
          </ScrollView>
        </View>
      </ReactNativeModal>

      {/* AI Suggested Modal */}
      <ReactNativeModal
        isVisible={showAISuggestedModal}
        style={{
          justifyContent: "flex-start",
          marginTop: 60,
          marginHorizontal: 10,
        }}
        onBackdropPress={() => setShowAISuggestedModal(false)}
        onBackButtonPress={() => setShowAISuggestedModal(false)}
      >
        <View className="bg-primary-200 px-7 py-9 rounded-2xl mb-16 shadow-md">
          <TouchableOpacity
            onPress={() => setShowAISuggestedModal(false)}
            style={{ position: "absolute", top: 20, right: 20, zIndex: 1 }}
          >
            <MaterialCommunityIcons name="close" size={24} color="#000" />
          </TouchableOpacity>
          <Text className="text-3xl font-bold text-gray-800 font-PoppinsBold pb-2 text-center">
            AI Suggested Opportunities
          </Text>
          {filteredOpportunities.length > 0 ? (
            <FlatList
              data={filteredOpportunities}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View className="bg-white p-4 mb-3 rounded-lg flex-row justify-between items-center">
                  <View>
                    <Text className="text-lg font-PoppinsSemiBold text-gray-900">
                      {item.title}
                    </Text>
                    <Text className="text-sm text-gray-500">
                      {item.activityType} | {item.location}
                    </Text>
                    {item.duration && (
                      <Text className="text-sm text-gray-500">
                        Duration: {item.duration}
                      </Text>
                    )}
                    {item.deadline && (
                      <Text className="text-sm text-gray-500">
                        Deadline: {item.deadline}
                      </Text>
                    )}
                    {item.apply && (
                      <View className="flex-row flex-wrap items-center">
                        <Text className="font-PoppinsSemiBold text-xs">
                          Apply:{" "}
                        </Text>
                        <TouchableOpacity
                          onPress={() => Linking.openURL(item.apply!)}
                        >
                          <Text className="text-blue-500 underline font-PoppinsRegular text-xs">
                            {item.apply}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}
                    <View className="flex-row justify-between mt-4">
                      <CustomButton
                        title={
                          savedOpportunities.has(item.id) ? "Saved" : "Save"
                        }
                        onPress={() => handleSave(item)}
                        bgVariant="primary"
                        textVariant="default"
                        className={`px-4 py-2 rounded-lg flex-1 items-center ${
                          savedOpportunities.has(item.id)
                            ? "bg-primary-900"
                            : "bg-primary"
                        }`}
                      />
                    </View>
                  </View>
                </View>
              )}
            />
          ) : (
            <Text className="text-gray-500 text-base text-center">
              No AI suggested opportunities.
            </Text>
          )}
        </View>
      </ReactNativeModal>
    </SafeAreaView>
  );
};

export default Opportunities;
