import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Platform,
  StyleSheet,
  ActionSheetIOS,
} from "react-native";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import { Alert } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useColorScheme } from "react-native";
import { GlassView } from "expo-glass-effect";
import InputField from "@/components/InputField";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import * as Haptics from "expo-haptics";
import ReactNativeModal from "react-native-modal";

import Swiper from "react-native-deck-swiper";
import { useUser, useAuth } from "@clerk/clerk-expo";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Purchases from "react-native-purchases";
import AsyncStorage from "@react-native-async-storage/async-storage";
import CustomButton from "@/components/CustomButton";
import { renderStars } from "@/lib/formatters";
// TypeScript resolves the platform suffixes here, but eslint-import-resolver-typescript does not.
// eslint-disable-next-line import/no-unresolved
import NativeAdCard from "@/components/NativeAdCard";

interface Opportunity {
  id: string;
  title: string;
  activityType: string;
  pictureurl?: string;
  description?: string;
  prestige?: number;
}

const { width } = Dimensions.get("window");
const CARD_WIDTH = width - 40;
const CARD_HEIGHT = 600;
const REPORT_BUTTON_SIZE = 38;
const REPORT_ICON_COLOR = "#5B55F6";

const styles = StyleSheet.create({
  reportButtonShell: {
    width: REPORT_BUTTON_SIZE,
    height: REPORT_BUTTON_SIZE,
    borderRadius: REPORT_BUTTON_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  reportButtonShadow: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 14,
  },
});
const Opportunities = () => {
  const [swipeCount, setSwipeCount] = useState(0);
  const [lastSwipeDate, setLastSwipeDate] = useState<string>("");
  const { user } = useUser();
  const { getToken } = useAuth();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const reportButtonStyle = [
    styles.reportButtonShell,
    Platform.OS === "ios" ? styles.reportButtonShadow : null,
    {
      backgroundColor: isDark
        ? "rgba(15, 18, 34, 0.28)"
        : "rgba(255, 255, 255, 0.38)",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark
        ? "rgba(255, 255, 255, 0.12)"
        : "rgba(255, 255, 255, 0.48)",
    },
  ];
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [cardIndex, setCardIndex] = useState(0);
  const [isPremium, setIsPremium] = useState(false);

  const [canSwipe, setCanSwipe] = useState(true);
  const [reportingOp, setReportingOp] = useState<Opportunity | null>(null);
  const [reportReason, setReportReason] = useState<string>("");
  const [reportDetails, setReportDetails] = useState<string>("");
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    if (lastSwipeDate !== today) {
      setSwipeCount(0);
      setLastSwipeDate(today);
    }
  }, [lastSwipeDate]);

  const openReport = (op: Opportunity) => {
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          title: `Report "${op.title}"`,
          message: "Why are you reporting this opportunity?",
          options: ["Scam", "Inaccurate info", "Other", "Cancel"],
          cancelButtonIndex: 3,
          destructiveButtonIndex: 3,
        },
        async (buttonIndex) => {
          if (buttonIndex === 3) return;
          const reasons = ["Scam", "Inaccurate info", "Other"];
          const reason = reasons[buttonIndex];

          const doSubmit = async (details: string) => {
            try {
              const token = await getToken();
              const res = await fetch(
                "https://ec-ai.expo.app/reportopportunity",
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                  },
                  body: JSON.stringify({
                    opportunity_id: op.id,
                    reason,
                    details,
                  }),
                },
              );
              if (!res.ok) throw new Error(await res.text());
              await Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Success,
              );
              Alert.alert("Report submitted", "Thank you for your feedback.");
            } catch (err: any) {
              Alert.alert("Error", err.message || "Could not submit report.");
            }
          };

          if (reason === "Inaccurate info" || reason === "Other") {
            Alert.prompt(
              "Add Details",
              "Please describe what's wrong",
              async (details) => {
                await doSubmit(details ?? "");
              },
              "plain-text",
            );
          } else {
            await doSubmit("");
          }
        },
      );
      return;
    }
    setReportingOp(op);
    setReportReason("");
    setReportDetails("");
  };

  const submitReport = async () => {
    if (!reportingOp || !reportReason) return;
    try {
      const token = await getToken();
      const res = await fetch("https://ec-ai.expo.app/reportopportunity", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          opportunity_id: reportingOp.id,
          reason: reportReason,
          details: reportDetails,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Report submitted", "Thank you for your feedback.");
      setReportingOp(null);
    } catch (err: any) {
      Alert.alert("Error", err.message || "Could not submit report.");
    }
  };

  const onSwiped = async (i: number, liked: boolean) => {
    if (!canSwipe) return;
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
      const hasPremium = info.entitlements.active["premium"] !== undefined;
      setCanSwipe(true); // keep unlimited swipes
      setIsPremium(hasPremium); // 🔑 track premium status
    } catch (error) {
      console.error("Failed to check premium status:", error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      (async () => await checkPremiumAndUnlock())();
    }, []),
  );

  const fetchOpportunities = useCallback(async () => {
    if (!user) return;
    try {
      const token = await getToken();
      const response = await fetch(
        "https://ec-ai.expo.app/getrecommendations",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({}),
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
  }, [user, getToken]);
  useEffect(() => {
    if (!user) return;

    (async () => {
      await fetchOpportunities();
    })();
  }, [user, fetchOpportunities]);

  const handleSwipe = async (i: number, liked: boolean) => {
    const today = new Date().toISOString().split("T")[0];
    const opportunity = opportunities[i];

    try {
      // Always allow swipes — no premium check or alert
      if (lastSwipeDate !== today) {
        setSwipeCount(1);
        setLastSwipeDate(today);
        await fetchOpportunities();
      } else {
        const updated = swipeCount + 1;
        setSwipeCount(updated);
        if (updated % 10 === 0) await fetchOpportunities();
      }

      if (liked) await handleSave(opportunity);
      await logSwipe(opportunity.id, liked);
    } catch (err) {
      console.error("Error during swipe handling:", err);
    }
  };

  const logSwipe = async (opportunityId: string, liked: boolean) => {
    try {
      const token = await getToken();
      await fetch("https://ec-ai.expo.app/logswipe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ opportunityId, liked }),
      });
    } catch (err) {
      console.error("Swipe log failed:", err);
    }
  };

  const handleSave = async (op: Opportunity) => {
    if (!user) return;

    try {
      const token = await getToken();
      const res = await fetch("https://ec-ai.expo.app/getsavedopportunities", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      });

      const json = await res.json();
      const savedIds = new Set(json?.data?.map((item: any) => item.id));

      if (savedIds.has(op.id)) return; // Already saved

      // No more premium check or limit — save unconditionally
      await fetch("https://ec-ai.expo.app/addsavedopportunity", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ opportunity_id: op.id }),
      });
    } catch (err) {
      console.error("Error saving opportunity:", err);
    }
  };

  if (loading) {
    return (
      <SafeAreaView
        edges={["top", "left", "right"]}
        style={{ flex: 1, backgroundColor: isDark ? "#121212" : "#F5F7FA" }}
      >
        <ActivityIndicator size="large" color="#5b55f6" />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView
        edges={["top", "left", "right"]}
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
      edges={["top", "left", "right"]}
      style={{
        flex: 1,
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: 24,
        backgroundColor: isDark ? "#121212" : "#F5F7FA",
      }}
    >
      {/* Header */}
      <View style={{ alignItems: "center", marginVertical: 8 }}>
        <Text
          allowFontScaling={false}
          style={{
            fontSize: 24,
            fontWeight: "bold",
            color: isDark ? "#fff" : "#1f2937",
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
            color: isDark ? "#ccc" : "#6b7280",
            fontFamily: "Poppins-Regular",
            textAlign: "center",
            fontSize: 14,
          }}
        >
          Swipe RIGHT to save an opportunity, left to skip.
        </Text>
      </View>

      {/* Card swiper */}
      <Swiper
        cards={opportunities}
        cardIndex={cardIndex}
        onSwipedRight={(i) => onSwiped(i, true)}
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
        containerStyle={{ flex: 1, marginTop: 130 }}
        renderCard={(item, index) => {
          // Show ad every 3 swipes (index 2, 5, 8, ...)
          if (!isPremium && (index + 1) % 3 === 0) {
            return <NativeAdCard />;
          }

          return (
            <View>
              <View
                style={{
                  width: CARD_WIDTH,
                  height: CARD_HEIGHT,
                  backgroundColor: "#FFF",
                  borderRadius: 12,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 8,
                  elevation: 4,
                  alignSelf: "center",
                  overflow: "hidden",
                }}
              >
                <Image
                  source={{ uri: item.pictureurl }}
                  style={{
                    width: "100%",
                    height: "100%",
                    borderRadius: 12,
                  }}
                  contentFit="cover"
                  cachePolicy="disk"
                  transition={200}
                />
                <View
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    paddingTop: 32,
                    paddingHorizontal: 16,
                    paddingBottom: 16,
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
                      Prestige:
                    </Text>{" "}
                    {renderStars(item.prestige)}
                  </Text>
                  <Text className="text-white text-md font-PoppinsRegular">
                    <Text className="text-white text-md font-PoppinsSemiBold">
                      Activity Type:
                    </Text>{" "}
                    {item.activityType}
                  </Text>
                  {item.description && (
                    <Text className="text-white text-md font-PoppinsRegular">
                      <Text className="text-white text-md font-PoppinsSemiBold">
                        Description:
                      </Text>{" "}
                      {item.description}
                    </Text>
                  )}
                </View>
              </View>

              {/* Report icon */}
              <TouchableOpacity
                style={{
                  position: "absolute",
                  top: 8,
                  right: 8,
                  zIndex: 2,
                }}
                onPress={() => openReport(item)}
              >
                {Platform.OS === "ios" ? (
                  <GlassView
                    glassEffectStyle="clear"
                    tintColor={
                      isDark
                        ? "rgba(255, 255, 255, 0.05)"
                        : "rgba(255, 255, 255, 0.02)"
                    }
                    style={reportButtonStyle}
                  >
                    <MaterialCommunityIcons
                      name="flag-outline"
                      size={20}
                      color={REPORT_ICON_COLOR}
                    />
                  </GlassView>
                ) : (
                  <View style={reportButtonStyle}>
                    <MaterialCommunityIcons
                      name="flag-outline"
                      size={20}
                      color={REPORT_ICON_COLOR}
                    />
                  </View>
                )}
              </TouchableOpacity>
            </View>
          );
        }}
      />

      <ReactNativeModal
        isVisible={!!reportingOp}
        backdropTransitionOutTiming={1}
        useNativeDriver
        useNativeDriverForBackdrop
        onBackdropPress={() => setReportingOp(null)}
      >
        <View
          className={`px-7 py-9 rounded-2xl ${isDark ? "bg-[#1E1E1E]" : "bg-white"}`}
          style={{
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: isDark ? 0.4 : 0.1,
            shadowRadius: 8,
            marginBottom: 64,
          }}
        >
          <KeyboardAwareScrollView
            enableOnAndroid
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Title + Close */}
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-xl font-PoppinsSemiBold text-black dark:text-white">
                Report Opportunity
              </Text>
              <TouchableOpacity
                onPress={() => setReportingOp(null)}
                className="p-1 rounded-full"
                activeOpacity={0.6}
              >
                <MaterialCommunityIcons
                  name="close"
                  size={24}
                  color={isDark ? "#fff" : "#000"}
                />
              </TouchableOpacity>
            </View>

            <Text className="text-base font-Poppins text-center mb-6 text-black dark:text-white">
              Why are you reporting “{reportingOp?.title}”?
            </Text>

            {["Scam", "Inaccurate info", "Other"].map((r) => {
              const isSelected = reportReason === r;

              return (
                <TouchableOpacity
                  key={r}
                  onPress={() => setReportReason(r)}
                  className={`px-4 py-3 rounded-lg mb-3 border-2 ${
                    isSelected ? "bg-primary-500/60" : "bg-primary-500"
                  } border-primary-500`}
                >
                  <Text
                    className={`text-center font-PoppinsSemiBold ${
                      isSelected ? "text-white" : "text-white/80"
                    }`}
                  >
                    {r}
                  </Text>
                </TouchableOpacity>
              );
            })}

            {(reportReason === "Inaccurate info" ||
              reportReason === "Other") && (
              <InputField
                label="Please describe what's wrong"
                returnKeyType="done"
                placeholder="Enter your explanation"
                keyboardShouldPersistTaps="never"
                value={reportDetails}
                onChangeText={setReportDetails}
                containerStyle={
                  isDark
                    ? { backgroundColor: "#1e1e1e", borderColor: "#374151" }
                    : undefined
                }
                inputStyle={isDark ? { color: "#ffffff" } : undefined}
              />
            )}

            <View className="mt-6">
              <CustomButton
                title="Submit"
                onPress={submitReport}
                disabled={!reportReason}
                className="w-full"
              />
            </View>
          </KeyboardAwareScrollView>
        </View>
      </ReactNativeModal>
    </SafeAreaView>
  );
};

export default Opportunities;
