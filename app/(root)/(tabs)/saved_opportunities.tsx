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
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { SignedIn, useUser } from "@clerk/clerk-expo";
import { useFocusEffect } from "expo-router";
import { FontAwesome, MaterialCommunityIcons } from "@expo/vector-icons";
import ReactNativeModal from "react-native-modal";
import InputField from "@/components/InputField";
import CustomButton from "@/components/CustomButton";
import Purchases from "react-native-purchases";
import RevenueCatUI, { PAYWALL_RESULT } from "react-native-purchases-ui";

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
  const isDark = useColorScheme() === "dark";
  const [savedOpportunities, setSavedOpportunities] = useState<Opportunity[]>(
    [],
  );
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>("");

  const [aiReasons, setAiReasons] = useState<string>("");
  const [showAIReasonsModal, setShowAIReasonsModal] = useState(false);
  const [loadingReason, setLoadingReason] = useState(false);

  const loadSavedOpportunities = useCallback(async () => {
    if (!user?.id) return;

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
  }, [user?.id]);

  const getAIReasons = async (opportunity: Opportunity) => {
    try {
      setLoadingReason(true);

      const customerInfo = await Purchases.getCustomerInfo();
      const isPremium =
        customerInfo.entitlements.active["premium"] !== undefined;

      if (!isPremium) {
        const result = await RevenueCatUI.presentPaywallIfNeeded({
          requiredEntitlementIdentifier: "premium",
        });

        if (
          result === PAYWALL_RESULT.PURCHASED ||
          result === PAYWALL_RESULT.RESTORED
        ) {
          return await getAIReasons(opportunity);
        } else {
          return;
        }
      }

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
      if (!res.ok) {
        Alert.alert("Delete failed. Please try again.");
        return;
      }
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
    if (user?.id) {
      loadSavedOpportunities().catch(console.error);
    }
  }, [loadSavedOpportunities, user?.id]);

  useFocusEffect(
    useCallback(() => {
      loadSavedOpportunities().catch(console.error);
    }, [loadSavedOpportunities]),
  );

  const filteredSavedOpportunities = savedOpportunities.filter((opportunity) =>
    `${opportunity.title} ${opportunity.activityType} ${opportunity.location}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase()),
  );

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: isDark ? "#121212" : "#F5F7FA",
        paddingHorizontal: 16,
        paddingTop: 24,
      }}
    >
      <SignedIn>
        <Text
          style={{
            fontSize: 28,
            fontFamily: "Poppins-Bold",
            paddingBottom: 12,
            color: isDark ? "#ffffff" : "#1a1a1a",
          }}
        >
          Saved Opportunities
        </Text>

        <InputField
          label=""
          placeholder="Search Opportunities"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />

        {filteredSavedOpportunities.length === 0 ? (
          <Text
            style={{
              textAlign: "center",
              marginTop: 40,
              fontFamily: "Poppins-Regular",
              color: isDark ? "#999" : "#666",
            }}
          >
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
              <View
                style={{
                  backgroundColor: isDark ? "#1e1e1e" : "#ffffff",
                  padding: 16,
                  marginBottom: 16,
                  borderRadius: 10,
                  shadowColor: "#000",
                }}
              >
                <Text
                  style={{
                    fontFamily: "Poppins-SemiBold",
                    fontSize: 16,
                    color: isDark ? "#fff" : "#111",
                    marginBottom: 8,
                  }}
                >
                  {item.activityType}
                </Text>
                <View style={{ flexDirection: "row" }}>
                  <View style={{ width: 112 }}>
                    <Text
                      style={{
                        fontFamily: "Poppins-Regular",
                        fontSize: 12,
                        color: isDark ? "#ccc" : "#444",
                        marginBottom: 4,
                      }}
                    >
                      Location: {item.location}
                    </Text>
                    {item.duration && (
                      <Text
                        style={{
                          fontFamily: "Poppins-Regular",
                          fontSize: 12,
                          color: isDark ? "#ccc" : "#444",
                          marginBottom: 4,
                        }}
                      >
                        Duration: {item.duration}
                      </Text>
                    )}
                    {item.deadline && (
                      <Text
                        style={{
                          fontFamily: "Poppins-Regular",
                          fontSize: 12,
                          color: isDark ? "#ccc" : "#444",
                          marginBottom: 4,
                        }}
                      >
                        Deadline: {item.deadline}
                      </Text>
                    )}
                  </View>
                  <View style={{ flex: 1, marginLeft: 8 }}>
                    <Text
                      style={{
                        fontFamily: "Poppins-SemiBold",
                        fontSize: 14,
                        color: isDark ? "#fff" : "#111",
                        marginBottom: 4,
                      }}
                    >
                      {item.title}
                    </Text>
                    <Text
                      style={{
                        fontFamily: "Poppins-Regular",
                        fontSize: 12,
                        color: isDark ? "#bbb" : "#333",
                        marginBottom: 8,
                      }}
                    >
                      {item.description}
                    </Text>
                    {item.apply && (
                      <TouchableOpacity
                        onPress={() => Linking.openURL(item.apply)}
                      >
                        <Text
                          style={{
                            color: "#5b55f6",
                            textDecorationLine: "underline",
                            fontSize: 13,
                          }}
                        >
                          Apply Here
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "flex-end",
                    marginTop: 8,
                  }}
                >
                  <TouchableOpacity
                    onPress={() => getAIReasons(item)}
                    style={{ marginRight: 16 }}
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

        <ReactNativeModal
          backdropTransitionOutTiming={1}
          useNativeDriver
          useNativeDriverForBackdrop
          isVisible={showAIReasonsModal}
          onBackdropPress={() => setShowAIReasonsModal(false)}
        >
          <View
            style={{
              backgroundColor: isDark ? "#1e1e1e" : "#ffffff",
              padding: 28,
              borderRadius: 20,
            }}
          >
            <TouchableOpacity
              onPress={() => setShowAIReasonsModal(false)}
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
                color: isDark ? "#fff" : "#222",
                marginBottom: 16,
              }}
            >
              Top 3 Reasons to Join
            </Text>
            {loadingReason ? (
              <ActivityIndicator size="large" color="#5b55f6" />
            ) : (
              <Text
                style={{
                  fontSize: 16,
                  fontFamily: "Poppins-Regular",
                  color: isDark ? "#ccc" : "#333",
                  marginBottom: 24,
                }}
                selectable
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
