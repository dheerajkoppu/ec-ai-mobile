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
  top_3_reasons?: string[]; // NEW: extra field from AI
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
  const [selectedOpportunity, setSelectedOpportunity] =
    useState<Opportunity | null>(null);

  // New state: store AI-suggested enriched opportunities
  const [showAISuggestedModal, setShowAISuggestedModal] =
    useState<boolean>(false);
  const [aiOpportunities, setAiOpportunities] = useState<Opportunity[]>([]);
  const [aiLoading, setAiLoading] = useState<boolean>(false);

  // Fetch opportunities from the API and map fields accordingly
  const fetchOpportunities = async () => {
    if (!user) return;
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

  // Save opportunity as before
  const handleSave = async (opportunity: Opportunity) => {
    try {
      if (!user) {
        console.error("User not logged in");
        return;
      }
      const clerk_id = user.id;
      if (savedOpportunities.has(opportunity.id)) return;
      setSavedOpportunities((prev) => new Set([...prev, opportunity.id]));
      const res = await fetch("/(api)/addsavedopportunity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clerk_id, opportunity_id: opportunity.id }),
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

  const sortOpportunities = () => {
    const sortedOpportunities = [...opportunities].sort((a, b) => {
      if (!a.deadline && !b.deadline) return 0;
      if (!a.deadline) return 1;
      if (!b.deadline) return -1;
      return a.deadline.localeCompare(b.deadline);
    });
    setOpportunities(sortedOpportunities);
    setShowSortDropdown(false);
  };

  // Updated: Fetch AI suggestions from API route,
  // which returns { enrichedActivities } where each activity includes a top_3_reasons property.
  const fetchAISuggestions = async () => {
    if (!user) return;
    try {
      setAiLoading(true);
      const response = await fetch("/(api)/getaisuggested", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user?.primaryEmailAddress?.emailAddress,
        }),
      });
      if (!response.ok) {
        throw new Error("Failed to fetch AI suggestions");
      }
      const json = await response.json();
      if (json.enrichedActivities) {
        setAiOpportunities(json.enrichedActivities);
      } else {
        setAiOpportunities([]);
      }
    } catch (error) {
      console.error("Error fetching AI suggestions:", error);
      setAiOpportunities([]);
    } finally {
      setAiLoading(false);
    }
  };

  // Handler for AI Suggested button click
  const handleAISuggestions = async () => {
    await fetchAISuggestions();
    setShowAISuggestedModal(true);
  };

  // Render a card for a single opportunity (same as normal, with extra reasons if available)
  const renderOpportunityCard = (item: Opportunity) => (
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
        {item.top_3_reasons && item.top_3_reasons.length > 0 && (
          <View className="mt-2">
            <Text className="font-PoppinsSemiBold text-xs">Top Reasons:</Text>
            {item.top_3_reasons.map((reason, index) => (
              <Text key={index} className="font-PoppinsRegular text-xs">
                - {reason}
              </Text>
            ))}
          </View>
        )}
        <View className="flex-row justify-between mt-4">
          <CustomButton
            title={savedOpportunities.has(item.id) ? "Saved" : "Save"}
            onPress={() => handleSave(item)}
            bgVariant="primary"
            textVariant="default"
            className={`px-4 py-2 rounded-lg flex-1 items-center ${
              savedOpportunities.has(item.id) ? "bg-primary-900" : "bg-primary"
            }`}
          />
        </View>
      </View>
    </TouchableOpacity>
  );

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
        <TouchableOpacity onPress={handleAISuggestions}>
          <Text className="text-general-400 font-PoppinsBold">
            AI Suggested ✨
          </Text>
        </TouchableOpacity>
      </View>

      {/* Inline Sort Dropdown */}
      {showSortDropdown && (
        <>
          <TouchableOpacity
            onPress={() => setShowSortDropdown(false)}
            activeOpacity={1}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 10,
            }}
          />
          <View className="absolute bg-white p-2 rounded-lg shadow-lg px-5 mt-60 py-3 z-20">
            <TouchableOpacity onPress={sortOpportunities}>
              <Text className="text-general-400 font-PoppinsSemiBold">
                Deadline
              </Text>
            </TouchableOpacity>
          </View>
        </>
      )}

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
        renderItem={({ item }) => renderOpportunityCard(item)}
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
                <Text className="font-semibold">Added On:</Text>{" "}
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
          {aiLoading ? (
            <ActivityIndicator size="large" color="#5b55f6" />
          ) : aiOpportunities && aiOpportunities.length > 0 ? (
            <FlatList
              data={aiOpportunities}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => renderOpportunityCard(item)}
            />
          ) : (
            <Text className="text-gray-500 text-base text-center">
              No AI suggestions available.
            </Text>
          )}
        </View>
      </ReactNativeModal>
    </SafeAreaView>
  );
};

export default Opportunities;
