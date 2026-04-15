import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Text,
  View,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  Animated,
  ScrollView,
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Swiper from "react-native-swiper";
import { useAuth } from "@clerk/clerk-expo";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import InputField from "@/components/InputField";
import { fetchAPI } from "@/lib/fetch";
import {
  hasSeenNotificationsPrompt,
  markNotificationsPromptSeen,
  setNotificationsEnabled,
} from "@/lib/notifications";
import { presentPremiumPaywallIfNeeded } from "@/lib/premium";
import { router, useLocalSearchParams } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import * as Haptics from "expo-haptics";
import Purchases from "react-native-purchases";

// ─── Types ───────────────────────────────────────────────────────────────────

interface DropdownOption {
  label: string;
  value: string;
}

interface IDropdowns {
  yesNo: DropdownOption[];
  grades: DropdownOption[];
  raceEthnicity: DropdownOption[];
  gender: DropdownOption[];
  extracurricularReasons: DropdownOption[];
  satRange: DropdownOption[];
  actRange: DropdownOption[];
  psatRange: DropdownOption[];
  fieldLevel: DropdownOption[];
  opportunitySelectivity: DropdownOption[];
  weeklyCommitment: DropdownOption[];
  extracurricularFormat: DropdownOption[];
  referralSource: DropdownOption[];
  careerInterest: DropdownOption[];
}

interface IFormData {
  gradeLevel?: string;
  race?: string;
  gender?: string;
  age?: string;
  firstGen?: string;
  gpaWeighted?: string;
  gpaUnweighted?: string;
  satScore?: string;
  actScore?: string;
  psatScore?: string;
  careerInterest?: string[];
  entrepreneur?: string;
  research?: string;
  ecReason?: string[];
  ecLevel?: string[];
  leadership?: string;
  selectivity?: string;
  paid?: string;
  travel?: string;
  timeWeekly?: string;
  ecType?: string;
  source?: string;
  usedOtherApps?: string;
  agreeTerms?: string;
}

// ─── Animated Progress Bar ───────────────────────────────────────────────────

const ProgressBar = ({
  step,
  total,
  isDark,
}: {
  step: number;
  total: number;
  isDark: boolean;
}) => {
  const progressAnim = useRef(new Animated.Value((step + 1) / total)).current;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: (step + 1) / total,
      duration: 350,
      useNativeDriver: false,
    }).start();
  }, [step, total]);

  const width = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <View
      style={{
        flex: 1,
        height: 5,
        backgroundColor: isDark ? "#2a2a2a" : "#E5E7EB",
        borderRadius: 3,
        overflow: "hidden",
      }}
    >
      <Animated.View
        style={{
          height: 5,
          width,
          backgroundColor: "#5b55f7",
          borderRadius: 3,
        }}
      />
    </View>
  );
};

// ─── Field Label ─────────────────────────────────────────────────────────────

const FieldLabel = ({
  text,
  isDark,
  required = true,
}: {
  text: string;
  isDark: boolean;
  required?: boolean;
}) => (
  <Text
    style={{
      fontSize: 14,
      fontFamily: "Poppins-SemiBold",
      color: isDark ? "#bbb" : "#4B5563",
      marginTop: 22,
      marginBottom: 10,
      letterSpacing: 0.2,
    }}
  >
    {text.toUpperCase()}
    {required && <Text style={{ color: "#ef4444" }}> *</Text>}
  </Text>
);

// ─── Inline Single-Select (replaces DropdownField) ───────────────────────────

const InlineSelect = ({
  options,
  value,
  onChange,
  isDark,
  columns = 1,
}: {
  options: DropdownOption[];
  value: string;
  onChange: (item: DropdownOption) => void;
  isDark: boolean;
  columns?: 1 | 2;
}) => {
  const gap = 8;
  const twoCol = columns === 2;

  return (
    <View
      style={{
        flexDirection: twoCol ? "row" : "column",
        flexWrap: twoCol ? "wrap" : "nowrap",
        gap,
      }}
    >
      {options.map((option) => {
        const selected = value === option.value;
        return (
          <TouchableOpacity
            key={option.value}
            onPress={async () => {
              await Haptics.selectionAsync();
              onChange(option);
            }}
            style={{
              width: twoCol ? `${(100 - gap / 2) / 2}%` : "100%",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingVertical: 13,
              paddingHorizontal: 15,
              borderRadius: 12,
              borderWidth: 2,
              borderColor: selected
                ? "#5b55f7"
                : isDark
                  ? "#252525"
                  : "#E5E7EB",
              backgroundColor: selected
                ? isDark
                  ? "#1e1c4d"
                  : "#EEF2FF"
                : isDark
                  ? "#1A1A1A"
                  : "#F9FAFB",
            }}
          >
            <Text
              style={{
                fontFamily: "Poppins-Medium",
                fontSize: 14,
                color: selected ? "#5b55f7" : isDark ? "#ccc" : "#374151",
                flex: 1,
              }}
              numberOfLines={2}
            >
              {option.label}
            </Text>
            {selected && (
              <MaterialCommunityIcons
                name="check-circle"
                size={18}
                color="#5b55f7"
                style={{ marginLeft: 6 }}
              />
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

// ─── Chip Multi-Select (replaces MultiSelectDropdown) ────────────────────────

const ChipSelect = ({
  options,
  selectedValues,
  onChange,
  isDark,
}: {
  options: DropdownOption[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  isDark: boolean;
}) => {
  const toggle = async (val: string) => {
    await Haptics.selectionAsync();
    if (selectedValues.includes(val)) {
      onChange(selectedValues.filter((v) => v !== val));
    } else {
      onChange([...selectedValues, val]);
    }
  };

  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
      {options.map((option) => {
        const selected = selectedValues.includes(option.value);
        return (
          <TouchableOpacity
            key={option.value}
            onPress={() => toggle(option.value)}
            style={{
              paddingHorizontal: 14,
              paddingVertical: 9,
              borderRadius: 20,
              borderWidth: 2,
              borderColor: selected
                ? "#5b55f7"
                : isDark
                  ? "#252525"
                  : "#E5E7EB",
              backgroundColor: selected
                ? "#5b55f7"
                : isDark
                  ? "#1A1A1A"
                  : "#F9FAFB",
            }}
          >
            <Text
              style={{
                fontFamily: "Poppins-Medium",
                fontSize: 13,
                color: selected ? "#fff" : isDark ? "#bbb" : "#555",
              }}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

// ─── Yes / No Card Pair ───────────────────────────────────────────────────────

const CardPair = ({
  value,
  onChange,
  isDark,
  trueLabel = "Yes",
  falseLabel = "No",
}: {
  value: string;
  onChange: (item: DropdownOption) => void;
  isDark: boolean;
  trueLabel?: string;
  falseLabel?: string;
}) => {
  const pairs = [
    { label: trueLabel, value: "Yes" },
    { label: falseLabel, value: "No" },
  ];

  return (
    <View style={{ flexDirection: "row", gap: 12 }}>
      {pairs.map((option) => {
        const selected = value === option.value;
        return (
          <TouchableOpacity
            key={option.value}
            onPress={async () => {
              await Haptics.selectionAsync();
              onChange(option);
            }}
            style={{
              flex: 1,
              paddingVertical: 20,
              borderRadius: 14,
              borderWidth: 2,
              borderColor: selected
                ? "#5b55f7"
                : isDark
                  ? "#252525"
                  : "#E5E7EB",
              backgroundColor: selected
                ? isDark
                  ? "#1e1c4d"
                  : "#EEF2FF"
                : isDark
                  ? "#1A1A1A"
                  : "#F9FAFB",
              alignItems: "center",
            }}
          >
            <Text
              style={{
                fontSize: 16,
                fontFamily: "Poppins-SemiBold",
                color: selected ? "#5b55f7" : isDark ? "#bbb" : "#555",
              }}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

// ─── Step Layout (replaces SlideWrapper) ─────────────────────────────────────

const StepLayout = ({
  children,
  icon,
  title,
  subtitle,
  onContinue,
  continueLabel = "Continue",
  disabled = false,
  isLoading = false,
}: {
  children: React.ReactNode;
  icon: string;
  title: string;
  subtitle: string;
  onContinue: () => void | Promise<void>;
  continueLabel?: string;
  disabled?: boolean;
  isLoading?: boolean;
}) => {
  const isDark = useColorScheme() === "dark";
  const isButtonDisabled = disabled || isLoading;

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{
        paddingHorizontal: 24,
        paddingBottom: 40,
        paddingTop: 8,
      }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View
        style={{
          width: 56,
          height: 56,
          borderRadius: 16,
          backgroundColor: isDark ? "#1e1c4d" : "#EEF2FF",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 14,
        }}
      >
        <MaterialCommunityIcons name={icon as any} size={28} color="#5b55f7" />
      </View>
      <Text
        style={{
          fontSize: 24,
          fontFamily: "Poppins-Bold",
          color: isDark ? "#fff" : "#111",
          marginBottom: 4,
        }}
      >
        {title}
      </Text>
      <Text
        style={{
          fontSize: 14,
          color: isDark ? "#888" : "#6B7280",
          fontFamily: "Poppins-Regular",
          marginBottom: 4,
        }}
      >
        {subtitle}
      </Text>
      {children}

      <TouchableOpacity
        onPress={onContinue}
        disabled={isButtonDisabled}
        style={{
          backgroundColor: "#5b55f7",
          borderRadius: 14,
          paddingVertical: 17,
          alignItems: "center",
          marginTop: 28,
          opacity: isButtonDisabled ? 0.7 : 1,
        }}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text
            style={{
              fontSize: 17,
              fontFamily: "Poppins-SemiBold",
              color: "#fff",
            }}
          >
            {continueLabel}
          </Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const ProfileSetup: React.FC = () => {
  const { getToken } = useAuth();
  const isDark = useColorScheme() === "dark";
  const { update } = useLocalSearchParams<{ update?: string }>();
  const [formData, setFormData] = useState<IFormData>({});
  const swiperRef = useRef<Swiper | null>(null);
  const hasLoadedProfileRef = useRef(false);
  const originalFormDataRef = useRef<IFormData>({});
  const [dropdowns, setDropdowns] = useState<IDropdowns | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState(0);

  const background = isDark ? "#121212" : "#fff";
  const textColor = isDark ? "#fff" : "#111";
  const subTextColor = isDark ? "#888" : "#6B7280";
  const termsRequiredMessage =
    "You must accept the Terms of Service and Privacy Policy to continue.";

  const handleChange = useCallback((key: keyof IFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleTermsChange = useCallback(
    (value: string) => {
      if (value === "No") {
        Alert.alert("Consent Required", termsRequiredMessage);
        return;
      }

      handleChange("agreeTerms", value);
    },
    [handleChange, termsRequiredMessage],
  );

  const handleMultiSelectChange = useCallback(
    (key: keyof IFormData, values: string[]) => {
      setFormData((prev) => ({ ...prev, [key]: values }));
    },
    [],
  );

  const handleBack = () => {
    if (step > 0) {
      swiperRef.current?.scrollBy(-1);
    }
  };

  const handleClose = () => {
    const hasChanges =
      JSON.stringify(formData) !== JSON.stringify(originalFormDataRef.current);

    if (hasChanges) {
      Alert.alert("Discard changes?", "Your changes won't be saved.", [
        { text: "Keep editing", style: "cancel" },
        {
          text: "Discard",
          style: "destructive",
          onPress: () => router.replace("/(root)/(tabs)/profile"),
        },
      ]);
    } else {
      router.replace("/(root)/(tabs)/profile");
    }
  };

  function parsePostgresArray(str: string): string[] {
    if (!str) return [];
    return str
      .replace(/^{|}$/g, "")
      .split(",")
      .map((s) => s.trim().replace(/^"+|"+$/g, ""));
  }

  function mapSatScoreToRange(score: number): string {
    if (score >= 1500) return "1500+";
    if (score >= 1400) return "1400-1490";
    if (score >= 1200) return "1200-1390";
    if (score >= 1000) return "1000-1190";
    if (score >= 400) return "400-990";
    return "None";
  }

  function mapActScoreToRange(score: number): string {
    if (score >= 34) return "34+";
    if (score >= 30) return "30-33";
    if (score >= 23) return "23-29";
    if (score >= 1) return "1-22";
    return "None";
  }

  function mapPsatScoreToRange(score: number): string {
    if (score >= 1400) return "1400+";
    if (score >= 1200) return "1200-1390";
    if (score >= 1000) return "1000-1190";
    if (score >= 320) return "320-990";
    return "None";
  }

  useEffect(() => {
    if (update !== "true" || hasLoadedProfileRef.current) return;

    hasLoadedProfileRef.current = true;
    let isMounted = true;

    const fetchUserData = async () => {
      try {
        const token = await getToken();
        const response = await fetch("https://ec-ai.expo.app/getuserdata", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({}),
        });
        const result = await response.json();
        if (!isMounted || !response.ok || !result?.user) return;

        const userData = result.user;
        const satScoreNum = parseInt(userData.sat_score);
        const actScoreNum = parseInt(userData.act_score);
        const psatScoreNum = parseInt(userData.psat_score);

        let careerInterestArr: string[] = [];
        if (typeof userData.career_interest === "string") {
          careerInterestArr = parsePostgresArray(userData.career_interest);
        } else if (Array.isArray(userData.career_interest)) {
          careerInterestArr = userData.career_interest;
        }

        let ecReasonArr: string[] = [];
        if (Array.isArray(userData.extracurricular_motivation)) {
          ecReasonArr = userData.extracurricular_motivation
            .flat()
            .map((item: string) => item.trim());
        } else if (typeof userData.extracurricular_motivation === "string") {
          ecReasonArr = parsePostgresArray(userData.extracurricular_motivation);
        }

        let ecLevelArr: string[] = [];
        if (typeof userData.field_goal === "string") {
          ecLevelArr = parsePostgresArray(userData.field_goal);
        } else if (Array.isArray(userData.field_goal)) {
          ecLevelArr = userData.field_goal;
        }

        const loadedFormData: IFormData = {
          gradeLevel: userData.grade_level,
          race: userData.race_ethnicity,
          gender: userData.gender,
          age: String(userData.age),
          firstGen: userData.first_gen_college ? "Yes" : "No",
          gpaWeighted: userData.gpa_weighted,
          gpaUnweighted: userData.gpa_unweighted,
          satScore: isNaN(satScoreNum)
            ? "None"
            : mapSatScoreToRange(satScoreNum),
          actScore: isNaN(actScoreNum)
            ? "None"
            : mapActScoreToRange(actScoreNum),
          psatScore: isNaN(psatScoreNum)
            ? "None"
            : mapPsatScoreToRange(psatScoreNum),
          careerInterest: careerInterestArr,
          entrepreneur: userData.wants_to_start_business ? "Yes" : "No",
          research: userData.interested_in_research ? "Yes" : "No",
          ecReason: ecReasonArr,
          ecLevel: ecLevelArr,
          leadership: userData.seeking_leadership ? "Yes" : "No",
          selectivity: userData.opportunity_selectivity,
          paid: userData.interested_in_paid_opportunities ? "Yes" : "No",
          travel: userData.interested_in_travel ? "Yes" : "No",
          timeWeekly: userData.weekly_commitment,
          ecType: userData.extracurricular_format,
          source: userData.referral_source,
          usedOtherApps: userData.used_other_ec_finders ? "Yes" : "No",
          agreeTerms: userData.agreed_to_terms ? "Yes" : "No",
        };
        originalFormDataRef.current = loadedFormData;
        setFormData(loadedFormData);
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserData();

    return () => {
      isMounted = false;
    };
  }, [update, getToken]);

  const handleSubmit = async () => {
    if (isSubmitting) return false;

    setIsSubmitting(true);
    try {
      const token = await getToken();
      await fetchAPI("https://ec-ai.expo.app/userdata", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });
      if (update !== "true") {
        await presentPremiumPaywallIfNeeded();
        const hasSeenPrompt = await hasSeenNotificationsPrompt();
        if (!hasSeenPrompt) {
          await new Promise<void>((resolve) => {
            const finishPrompt = async (enableNotifications: boolean) => {
              try {
                await markNotificationsPromptSeen();
                const customerInfo = await Purchases.getCustomerInfo().catch(
                  () => null,
                );
                const isPremium = !!customerInfo?.entitlements.active["premium"];
                const result = await setNotificationsEnabled(
                  enableNotifications,
                  {
                    authToken: token,
                    isPremium,
                  },
                );

                if (enableNotifications && !result) {
                  Alert.alert(
                    "Notifications unavailable",
                    "Enable notifications on a physical device to receive EC-AI alerts.",
                  );
                }
              } catch (error) {
                console.error("Failed to update notification preference:", error);
              } finally {
                resolve();
              }
            };

            Alert.alert(
              "Stay in the loop?",
              "Can we send reminders to log activities, check new opportunities, and keep you on track each week?",
              [
                {
                  text: "Not now",
                  style: "cancel",
                  onPress: () => {
                    void finishPrompt(false);
                  },
                },
                {
                  text: "Allow",
                  onPress: () => {
                    void finishPrompt(true);
                  },
                },
              ],
              { cancelable: false },
            );
          });
        }
      }
      router.replace("/(root)/(tabs)/opportunity_match");
      return true;
    } catch (err) {
      console.error("Error submitting profile data:", err);
      Alert.alert("Error", "Something went wrong. Please try again.");
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const validateSlide = (currentStep: number): boolean => {
    switch (currentStep) {
      case 0:
        return !!(
          formData.gradeLevel?.trim() &&
          formData.race?.trim() &&
          formData.gender?.trim() &&
          formData.age?.trim()
        );
      case 1:
        return !!(
          formData.firstGen?.trim() &&
          formData.gpaWeighted?.trim() &&
          formData.satScore?.trim() &&
          formData.actScore?.trim()
        );
      case 2:
        return !!(
          formData.gpaUnweighted?.trim() &&
          formData.psatScore?.trim() &&
          formData.careerInterest?.length &&
          formData.entrepreneur?.trim()
        );
      case 3:
        return !!(
          formData.ecReason?.length &&
          formData.ecLevel?.length &&
          formData.leadership?.trim() &&
          formData.research?.trim()
        );
      case 4:
        return !!(
          formData.paid?.trim() &&
          formData.ecType?.trim() &&
          formData.timeWeekly?.trim() &&
          formData.selectivity?.trim()
        );
      case 5:
        return !!(
          formData.travel?.trim() &&
          formData.source?.trim() &&
          formData.usedOtherApps?.trim() &&
          formData.agreeTerms === "Yes"
        );
      default:
        return true;
    }
  };

  const goToNextSlide = () => {
    if (validateSlide(step)) {
      swiperRef.current?.scrollBy(1);
    } else {
      if (step === 5 && formData.agreeTerms !== "Yes") {
        Alert.alert("Consent Required", termsRequiredMessage);
        return;
      }

      Alert.alert("Incomplete", "Please fill out all required fields.");
    }
  };

  const handleContinue = async () => {
    if (isSubmitting) return;

    await Haptics.selectionAsync();
    if (step === 5) {
      if (!validateSlide(5)) {
        if (formData.agreeTerms !== "Yes") {
          Alert.alert("Consent Required", termsRequiredMessage);
          return;
        }

        Alert.alert("Incomplete", "Please fill out all required fields.");
        return;
      }
      const submitted = await handleSubmit();
      if (submitted) {
        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success,
        );
      }
    } else {
      goToNextSlide();
    }
  };

  useEffect(() => {
    const getDropdowns = async () => {
      try {
        const result = await fetchAPI("https://ec-ai.expo.app/fetchdropdowns", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });
        setDropdowns(result.data);
      } catch (err) {
        console.error("Error fetching dropdown data:", err);
        Alert.alert("Error", "Failed to load form options.");
      } finally {
        setLoading(false);
      }
    };
    getDropdowns();
  }, []);

  if (loading || !dropdowns) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: background,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator size="large" color="#5b55f7" />
        <Text
          style={{
            fontSize: 15,
            marginTop: 14,
            color: subTextColor,
            fontFamily: "Poppins-Regular",
          }}
        >
          Loading...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: background }}>
      {/* ── Top nav: back arrow + animated progress bar + step counter ── */}
      <View
        style={{
          paddingHorizontal: 20,
          paddingTop: 10,
          paddingBottom: 14,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <TouchableOpacity
            onPress={handleBack}
            style={{ opacity: step > 0 ? 1 : 0 }}
            disabled={step === 0}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MaterialCommunityIcons
              name="arrow-left"
              size={24}
              color={textColor}
            />
          </TouchableOpacity>

          <ProgressBar step={step} total={6} isDark={isDark} />

          <Text
            style={{
              fontFamily: "Poppins-Medium",
              fontSize: 13,
              color: subTextColor,
              minWidth: 32,
              textAlign: "right",
            }}
          >
            {step + 1}/6
          </Text>

          {update === "true" && (
            <TouchableOpacity
              onPress={handleClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <MaterialCommunityIcons
                name="close"
                size={22}
                color={textColor}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <Swiper
        ref={swiperRef}
        loop={false}
        showsPagination={false}
        scrollEnabled={false}
        onIndexChanged={(index) => setStep(index)}
      >
        <View style={{ flex: 1 }}>
          <StepLayout
            icon="account"
            title="Tell us about you"
            subtitle="Your profile helps us find the perfect matches"
            onContinue={handleContinue}
          >
            <FieldLabel text="Age" isDark={isDark} />
            <InputField
              keyboardType="numeric"
              placeholder="Enter your age"
              value={formData.age}
              onChangeText={(val) => handleChange("age", val)}
            />

            <FieldLabel text="Grade Level" isDark={isDark} />
            <InlineSelect
              options={dropdowns.grades}
              value={formData.gradeLevel || ""}
              onChange={(item) => handleChange("gradeLevel", item.value)}
              isDark={isDark}
              columns={2}
            />

            <FieldLabel text="Race / Ethnicity" isDark={isDark} />
            <InlineSelect
              options={dropdowns.raceEthnicity}
              value={formData.race || ""}
              onChange={(item) => handleChange("race", item.value)}
              isDark={isDark}
            />

            <FieldLabel text="Gender" isDark={isDark} />
            <InlineSelect
              options={dropdowns.gender}
              value={formData.gender || ""}
              onChange={(item) => handleChange("gender", item.value)}
              isDark={isDark}
              columns={2}
            />
          </StepLayout>
        </View>

        <View style={{ flex: 1 }}>
          <StepLayout
            icon="school"
            title="Academic profile"
            subtitle="Helps us recommend right-fit opportunities"
            onContinue={handleContinue}
          >
            <FieldLabel
              text="First-Generation College Student?"
              isDark={isDark}
            />
            <CardPair
              value={formData.firstGen || ""}
              onChange={(item) => handleChange("firstGen", item.value)}
              isDark={isDark}
            />

            <FieldLabel text="Weighted GPA" isDark={isDark} />
            <InputField
              keyboardType="numeric"
              placeholder="e.g. 3.9"
              value={formData.gpaWeighted}
              onChangeText={(val) => handleChange("gpaWeighted", val)}
            />

            <FieldLabel text="SAT Score Range" isDark={isDark} />
            <InlineSelect
              options={dropdowns.satRange}
              value={formData.satScore || ""}
              onChange={(item) => handleChange("satScore", item.value)}
              isDark={isDark}
              columns={2}
            />

            <FieldLabel text="ACT Score Range" isDark={isDark} />
            <InlineSelect
              options={dropdowns.actRange}
              value={formData.actScore || ""}
              onChange={(item) => handleChange("actScore", item.value)}
              isDark={isDark}
              columns={2}
            />
          </StepLayout>
        </View>

        <View style={{ flex: 1 }}>
          <StepLayout
            icon="heart"
            title="Your interests"
            subtitle="What you're passionate about shapes everything"
            onContinue={handleContinue}
          >
            <FieldLabel text="Unweighted GPA" isDark={isDark} />
            <InputField
              keyboardType="numeric"
              placeholder="e.g. 3.7"
              value={formData.gpaUnweighted}
              onChangeText={(val) => handleChange("gpaUnweighted", val)}
            />

            <FieldLabel text="PSAT Score Range" isDark={isDark} />
            <InlineSelect
              options={dropdowns.psatRange}
              value={formData.psatScore || ""}
              onChange={(item) => handleChange("psatScore", item.value)}
              isDark={isDark}
              columns={2}
            />

            <FieldLabel text="Career Interests" isDark={isDark} />
            <ChipSelect
              options={dropdowns.careerInterest}
              selectedValues={formData.careerInterest || []}
              onChange={(values) =>
                handleMultiSelectChange("careerInterest", values)
              }
              isDark={isDark}
            />

            <FieldLabel
              text="Want to start a business or nonprofit?"
              isDark={isDark}
            />
            <CardPair
              value={formData.entrepreneur || ""}
              onChange={(item) => handleChange("entrepreneur", item.value)}
              isDark={isDark}
            />
          </StepLayout>
        </View>

        <View style={{ flex: 1 }}>
          <StepLayout
            icon="trophy"
            title="Your goals"
            subtitle="What do you want to achieve?"
            onContinue={handleContinue}
          >
            <FieldLabel
              text="Why do you want extracurriculars?"
              isDark={isDark}
            />
            <ChipSelect
              options={dropdowns.extracurricularReasons}
              selectedValues={formData.ecReason || []}
              onChange={(values) => handleMultiSelectChange("ecReason", values)}
              isDark={isDark}
            />

            <FieldLabel
              text="What level do you want to reach in your field?"
              isDark={isDark}
            />
            <ChipSelect
              options={dropdowns.fieldLevel}
              selectedValues={formData.ecLevel || []}
              onChange={(values) => handleMultiSelectChange("ecLevel", values)}
              isDark={isDark}
            />

            <FieldLabel text="Seeking leadership roles?" isDark={isDark} />
            <CardPair
              value={formData.leadership || ""}
              onChange={(item) => handleChange("leadership", item.value)}
              isDark={isDark}
            />

            <FieldLabel text="Interested in research?" isDark={isDark} />
            <CardPair
              value={formData.research || ""}
              onChange={(item) => handleChange("research", item.value)}
              isDark={isDark}
            />
          </StepLayout>
        </View>

        <View style={{ flex: 1 }}>
          <StepLayout
            icon="tune-variant"
            title="Activity preferences"
            subtitle="How do you like to engage?"
            onContinue={handleContinue}
          >
            <FieldLabel text="Opportunity Selectiveness" isDark={isDark} />
            <InlineSelect
              options={dropdowns.opportunitySelectivity}
              value={formData.selectivity || ""}
              onChange={(item) => handleChange("selectivity", item.value)}
              isDark={isDark}
            />

            <FieldLabel
              text="Interested in paid opportunities?"
              isDark={isDark}
            />
            <CardPair
              value={formData.paid || ""}
              onChange={(item) => handleChange("paid", item.value)}
              isDark={isDark}
            />

            <FieldLabel text="EC Format Preference" isDark={isDark} />
            <InlineSelect
              options={dropdowns.extracurricularFormat}
              value={formData.ecType || ""}
              onChange={(item) => handleChange("ecType", item.value)}
              isDark={isDark}
            />

            <FieldLabel text="Weekly Time Commitment" isDark={isDark} />
            <InlineSelect
              options={dropdowns.weeklyCommitment}
              value={formData.timeWeekly || ""}
              onChange={(item) => handleChange("timeWeekly", item.value)}
              isDark={isDark}
              columns={2}
            />
          </StepLayout>
        </View>

        <View style={{ flex: 1 }}>
          <StepLayout
            icon="check-circle-outline"
            title="Almost done!"
            subtitle="Just a couple more things"
            onContinue={handleContinue}
            continueLabel="Submit"
            disabled={isSubmitting}
            isLoading={isSubmitting}
          >
            <FieldLabel
              text="Interested in travel / study abroad?"
              isDark={isDark}
            />
            <CardPair
              value={formData.travel || ""}
              onChange={(item) => handleChange("travel", item.value)}
              isDark={isDark}
            />

            <FieldLabel text="How did you hear about us?" isDark={isDark} />
            <InlineSelect
              options={dropdowns.referralSource}
              value={formData.source || ""}
              onChange={(item) => handleChange("source", item.value)}
              isDark={isDark}
            />

            <FieldLabel
              text="Used other EC finder apps before?"
              isDark={isDark}
            />
            <CardPair
              value={formData.usedOtherApps || ""}
              onChange={(item) => handleChange("usedOtherApps", item.value)}
              isDark={isDark}
            />

            <FieldLabel text="Terms & Privacy Policy" isDark={isDark} />
            <Text
              style={{
                color: isDark ? "#888" : "#6B7280",
                fontFamily: "Poppins-Regular",
                fontSize: 14,
                lineHeight: 21,
                marginBottom: 12,
              }}
            >
              By continuing you agree to our{" "}
              <Text
                onPress={() =>
                  WebBrowser.openBrowserAsync("https://ec-ai.app/terms-of-use")
                }
                style={{ color: "#5b55f7" }}
              >
                Terms of Service
              </Text>
              {" & "}
              <Text
                onPress={() =>
                  WebBrowser.openBrowserAsync(
                    "https://ec-ai.app/privacy-policy",
                  )
                }
                style={{ color: "#5b55f7" }}
              >
                Privacy Policy
              </Text>
            </Text>
            <CardPair
              value={formData.agreeTerms || ""}
              onChange={(item) => handleTermsChange(item.value)}
              isDark={isDark}
              trueLabel="I Agree"
              falseLabel="Decline"
            />
          </StepLayout>
        </View>
      </Swiper>
    </SafeAreaView>
  );
};

export default ProfileSetup;
