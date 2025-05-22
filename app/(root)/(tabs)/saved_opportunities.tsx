import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  Linking,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { SignedIn, useUser } from "@clerk/clerk-expo";
import { useFocusEffect } from "expo-router";
import { FontAwesome, MaterialCommunityIcons } from "@expo/vector-icons";
import ReactNativeModal from "react-native-modal";
import InputField from "@/components/InputField";
import CustomButton from "@/components/CustomButton";

interface Opportunity {
  id: string;
  title: string;
  activityType: string;
  location: string;
  duration?: string;
  deadline?: string;
  apply: string;
  description?: string;
}

export default function Saved_opportunities() {
  const { user } = useUser();
  const [savedOpportunities, setSavedOpportunities] = useState<Opportunity[]>(
    [],
  );
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>("");

  const [aiReasons, setAiReasons] = useState<string>("");
  const [showAIReasonsModal, setShowAIReasonsModal] = useState(false);
  const [loadingReason, setLoadingReason] = useState(false);

  const loadSavedOpportunities = async () => {
    if (!user) return;
    try {
      const res = await fetch(`https://ec-ai.expo.app/getsavedopportunities`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clerk_id: user.id }),
      });
      const json = await res.json();
      if (res.ok) {
        const mapped = json.data.map((item: any) => ({
          id: item.id,
          title: item.activityName || "No Title",
          activityType: item.activityType,
          location: item.location,
          duration: item.duration,
          deadline: item.deadline
            ? new Date(item.deadline).toISOString().split("T")[0]
            : undefined,
          apply: item.applicationLink,
          description: item.description,
        }));
        setSavedOpportunities(mapped);
      } else {
        console.error("Error fetching saved opportunities:", json.error);
        setSavedOpportunities([]);
      }
    } catch (error) {
      console.error("Error loading saved opportunities:", error);
      setSavedOpportunities([]);
    }
  };

  const getAIReasons = async (opportunity: Opportunity) => {
    try {
      setLoadingReason(true);
      const response = await fetch("https://ec-ai.expo.app/getaireasons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activity_id: opportunity.id }),
      });
      const result = await response.json();
      setAiReasons(result.reasons || "No reasons available.");
      setShowAIReasonsModal(true);
    } catch (error) {
      console.error("Error fetching AI reasons:", error);
      Alert.alert("Error", "Failed to get AI-generated reasons.");
    } finally {
      setLoadingReason(false);
    }
  };

  const deleteOpportunity = async (id: string) => {
    if (!user) return;
    try {
      const res = await fetch("https://ec-ai.expo.app/deletesavedopportunity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clerk_id: user.id, opportunity_id: id }),
      });
      if (!res.ok) throw new Error("Delete failed");
      setSavedOpportunities((prev) => prev.filter((opp) => opp.id !== id));
    } catch (error) {
      console.error("Error deleting opportunity:", error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSavedOpportunities();
    setRefreshing(false);
  };

  useEffect(() => {
    if (user?.id) loadSavedOpportunities();
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadSavedOpportunities();
    }, [user]),
  );

  const filteredSavedOpportunities = savedOpportunities.filter((opportunity) =>
    `${opportunity.title} ${opportunity.activityType} ${opportunity.location}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase()),
  );

  return (
    <SafeAreaView className="flex-1 bg-primary-200 px-4 py-6">
      <SignedIn>
        <Text className="text-3xl font-bold text-gray-800 font-PoppinsBold pb-2">
          Saved Opportunities
        </Text>

        <InputField
          label=""
          placeholder="Search Opportunities"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />

        {filteredSavedOpportunities.length === 0 ? (
          <Text className="text-center text-gray-500 font-PoppinsRegular mt-10">
            No saved opportunities found.
          </Text>
        ) : (
          <FlatList
            data={filteredSavedOpportunities}
            keyExtractor={(item) => item.id}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            contentContainerStyle={{ paddingBottom: 120 }}
            renderItem={({ item }) => (
              <View className="bg-white p-4 mb-4 rounded-lg shadow">
                <Text className="font-bold font-PoppinsSemiBold text-base mb-2">
                  {item.activityType}
                </Text>
                <View className="flex-row">
                  <View className="w-28">
                    <Text className="font-PoppinsRegular text-xs mb-1">
                      Location: {item.location}
                    </Text>
                    {item.duration && (
                      <Text className="font-PoppinsRegular text-xs mb-1">
                        Duration: {item.duration}
                      </Text>
                    )}
                    {item.deadline && (
                      <Text className="font-PoppinsRegular text-xs mb-1">
                        Deadline: {item.deadline}
                      </Text>
                    )}
                  </View>
                  <View className="flex-1 ml-2">
                    <Text className="font-PoppinsSemiBold mb-1 text-sm">
                      {item.title}
                    </Text>
                    <Text className="font-PoppinsRegular text-xs text-gray-800 mb-2">
                      {item.description}
                    </Text>
                    {item.apply && (
                      <TouchableOpacity
                        onPress={() => Linking.openURL(item.apply)}
                      >
                        <Text className="text-blue-500 underline text-xs">
                          Apply Here
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
                <View className="flex-row justify-end mt-2">
                  <TouchableOpacity
                    className="mr-4"
                    onPress={() => getAIReasons(item)}
                  >
                    <MaterialCommunityIcons
                      name="robot"
                      size={24}
                      color="#5b55f6"
                    />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => deleteOpportunity(item.id)}>
                    <FontAwesome name="trash" size={22} color="#f56565" />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />
        )}

        {/* AI Reasons Modal */}
        <ReactNativeModal
          isVisible={showAIReasonsModal}
          onBackdropPress={() => setShowAIReasonsModal(false)}
        >
          <View className="bg-white px-7 py-9 rounded-2xl shadow-md">
            <TouchableOpacity
              onPress={() => setShowAIReasonsModal(false)}
              style={{ position: "absolute", top: 20, right: 20, zIndex: 1 }}
            >
              <MaterialCommunityIcons name="close" size={24} color="#000" />
            </TouchableOpacity>
            <Text className="text-2xl font-PoppinsSemiBold text-gray-800 mb-4">
              Top 3 Reasons to Join
            </Text>
            {loadingReason ? (
              <ActivityIndicator size="large" color="#5b55f6" />
            ) : (
              <Text
                className="text-base font-PoppinsRegular text-gray-700 mb-6"
                selectable={true}
              >
                {aiReasons}
              </Text>
            )}
            <CustomButton
              title="Close"
              onPress={() => setShowAIReasonsModal(false)}
            />
          </View>
        </ReactNativeModal>
      </SignedIn>
    </SafeAreaView>
  );
}
