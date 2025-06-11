import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  ScrollView,
  Dimensions,
  ImageBackground,
} from "react-native";
import { Alert } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useColorScheme } from "react-native";

import Swiper from "react-native-deck-swiper";
import { useUser } from "@clerk/clerk-expo";
import ReactNativeModal from "react-native-modal";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import RevenueCatUI, { PAYWALL_RESULT } from "react-native-purchases-ui";
import Purchases from "react-native-purchases";
import * as WebBrowser from "expo-web-browser";
import AsyncStorage from "@react-native-async-storage/async-storage";

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

const { width } = Dimensions.get("window");
const CARD_WIDTH = width - 40;
const CARD_HEIGHT = 520;

const renderStars = (rating?: number) => {
  if (rating === undefined || rating === null) return "N/A";
  const fullStars = Math.round(rating);
  return "★".repeat(fullStars) + "☆".repeat(5 - fullStars);
};

const Opportunities = () => {
  const [swipeCount, setSwipeCount] = useState(0);
  const [lastSwipeDate, setLastSwipeDate] = useState<string>("");
  const { user } = useUser();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOpportunity, setSelectedOpportunity] =
    useState<Opportunity | null>(null);
  const [cardIndex, setCardIndex] = useState(0);
  const [canSwipe, setCanSwipe] = useState(true);

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    if (lastSwipeDate !== today) {
      setSwipeCount(0);
      setLastSwipeDate(today);
    }
  }, [lastSwipeDate]);

  const onSwiped = async (i: number, liked: boolean) => {
    setCardIndex(i + 1);
    await AsyncStorage.setItem("lastCardIndex", String(i + 1));
    await handleSwipe(i, liked);
  };
  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem("lastCardIndex");
      if (saved !== null) setCardIndex(Number(saved));
    })();
  }, []);

  const checkPremiumAndUnlock = async () => {
    try {
      const info = await Purchases.getCustomerInfo();
      const isPremium = info.entitlements.active["premium"] !== undefined;
      if (isPremium) {
        setCanSwipe(true);
      }
    } catch (error) {
      console.error("Failed to check premium status:", error);
    }
  };

  useEffect(() => {
    (async () => await checkPremiumAndUnlock())();
  }, []);

  useFocusEffect(
    useCallback(() => {
      (async () => await checkPremiumAndUnlock())();
    }, []),
  );

  const fetchOpportunities = useCallback(async () => {
    if (!user) return;
    try {
      const response = await fetch(
        "https://ec-ai.expo.app/getrecommendations",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ clerk_id: user.id }),
        },
      );

      const json = await response.json();
      const formatted: Opportunity[] = json.data.map((op: any) => ({
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
      setOpportunities(formatted);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Error fetching opportunities");
    } finally {
      setLoading(false);
    }
  }, [user]);
  useEffect(() => {
    if (!user) return;

    (async () => {
      await fetchOpportunities();
    })();
  }, [user, fetchOpportunities]);

  const handleSwipe = async (i: number, liked: boolean) => {
    if (!canSwipe) return;

    const today = new Date().toISOString().split("T")[0];
    const opportunity = opportunities[i];

    try {
      const customerInfo = await Purchases.getCustomerInfo();
      const isPremium =
        customerInfo.entitlements.active["premium"] !== undefined;

      if (lastSwipeDate !== today) {
        setSwipeCount(1);
        setLastSwipeDate(today);
        await fetchOpportunities();
      } else if (swipeCount < 5 || isPremium) {
        const updated = swipeCount + 1;
        setSwipeCount(updated);
        if (updated % 5 === 0) await fetchOpportunities();
      } else {
        Alert.alert(
          "Swipe Limit Reached",
          "You’ve used all 5 free swipes today. Upgrade to premium for unlimited access.",
          [
            {
              text: "OK",
              onPress: async () => {
                const result = await RevenueCatUI.presentPaywallIfNeeded({
                  requiredEntitlementIdentifier: "premium",
                });

                if (
                  result !== PAYWALL_RESULT.PURCHASED &&
                  result !== PAYWALL_RESULT.RESTORED
                ) {
                  setCanSwipe(false);
                } else {
                  const updated = swipeCount + 1;
                  setSwipeCount(updated);
                  if (updated % 5 === 0) await fetchOpportunities();
                }
              },
            },
          ],
        );

        const updated = swipeCount + 1;
        setSwipeCount(updated);
        if (updated % 5 === 0) await fetchOpportunities();
      }

      if (liked) await handleSave(opportunity);
      await logSwipe(opportunity.id, liked);
    } catch (err) {
      console.error("Error during swipe handling:", err);
    }
  };

  const logSwipe = async (opportunityId: string, liked: boolean) => {
    if (!user?.id) return;
    try {
      await fetch("https://ec-ai.expo.app/logswipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userClerkId: user.id,
          opportunityId,
          liked,
        }),
      });
    } catch (err) {
      console.error("Swipe log failed:", err);
    }
  };

  const handleSave = async (op: Opportunity) => {
    if (!user) return;
    try {
      const res = await fetch("https://ec-ai.expo.app/getsavedopportunities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clerk_id: user.id }),
      });
      const json = await res.json();
      const savedIds = new Set(json?.data?.map((item: any) => item.id));
      if (savedIds.has(op.id)) return;

      const customerInfo = await Purchases.getCustomerInfo();
      const isPremium =
        customerInfo.entitlements.active["premium"] !== undefined;

      if (savedIds.size >= 3 && !isPremium) {
        const result = await RevenueCatUI.presentPaywallIfNeeded({
          requiredEntitlementIdentifier: "premium",
        });
        if (
          result !== PAYWALL_RESULT.PURCHASED &&
          result !== PAYWALL_RESULT.RESTORED
        )
          return;
      }

      await fetch("https://ec-ai.expo.app/addsavedopportunity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clerk_id: user.id, opportunity_id: op.id }),
      });
    } catch (err) {
      console.error("Error saving opportunity or presenting paywall:", err);
    }
  };

  if (loading) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: isDark ? "#121212" : "#F5F7FA" }}
      >
        <ActivityIndicator size="large" color="#5b55f6" />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: isDark ? "#121212" : "#F5F7FA" }}
      >
        <Text style={{ color: "red", textAlign: "center", marginTop: 20 }}>
          {error}
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={{
        flex: 1,
        paddingHorizontal: 16,
        paddingVertical: 24,
        backgroundColor: isDark ? "#121212" : "#F5F7FA",
      }}
    >
      <View style={{ alignItems: "center", marginVertical: 16 }}>
        <Text
          allowFontScaling={false}
          style={{
            fontSize: 24,
            fontWeight: "bold",
            color: isDark ? "#fff" : "#1f2937", // dark gray or white
            textAlign: "center",
            fontFamily: "Poppins-Bold",
            paddingBottom: 8,
          }}
        >
          Opportunity Match
        </Text>
        <Text
          allowFontScaling={false}
          style={{
            color: isDark ? "#ccc" : "#6b7280", // tailwind gray-500
            fontFamily: "Poppins-Regular",
            textAlign: "center",
            fontSize: 14,
          }}
        >
          Swipe RIGHT to save an opportunity, left to skip.{" "}
        </Text>
      </View>

      <Swiper
        cards={opportunities}
        cardIndex={cardIndex} // ← new
        onSwipedRight={(i) => onSwiped(i, true)} // ← new
        onSwipedLeft={(i) => onSwiped(i, false)}
        infinite
        disableTopSwipe
        disableBottomSwipe
        disableLeftSwipe={!canSwipe}
        disableRightSwipe={!canSwipe}
        stackSize={3}
        verticalSwipe={false}
        cardVerticalMargin={20}
        backgroundColor="transparent"
        containerStyle={{ flex: 1, marginTop: 150 }}
        renderCard={(item: Opportunity) => (
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => setSelectedOpportunity(item)}
          >
            <ImageBackground
              source={{ uri: item.pictureurl }}
              style={{
                width: CARD_WIDTH,
                height: CARD_HEIGHT,
                backgroundColor: "#FFF",
                borderRadius: 12,
                padding: 16,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
                elevation: 4,
                alignSelf: "center",
              }}
              imageStyle={{ borderRadius: 12 }}
            >
              <View
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  padding: 16,
                  backgroundColor: "rgba(0, 0, 0, 0.5)",
                  borderBottomLeftRadius: 12,
                  borderBottomRightRadius: 12,
                }}
              >
                <Text className="text-white text-xl font-PoppinsBold mb-0.5">
                  {item.title}
                </Text>
                <Text className="text-white text-md font-PoppinsRegular mb-1">
                  <Text className="text-white text-md font-PoppinsSemiBold">
                    Prestige:{" "}
                  </Text>
                  {renderStars(item.prestige)}
                </Text>

                <Text className="text-white text-md font-PoppinsRegular">
                  <Text className=" text-white text-md font-PoppinsSemiBold">
                    Activity Type:{" "}
                  </Text>
                  {item.activityType}
                </Text>

                {item.description && (
                  <Text className="text-white text-md font-PoppinsRegular">
                    <Text className=" text-white text-md font-PoppinsSemiBold">
                      Description:{" "}
                    </Text>
                    {item.description}
                  </Text>
                )}
              </View>
            </ImageBackground>
          </TouchableOpacity>
        )}
      />

      <ReactNativeModal
        isVisible={selectedOpportunity !== null}
        backdropTransitionOutTiming={1}
        useNativeDriver={true}
        useNativeDriverForBackdrop={true}
        onBackdropPress={() => setSelectedOpportunity(null)}
        style={{ marginTop: 60, marginHorizontal: 10 }}
      >
        <View
          style={{
            backgroundColor: isDark ? "#1e1e1e" : "#FFF",
            borderRadius: 12,
            padding: 16,
            maxHeight: "80%",
          }}
        >
          <TouchableOpacity
            onPress={() => setSelectedOpportunity(null)}
            style={{ position: "absolute", top: 16, right: 16, zIndex: 1 }}
          >
            <MaterialCommunityIcons
              name="close"
              size={24}
              color={isDark ? "#fff" : "#000"}
            />
          </TouchableOpacity>

          <Text
            style={{
              fontSize: 22,
              fontWeight: "700",
              color: isDark ? "#fff" : "#000",
              marginBottom: 12,
            }}
          >
            {selectedOpportunity?.title}
          </Text>

          <ScrollView>
            {[
              ["School", selectedOpportunity?.school],
              ["Career Field", selectedOpportunity?.careerField],
              ["Activity Type", selectedOpportunity?.activityType],
              ["Location", selectedOpportunity?.location],
              ["Duration", selectedOpportunity?.duration],
              ["Deadline", selectedOpportunity?.deadline],
              ["Grade Requirements", selectedOpportunity?.gradeRequirements],
              ["Race Requirements", selectedOpportunity?.raceRequirements],
              ["Gender Requirements", selectedOpportunity?.genderRequirements],
              ["Age Requirements", selectedOpportunity?.ageRequirements],
              ["Primary City", selectedOpportunity?.primaryCity],
              ["Min GPA", selectedOpportunity?.minGPA],
              ["Min SAT", selectedOpportunity?.minSAT],
              ["Min ACT", selectedOpportunity?.minACT],
              ["Min PSAT", selectedOpportunity?.minPSAT],
              ["Selectivity Level", selectedOpportunity?.selectivityLevel],
              ["Hours per Week", selectedOpportunity?.hoursPerWeek],
              ["Added On", selectedOpportunity?.createdAt],
            ].map(
              ([label, value], idx) =>
                value !== undefined && (
                  <Text
                    key={idx}
                    style={{
                      fontSize: 14,
                      marginBottom: 8,
                      color: isDark ? "#ddd" : "#000",
                    }}
                  >
                    <Text
                      style={{
                        fontWeight: "600",
                        color: isDark ? "#aaa" : "#000",
                      }}
                    >
                      {label}:
                    </Text>{" "}
                    {value}
                  </Text>
                ),
            )}

            <Text
              style={{
                fontSize: 14,
                marginBottom: 8,
                color: isDark ? "#ddd" : "#000",
              }}
            >
              <Text
                style={{ fontWeight: "600", color: isDark ? "#aaa" : "#000" }}
              >
                Prestige:
              </Text>{" "}
              {renderStars(selectedOpportunity?.prestige)}
            </Text>

            <Text
              style={{
                fontSize: 14,
                marginBottom: 8,
                color: isDark ? "#ddd" : "#000",
              }}
            >
              <Text
                style={{ fontWeight: "600", color: isDark ? "#aaa" : "#000" }}
              >
                Only FRL Students:
              </Text>{" "}
              {selectedOpportunity?.onlyFRLStudents ? "Yes" : "No"}
            </Text>

            <Text
              style={{
                fontSize: 14,
                marginBottom: 8,
                color: isDark ? "#ddd" : "#000",
              }}
            >
              <Text
                style={{ fontWeight: "600", color: isDark ? "#aaa" : "#000" }}
              >
                Only First Gen:
              </Text>{" "}
              {selectedOpportunity?.onlyFirstGen ? "Yes" : "No"}
            </Text>

            <Text
              style={{
                fontSize: 14,
                marginBottom: 8,
                color: isDark ? "#ddd" : "#000",
              }}
            >
              <Text
                style={{ fontWeight: "600", color: isDark ? "#aaa" : "#000" }}
              >
                Has Leadership Roles:
              </Text>{" "}
              {selectedOpportunity?.hasLeadershipRoles ? "Yes" : "No"}
            </Text>

            <Text
              style={{
                fontSize: 14,
                marginBottom: 8,
                color: isDark ? "#ddd" : "#000",
              }}
            >
              <Text
                style={{ fontWeight: "600", color: isDark ? "#aaa" : "#000" }}
              >
                Outside US:
              </Text>{" "}
              {selectedOpportunity?.outsideUS ? "Yes" : "No"}
            </Text>

            {selectedOpportunity?.apply && (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 8,
                }}
              >
                <Text
                  style={{ fontWeight: "600", color: isDark ? "#aaa" : "#000" }}
                >
                  Apply:
                </Text>
                <TouchableOpacity
                  onPress={async () => {
                    if (selectedOpportunity?.apply) {
                      await WebBrowser.openBrowserAsync(
                        selectedOpportunity.apply,
                      );
                    }
                  }}
                  style={{ marginLeft: 8 }}
                >
                  <Text
                    style={{
                      color: "#3B82F6",
                      textDecorationLine: "underline",
                      fontSize: 14,
                    }}
                  >
                    {selectedOpportunity.apply}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </View>
      </ReactNativeModal>
    </SafeAreaView>
  );
};

export default Opportunities;
