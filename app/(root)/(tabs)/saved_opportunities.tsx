import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
  useColorScheme,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { SignedIn, useUser, useAuth } from "@clerk/clerk-expo";
import { useFocusEffect } from "expo-router";
import { FontAwesome, MaterialCommunityIcons } from "@expo/vector-icons";
import ReactNativeModal from "react-native-modal";
import InputField from "@/components/InputField";
import CustomButton from "@/components/CustomButton";
import { confirmDestructiveAction } from "@/lib/confirmDestructiveAction";
import Purchases from "react-native-purchases";
import { PAYWALL_RESULT } from "react-native-purchases-ui";
import * as WebBrowser from "expo-web-browser";
import { presentPremiumPaywallIfNeeded } from "@/lib/premium";
import { fetchAPI } from "@/lib/fetch";

interface Opportunity {
  id: string;
  school?: string;
  title: string;
  careerField?: string;
  activityType: string;
  location: string;
  duration?: string;
  deadline?: string;
  apply?: string;
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
  pictureurl?: string;
  createdAt?: string;
  description?: string;
  prestige?: number;
}

export default function Saved_opportunities() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const isDark = useColorScheme() === "dark";
  const surfaceColor = isDark ? "#1e1e1e" : "#ffffff";
  const primaryTextColor = isDark ? "#f5f5f5" : "#111827";
  const secondaryTextColor = isDark ? "#d4d4d8" : "#374151";
  const mutedTextColor = isDark ? "#a1a1aa" : "#6b7280";
  const borderColor = isDark ? "#3f3f46" : "#e5e7eb";
  const [savedOpportunities, setSavedOpportunities] = useState<Opportunity[]>(
    [],
  );
  const [selectedOpportunity, setSelectedOpportunity] =
    useState<Opportunity | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>("");

  const [aiReasons, setAiReasons] = useState<string>("");
  const [showAIReasonsModal, setShowAIReasonsModal] = useState(false);
  const [loadingReason, setLoadingReason] = useState(false);
  const [pendingReasonsResult, setPendingReasonsResult] = useState(false);

  const resetAIReasonsState = () => {
    setShowAIReasonsModal(false);
    setAiReasons("");
    setPendingReasonsResult(false);
  };

  // Fetch saved opportunities for the current user from the backend
  const loadSavedOpportunities = useCallback(async () => {
    try {
      const token = await getToken();
      const json = await fetchAPI(
        `https://ec-ai.expo.app/getsavedopportunities`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({}),
        },
      );
      const mapped = json.data.map((op: any) => ({
        id: op.id,
        school: op.school,
        title: op.activityName,
        careerField: op.careerField,
        activityType: op.activityType,
        pictureurl: op.pictureurl,
        location: op.location,
        duration: op.duration,
        deadline: op.deadline
          ? new Date(op.deadline).toISOString().split("T")[0]
          : undefined,
        apply: op.applicationLink,
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
        description: op.description,
        prestige: op.prestige,
      }));
      setSavedOpportunities(mapped);
    } catch (error) {
      console.error("Error loading saved opportunities:", error);
      setSavedOpportunities([]);
    }
  }, [getToken]);

  // Fetch AI-generated personalized reasons for a specific opportunity
  const getAIReasons = async (opportunity: Opportunity) => {
    if (loadingReason) return;

    try {
      resetAIReasonsState();

      const customerInfo = await Purchases.getCustomerInfo();
      const isPremium =
        customerInfo.entitlements.active["premium"] !== undefined;

      if (!isPremium) {
        const result = await presentPremiumPaywallIfNeeded();

        if (
          result === PAYWALL_RESULT.PURCHASED ||
          result === PAYWALL_RESULT.RESTORED
        ) {
          // Continue below with the upgraded entitlement.
        } else {
          return;
        }
      }

      setLoadingReason(true);

      const token = await getToken();
      const result = await fetchAPI("https://ec-ai.expo.app/getaireasons", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ activity_id: opportunity.id }),
      });

      if (!result?.reasons) {
        Alert.alert("Error", "No AI reasons were returned.");
        return;
      }

      setAiReasons(result.reasons);
      setPendingReasonsResult(true);
    } catch (error) {
      console.log("Error fetching AI reasons:", error);
      Alert.alert("Error", "Failed to get AI-generated reasons.");
    } finally {
      setLoadingReason(false);
    }
  };

  // Delete a saved opportunity by ID and update UI
  const deleteOpportunity = async (id: string) => {
    try {
      const token = await getToken();
      await fetchAPI("https://ec-ai.expo.app/deletesavedopportunity", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ opportunity_id: id }),
      });
      setSavedOpportunities((prev) => prev.filter((opp) => opp.id !== id));
    } catch (error) {
      console.error("Error deleting opportunity:", error);
      Alert.alert("Delete failed. Please try again.");
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSavedOpportunities();
    setRefreshing(false);
  };

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
      edges={["top", "left", "right"]}
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
            contentContainerStyle={{ paddingBottom: 24 }}
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() => setSelectedOpportunity(item)}>
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
                          onPress={async () => {
                            if (item.apply) {
                              await WebBrowser.openBrowserAsync(item.apply);
                            }
                          }}
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
                      hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                      onPress={() => getAIReasons(item)}
                      disabled={loadingReason}
                      style={{ marginRight: 16 }}
                    >
                      <MaterialCommunityIcons
                        name="robot"
                        size={24}
                        color={loadingReason ? "#A9A5D9" : "#5b55f6"}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                      onPress={() =>
                        confirmDestructiveAction({
                          title: "Delete Saved Opportunity",
                          message: `Delete "${item.title}" from your saved opportunities?`,
                          onConfirm: () => deleteOpportunity(item.id),
                        })
                      }
                    >
                      <FontAwesome name="trash" size={22} color="#f56565" />
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            )}
          />
        )}

        <ReactNativeModal
          backdropTransitionOutTiming={1}
          useNativeDriver
          useNativeDriverForBackdrop
          isVisible={showAIReasonsModal}
          onBackdropPress={resetAIReasonsState}
          onBackButtonPress={resetAIReasonsState}
          style={{ marginTop: 60, marginHorizontal: 10 }}
        >
          <View
            style={{
              backgroundColor: surfaceColor,
              borderRadius: 16,
              maxHeight: "82%",
              paddingBottom: 8,
            }}
          >
            <View style={{ padding: 24, paddingBottom: 16 }}>
              <TouchableOpacity
                onPress={resetAIReasonsState}
                style={{ position: "absolute", top: 20, right: 20, zIndex: 1 }}
              >
                <MaterialCommunityIcons
                  name="close"
                  size={24}
                  color={primaryTextColor}
                />
              </TouchableOpacity>
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
                  AI Powered
                </Text>
              </View>
              <Text
                style={{
                  fontSize: 20,
                  fontFamily: "Poppins-Bold",
                  color: primaryTextColor,
                  paddingRight: 32,
                }}
              >
                Top 3 Reasons to Join
              </Text>
            </View>

            <View
              style={{
                height: 1,
                backgroundColor: borderColor,
                marginHorizontal: 24,
              }}
            />

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ padding: 24 }}
            >
              <Text
                style={{
                  fontSize: 15,
                  fontFamily: "Poppins-Regular",
                  color: secondaryTextColor,
                  lineHeight: 24,
                  marginBottom: 20,
                }}
                selectable
              >
                {aiReasons}
              </Text>
              <CustomButton title="Close" onPress={resetAIReasonsState} />
            </ScrollView>
          </View>
        </ReactNativeModal>

        <ReactNativeModal
          isVisible={selectedOpportunity !== null}
          backdropTransitionOutTiming={1}
          useNativeDriver={true}
          useNativeDriverForBackdrop={true}
          onBackdropPress={() => setSelectedOpportunity(null)}
          onBackButtonPress={() => setSelectedOpportunity(null)}
          propagateSwipe={true}
          style={{ marginTop: 60, marginHorizontal: 10 }}
        >
          <View
            style={{
              backgroundColor: surfaceColor,
              borderRadius: 16,
              maxHeight: "82%",
              paddingBottom: 8,
            }}
          >
            {/* Header */}
            <View style={{ padding: 24, paddingBottom: 16 }}>
              <TouchableOpacity
                onPress={() => setSelectedOpportunity(null)}
                style={{ position: "absolute", top: 20, right: 20, zIndex: 1 }}
              >
                <MaterialCommunityIcons
                  name="close"
                  size={24}
                  color={primaryTextColor}
                />
              </TouchableOpacity>

              {selectedOpportunity?.activityType && (
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
                    {selectedOpportunity.activityType}
                  </Text>
                </View>
              )}

              <Text
                style={{
                  fontSize: 20,
                  fontFamily: "Poppins-Bold",
                  color: primaryTextColor,
                  paddingRight: 32,
                  marginBottom: 12,
                }}
              >
                {selectedOpportunity?.title}
              </Text>

              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {selectedOpportunity?.location && (
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      backgroundColor: isDark ? "#27272a" : "#f3f4f6",
                      borderRadius: 6,
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                    }}
                  >
                    <MaterialCommunityIcons
                      name="map-marker-outline"
                      size={13}
                      color="#5b55f6"
                    />
                    <Text
                      style={{
                        fontFamily: "Poppins-Regular",
                        fontSize: 12,
                        color: secondaryTextColor,
                        marginLeft: 4,
                      }}
                    >
                      {selectedOpportunity.location}
                    </Text>
                  </View>
                )}
                {selectedOpportunity?.deadline && (
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      backgroundColor: isDark ? "#27272a" : "#f3f4f6",
                      borderRadius: 6,
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                    }}
                  >
                    <MaterialCommunityIcons
                      name="calendar-outline"
                      size={13}
                      color="#5b55f6"
                    />
                    <Text
                      style={{
                        fontFamily: "Poppins-Regular",
                        fontSize: 12,
                        color: secondaryTextColor,
                        marginLeft: 4,
                      }}
                    >
                      Due {selectedOpportunity.deadline}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            <View
              style={{
                height: 1,
                backgroundColor: borderColor,
                marginHorizontal: 24,
              }}
            />

            <ScrollView
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled={true}
              contentContainerStyle={{ padding: 24 }}
            >
              {/* Overview rows */}
              {[
                {
                  icon: "domain" as const,
                  label: "School",
                  value: selectedOpportunity?.school,
                },
                {
                  icon: "briefcase-variant-outline" as const,
                  label: "Career Field",
                  value: selectedOpportunity?.careerField,
                },
                {
                  icon: "timer-sand" as const,
                  label: "Duration",
                  value: selectedOpportunity?.duration,
                },
                {
                  icon: "clock-outline" as const,
                  label: "Hours / Week",
                  value:
                    selectedOpportunity?.hoursPerWeek !== undefined
                      ? `${selectedOpportunity.hoursPerWeek} hr/wk`
                      : undefined,
                },
                {
                  icon: "city-variant-outline" as const,
                  label: "Primary City",
                  value: selectedOpportunity?.primaryCity,
                },
                {
                  icon: "chart-bar" as const,
                  label: "Selectivity",
                  value: selectedOpportunity?.selectivityLevel,
                },
              ]
                .filter((row) => row.value !== undefined)
                .map((row, idx) => (
                  <View
                    key={idx}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      paddingVertical: 10,
                      borderBottomWidth: 1,
                      borderBottomColor: borderColor,
                    }}
                  >
                    <MaterialCommunityIcons
                      name={row.icon}
                      size={15}
                      color="#5b55f6"
                    />
                    <Text
                      style={{
                        fontFamily: "Poppins-SemiBold",
                        fontSize: 13,
                        color: mutedTextColor,
                        marginLeft: 8,
                        width: 96,
                      }}
                    >
                      {row.label}
                    </Text>
                    <Text
                      style={{
                        fontFamily: "Poppins-Regular",
                        fontSize: 13,
                        color: secondaryTextColor,
                        flex: 1,
                      }}
                    >
                      {String(row.value)}
                    </Text>
                  </View>
                ))}

              {/* Prestige */}
              {selectedOpportunity?.prestige !== undefined && (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingVertical: 10,
                    borderBottomWidth: 1,
                    borderBottomColor: borderColor,
                  }}
                >
                  <MaterialCommunityIcons
                    name="star-outline"
                    size={15}
                    color="#5b55f6"
                  />
                  <Text
                    style={{
                      fontFamily: "Poppins-SemiBold",
                      fontSize: 13,
                      color: mutedTextColor,
                      marginLeft: 8,
                      width: 96,
                    }}
                  >
                    Prestige
                  </Text>
                  <View style={{ flexDirection: "row" }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <FontAwesome
                        key={star}
                        name={
                          (selectedOpportunity.prestige ?? 0) >= star
                            ? "star"
                            : "star-o"
                        }
                        size={14}
                        color={
                          (selectedOpportunity.prestige ?? 0) >= star
                            ? "#f59e0b"
                            : isDark
                              ? "#3f3f46"
                              : "#d1d5db"
                        }
                        style={{ marginRight: 2 }}
                      />
                    ))}
                  </View>
                </View>
              )}

              {/* Requirements */}
              {(selectedOpportunity?.gradeRequirements ||
                selectedOpportunity?.raceRequirements ||
                selectedOpportunity?.genderRequirements ||
                selectedOpportunity?.ageRequirements ||
                selectedOpportunity?.minGPA ||
                selectedOpportunity?.minSAT ||
                selectedOpportunity?.minACT ||
                selectedOpportunity?.minPSAT) && (
                <>
                  <Text
                    style={{
                      fontFamily: "Poppins-Bold",
                      fontSize: 11,
                      color: "#5b55f6",
                      letterSpacing: 1,
                      textTransform: "uppercase",
                      marginTop: 20,
                      marginBottom: 2,
                    }}
                  >
                    Requirements
                  </Text>
                  {[
                    {
                      icon: "layers-outline" as const,
                      label: "Grade",
                      value: selectedOpportunity?.gradeRequirements,
                    },
                    {
                      icon: "account-group-outline" as const,
                      label: "Race / Ethnicity",
                      value: selectedOpportunity?.raceRequirements,
                    },
                    {
                      icon: "account-outline" as const,
                      label: "Gender",
                      value: selectedOpportunity?.genderRequirements,
                    },
                    {
                      icon: "cake-variant-outline" as const,
                      label: "Age",
                      value: selectedOpportunity?.ageRequirements,
                    },
                    {
                      icon: "school-outline" as const,
                      label: "Min GPA",
                      value: selectedOpportunity?.minGPA
                        ? String(selectedOpportunity.minGPA)
                        : undefined,
                    },
                    {
                      icon: "pencil-box-outline" as const,
                      label: "Min SAT",
                      value: selectedOpportunity?.minSAT
                        ? String(selectedOpportunity.minSAT)
                        : undefined,
                    },
                    {
                      icon: "pencil-box-outline" as const,
                      label: "Min ACT",
                      value: selectedOpportunity?.minACT
                        ? String(selectedOpportunity.minACT)
                        : undefined,
                    },
                    {
                      icon: "pencil-box-outline" as const,
                      label: "Min PSAT",
                      value: selectedOpportunity?.minPSAT
                        ? String(selectedOpportunity.minPSAT)
                        : undefined,
                    },
                  ]
                    .filter((row) => row.value !== undefined)
                    .map((row, idx) => (
                      <View
                        key={idx}
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          paddingVertical: 10,
                          borderBottomWidth: 1,
                          borderBottomColor: borderColor,
                        }}
                      >
                        <MaterialCommunityIcons
                          name={row.icon}
                          size={15}
                          color="#5b55f6"
                        />
                        <Text
                          style={{
                            fontFamily: "Poppins-SemiBold",
                            fontSize: 13,
                            color: mutedTextColor,
                            marginLeft: 8,
                            width: 96,
                          }}
                        >
                          {row.label}
                        </Text>
                        <Text
                          style={{
                            fontFamily: "Poppins-Regular",
                            fontSize: 13,
                            color: secondaryTextColor,
                            flex: 1,
                          }}
                        >
                          {String(row.value)}
                        </Text>
                      </View>
                    ))}
                </>
              )}

              {/* Eligibility */}
              <Text
                style={{
                  fontFamily: "Poppins-Bold",
                  fontSize: 11,
                  color: "#5b55f6",
                  letterSpacing: 1,
                  textTransform: "uppercase",
                  marginTop: 20,
                  marginBottom: 10,
                }}
              >
                Eligibility
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  gap: 8,
                  marginBottom: 20,
                }}
              >
                {[
                  {
                    label: "FRL Students",
                    value: selectedOpportunity?.onlyFRLStudents,
                  },
                  {
                    label: "First Generation",
                    value: selectedOpportunity?.onlyFirstGen,
                  },
                  {
                    label: "Leadership Roles",
                    value: selectedOpportunity?.hasLeadershipRoles,
                  },
                  {
                    label: "Outside US",
                    value: selectedOpportunity?.outsideUS,
                  },
                ].map(({ label, value }, idx) => (
                  <View
                    key={idx}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      backgroundColor: value
                        ? isDark
                          ? "rgba(34,197,94,0.14)"
                          : "rgba(34,197,94,0.09)"
                        : isDark
                          ? "#27272a"
                          : "#f3f4f6",
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                      borderRadius: 6,
                      borderWidth: 1,
                      borderColor: value
                        ? "rgba(34,197,94,0.3)"
                        : "transparent",
                    }}
                  >
                    <View
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: value
                          ? "#22c55e"
                          : isDark
                            ? "#52525b"
                            : "#d1d5db",
                        marginRight: 6,
                      }}
                    />
                    <Text
                      style={{
                        fontFamily: "Poppins-SemiBold",
                        fontSize: 12,
                        color: value ? "#22c55e" : mutedTextColor,
                      }}
                    >
                      {label}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Apply */}
              {selectedOpportunity?.apply && (
                <TouchableOpacity
                  onPress={async () => {
                    if (selectedOpportunity?.apply) {
                      await WebBrowser.openBrowserAsync(
                        selectedOpportunity.apply,
                      );
                    }
                  }}
                  activeOpacity={0.82}
                  style={{
                    backgroundColor: "#5b55f6",
                    borderRadius: 12,
                    paddingVertical: 14,
                    alignItems: "center",
                    flexDirection: "row",
                    justifyContent: "center",
                  }}
                >
                  <Text
                    style={{
                      fontFamily: "Poppins-SemiBold",
                      fontSize: 15,
                      color: "#fff",
                    }}
                  >
                    Apply Now
                  </Text>
                  <MaterialCommunityIcons
                    name="arrow-right"
                    size={18}
                    color="#fff"
                    style={{ marginLeft: 8 }}
                  />
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>
        </ReactNativeModal>
        {/* AI Loading Overlay */}
        <ReactNativeModal
          isVisible={loadingReason}
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
            if (pendingReasonsResult) {
              setPendingReasonsResult(false);
              setShowAIReasonsModal(true);
            }
          }}
        >
          <View
            style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
          >
            <View
              style={{
                backgroundColor: isDark ? "#1e1e1e" : "#ffffff",
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
                  color: isDark ? "#fff" : "#1f2937",
                  marginTop: 16,
                }}
              >
                Generating AI Summary
              </Text>
              <Text
                style={{
                  fontFamily: "Poppins-Regular",
                  fontSize: 13,
                  color: isDark ? "#aaa" : "#6b7280",
                  marginTop: 6,
                }}
              >
                This may take a moment...
              </Text>
            </View>
          </View>
        </ReactNativeModal>
      </SignedIn>
    </SafeAreaView>
  );
}
