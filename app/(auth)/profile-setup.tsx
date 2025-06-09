import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Text,
  View,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Swiper from "react-native-swiper";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useUser } from "@clerk/clerk-expo";

import InputField from "@/components/InputField";
import DropdownField from "@/components/DropdownField";
import CustomButton from "@/components/CustomButton";
import { fetchAPI } from "@/lib/fetch";
import { router, useLocalSearchParams } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import RevenueCatUI, { PAYWALL_RESULT } from "react-native-purchases-ui";
import Purchases from "react-native-purchases";
import * as Haptics from "expo-haptics";

// Interfaces
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

// MultiSelectDropdown Component
interface MultiSelectDropdownProps {
  options: DropdownOption[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
}

const MultiSelectDropdown: React.FC<MultiSelectDropdownProps> = ({
  options,
  selectedValues,
  onChange,
  placeholder = "Select options",
}) => {
  const [modalVisible, setModalVisible] = useState(false);

  const toggleOption = (value: string) => {
    if (selectedValues.includes(value)) {
      onChange(selectedValues.filter((item) => item !== value));
    } else {
      onChange([...selectedValues, value]);
    }
  };

  const renderOption = ({ item }: { item: DropdownOption }) => {
    const isSelected = selectedValues.includes(item.value);
    return (
      <TouchableOpacity
        style={multiSelectStyles.option}
        onPress={() => toggleOption(item.value)}
      >
        <View
          style={[
            multiSelectStyles.checkbox,
            isSelected && multiSelectStyles.checkedCheckbox,
          ]}
        />
        <Text style={multiSelectStyles.optionText}>{item.label}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View>
      <TouchableOpacity
        style={multiSelectStyles.dropdownButton}
        onPress={() => setModalVisible(true)}
      >
        <Text style={multiSelectStyles.dropdownButtonText}>
          {selectedValues.length
            ? options
                .filter((o) => selectedValues.includes(o.value))
                .map((o) => o.label)
                .join(", ")
            : placeholder}
        </Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="fade" transparent>
        <View style={multiSelectStyles.modalOverlay}>
          <View style={multiSelectStyles.modalContainer}>
            <ScrollView style={multiSelectStyles.scrollContainer}>
              <FlatList
                data={options}
                keyExtractor={(item) => item.value}
                renderItem={renderOption}
              />
            </ScrollView>
            <TouchableOpacity
              style={multiSelectStyles.doneButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={multiSelectStyles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const multiSelectStyles = StyleSheet.create({
  dropdownButton: {
    padding: 10,
    borderWidth: 1,
    borderRadius: 8,
    borderColor: "#ccc",
    backgroundColor: "white",
  },
  dropdownButtonText: {
    fontSize: 16,
    color: "black",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: 300,
    maxHeight: "70%",
    backgroundColor: "white",
    borderRadius: 12,
    padding: 15,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
    alignSelf: "center",
  },
  scrollContainer: {
    flexGrow: 1,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  optionText: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 16,
    color: "black",
    flexShrink: 1,
    flexWrap: "wrap",
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: "#5b55f7",
    backgroundColor: "white",
    marginRight: 10,
    borderRadius: 4,
  },
  checkedCheckbox: {
    backgroundColor: "#5b55f7",
  },
  doneButton: {
    marginTop: 10,
    padding: 10,
    backgroundColor: "#5b55f7",
    borderRadius: 8,
    alignItems: "center",
  },
  doneButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});
// SlideWrapper component
const SlideWrapper: React.FC<{
  children: React.ReactNode;
  showBack?: boolean;
  onBack?: () => void;
}> = ({ children, showBack = false, onBack = () => {} }) => (
  <KeyboardAwareScrollView
    style={{ flex: 1 }}
    contentContainerStyle={{ paddingBottom: 100, maxHeight: 700 }}
    keyboardShouldPersistTaps="handled"
    extraScrollHeight={80}
    showsVerticalScrollIndicator={false}
  >
    <View
      style={{
        backgroundColor: "white",
        padding: 20,
        borderRadius: 8,
        shadowColor: "#000",
        marginBottom: 16,
        paddingBottom: 20,
      }}
    >
      {showBack && (
        <TouchableOpacity
          onPress={onBack}
          style={{
            marginBottom: 7, // <- Large margin before bold header content
            paddingVertical: 10,
            paddingHorizontal: 14,
            backgroundColor: "#5b55f7",
            alignSelf: "flex-start",
            borderRadius: 8,
          }}
        >
          <Text style={{ fontSize: 14, color: "white", fontWeight: "600" }}>
            ← Back
          </Text>
        </TouchableOpacity>
      )}
      {children}
    </View>
  </KeyboardAwareScrollView>
);
// ProfileSetup component
const ProfileSetup: React.FC = () => {
  const { user } = useUser();
  const [isPremium, setIsPremium] = useState(false);
  const [hasShownPaywall, setHasShownPaywall] = useState(false);
  const { update } = useLocalSearchParams<{ update?: string }>();
  const [formData, setFormData] = useState<IFormData>({});
  const swiperRef = useRef<Swiper | null>(null);
  const [dropdowns, setDropdowns] = useState<IDropdowns | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(0);

  const handleChange = useCallback((key: keyof IFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleMultiSelectChange = useCallback(
    (key: keyof IFormData, values: string[]) => {
      setFormData((prev) => ({ ...prev, [key]: values }));
    },
    [],
  );
  useEffect(() => {
    const checkPremiumStatus = async () => {
      try {
        const customerInfo = await Purchases.getCustomerInfo();
        const hasPremium = !!customerInfo.entitlements.active["premium"];
        setIsPremium(hasPremium);
      } catch (error) {
        console.error("Failed to check premium status:", error);
      }
    };
    checkPremiumStatus();
  }, []);

  const handleBack = () => {
    if (step > 0) {
      swiperRef.current?.scrollBy(-1);
    }
  };

  // Updated helper: remove curly braces and any surrounding quotes from each item
  function parsePostgresArray(str: string): string[] {
    if (!str) return [];
    return str
      .replace(/^{|}$/g, "")
      .split(",")
      .map((s) => s.trim().replace(/^"+|"+$/g, ""));
  }

  // Mapping functions for score ranges
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
    if (update === "true" && user?.primaryEmailAddress?.emailAddress) {
      const fetchUserData = async () => {
        try {
          const response = await fetch("https://ec-ai.expo.app/getuserdata", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userEmail: user?.primaryEmailAddress?.emailAddress,
            }),
          });
          const result = await response.json();
          if (response.ok && result?.user) {
            const userData = result.user;
            // Convert score strings to numbers
            const satScoreNum = parseInt(userData.sat_score);
            const actScoreNum = parseInt(userData.act_score);
            const psatScoreNum = parseInt(userData.psat_score);

            // Parse multi-select fields:
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
            } else if (
              typeof userData.extracurricular_motivation === "string"
            ) {
              ecReasonArr = parsePostgresArray(
                userData.extracurricular_motivation,
              );
            }

            let ecLevelArr: string[] = [];
            if (typeof userData.field_goal === "string") {
              ecLevelArr = parsePostgresArray(userData.field_goal);
            } else if (Array.isArray(userData.field_goal)) {
              ecLevelArr = userData.field_goal;
            }

            const transformedData: IFormData = {
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
            setFormData(transformedData);
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      };
      fetchUserData();
    }
  }, [update, user?.primaryEmailAddress?.emailAddress]);

  const handleSubmit = async () => {
    if (!user?.primaryEmailAddress?.emailAddress) {
      Alert.alert("Error", "User information is missing.");
      return;
    }
    const payload = {
      userEmail: user.primaryEmailAddress.emailAddress,
      ...formData,
    };
    try {
      const response = await fetchAPI("https://ec-ai.expo.app/userdata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        router.replace("/(root)/(tabs)/opportunity_match");
      } else {
        router.replace("/(root)/(tabs)/opportunity_match");
      }
    } catch (err) {
      console.error("Error submitting profile data:", err);
      Alert.alert(
        "Error",
        "An error occurred while submitting your profile data.",
      );
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
          formData.agreeTerms?.trim()
        );
      default:
        return true;
    }
  };

  const goToNextSlide = () => {
    if (validateSlide(step)) {
      swiperRef.current?.scrollBy(1);
    } else {
      Alert.alert(
        "Incomplete",
        "Please fill out all required fields on this page.",
      );
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
        Alert.alert("Error", "Failed to load dropdown options.");
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
          backgroundColor: "#F5F7FA",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator size="large" color="#5b55f6" />
        <Text
          style={{
            fontSize: 18,
            marginTop: 8,
            color: "#555",
            fontFamily: "Poppins-Regular",
          }}
        >
          Loading form...
        </Text>
      </SafeAreaView>
    );
  }

  const yesNo = dropdowns.yesNo;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F5F7FA" }}>
      <View style={{ paddingHorizontal: 16, paddingTop: 24, paddingBottom: 8 }}>
        <Text
          allowFontScaling={false}
          style={{
            fontSize: 24,
            fontWeight: "bold",
            color: "#333",
            fontFamily: "Poppins-Bold",
          }}
        >
          Profile Setup
        </Text>
        <Text
          allowFontScaling={false}
          style={{ fontSize: 16, color: "#555", fontFamily: "Poppins-Regular" }}
        >
          Step {step + 1} of 6
        </Text>
      </View>

      <Swiper
        ref={swiperRef}
        loop={false}
        showsPagination={false}
        scrollEnabled={false}
        onIndexChanged={(index) => setStep(index)}
      >
        {/* Slide 1 */}
        <SlideWrapper showBack={step > 0} onBack={handleBack}>
          <DropdownField
            label={
              <Text className="font-medium text-lg font-PoppinsBold">
                Grade Level <Text className="text-red-500">*</Text>
              </Text>
            }
            data={dropdowns.grades}
            value={formData.gradeLevel || ""}
            placeholder="Select grade"
            onChange={(item) => handleChange("gradeLevel", item.value)}
          />
          <DropdownField
            label={
              <Text className="font-medium text-lg font-PoppinsBold">
                Race/Ethnicity <Text className="text-red-500">*</Text>
              </Text>
            }
            data={dropdowns.raceEthnicity}
            value={formData.race || ""}
            placeholder="Select race"
            onChange={(item) => handleChange("race", item.value)}
          />
          <DropdownField
            label={
              <Text className="font-medium text-lg font-PoppinsBold">
                Gender <Text className="text-red-500">*</Text>
              </Text>
            }
            data={dropdowns.gender}
            value={formData.gender || ""}
            placeholder="Select gender"
            onChange={(item) => handleChange("gender", item.value)}
          />
          <InputField
            label={
              <Text className="font-medium text-lg font-PoppinsBold">
                Age<Text className="text-red-500">*</Text>
              </Text>
            }
            keyboardType="numeric"
            placeholder="Enter your age"
            value={formData.age}
            onChangeText={(val) => handleChange("age", val)}
          />
          <CustomButton
            title="Next"
            onPress={async () => {
              await Haptics.selectionAsync();
              goToNextSlide();
            }}
            style={{ marginTop: 16, marginBottom: 16 }}
          />
        </SlideWrapper>

        {/* Slide 2 */}
        <SlideWrapper showBack onBack={handleBack}>
          <DropdownField
            label={
              <Text className="font-medium text-lg font-PoppinsBold">
                First-gen Student? <Text className="text-red-500">*</Text>
              </Text>
            }
            data={yesNo}
            value={formData.firstGen || ""}
            placeholder="Select"
            onChange={(item) => handleChange("firstGen", item.value)}
          />
          <DropdownField
            label={
              <Text className="font-medium text-lg font-PoppinsBold">
                SAT Score <Text className="text-red-500">*</Text>
              </Text>
            }
            data={dropdowns.satRange}
            value={formData.satScore || ""}
            placeholder="Select SAT range"
            onChange={(item) => handleChange("satScore", item.value)}
          />
          <DropdownField
            label={
              <Text className="font-medium text-lg font-PoppinsBold">
                ACT Score <Text className="text-red-500">*</Text>
              </Text>
            }
            data={dropdowns.actRange}
            value={formData.actScore || ""}
            placeholder="Select ACT range"
            onChange={(item) => handleChange("actScore", item.value)}
          />
          <InputField
            label={
              <Text className="font-medium text-lg font-PoppinsBold">
                Weighted GPA <Text className="text-red-500">*</Text>
              </Text>
            }
            keyboardType="numeric"
            placeholder="Enter weighted GPA"
            value={formData.gpaWeighted}
            onChangeText={(val) => handleChange("gpaWeighted", val)}
          />

          <CustomButton
            title="Next"
            onPress={async () => {
              await Haptics.selectionAsync();
              goToNextSlide();
            }}
            style={{ marginTop: 16, marginBottom: 16 }}
          />
        </SlideWrapper>

        {/* Slide 3 */}
        <SlideWrapper showBack onBack={handleBack}>
          <InputField
            label={
              <Text className="font-medium text-lg font-PoppinsBold">
                Unweighted GPA <Text className="text-red-500">*</Text>
              </Text>
            }
            keyboardType="numeric"
            placeholder="Enter unweighted GPA"
            value={formData.gpaUnweighted}
            onChangeText={(val) => handleChange("gpaUnweighted", val)}
          />
          <DropdownField
            label={
              <Text className="font-medium text-lg font-PoppinsBold">
                PSAT Score <Text className="text-red-500">*</Text>
              </Text>
            }
            data={dropdowns.psatRange}
            value={formData.psatScore || ""}
            placeholder="Select PSAT range"
            onChange={(item) => handleChange("psatScore", item.value)}
          />
          <Text
            style={{
              fontSize: 18,
              fontFamily: "Poppins-Bold",
              marginBottom: 5,
              color: "#333",
            }}
          >
            Career Interest <Text className="text-red-500">*</Text>
          </Text>
          <MultiSelectDropdown
            options={dropdowns.careerInterest}
            selectedValues={formData.careerInterest || []}
            onChange={(values) =>
              handleMultiSelectChange("careerInterest", values)
            }
            placeholder="Select career interests"
          />
          <DropdownField
            label={
              <Text className="font-medium text-lg font-PoppinsBold">
                Want to start a business/nonprofit?{" "}
                <Text className="text-red-500">*</Text>
              </Text>
            }
            data={yesNo}
            value={formData.entrepreneur || ""}
            placeholder="Select"
            onChange={(item) => handleChange("entrepreneur", item.value)}
          />

          <CustomButton
            title="Next"
            onPress={async () => {
              await Haptics.selectionAsync();
              goToNextSlide();
            }}
            style={{ marginTop: 16, marginBottom: 16 }}
          />
        </SlideWrapper>

        {/* Slide 4 */}
        <SlideWrapper showBack onBack={handleBack}>
          <Text
            style={{
              fontSize: 18,
              fontFamily: "Poppins-Bold",
              marginBottom: 5,
              color: "#333",
            }}
          >
            EC Goals? <Text className="text-red-500">*</Text>
          </Text>
          <MultiSelectDropdown
            options={dropdowns.extracurricularReasons}
            selectedValues={formData.ecReason || []}
            onChange={(values) => handleMultiSelectChange("ecReason", values)}
            placeholder="Select EC goals"
          />
          <Text
            style={{
              fontSize: 18,
              fontFamily: "Poppins-Bold",
              marginTop: 10,
              marginBottom: 5,
              color: "#333",
            }}
          >
            Level to reach in your field?{" "}
            <Text className="text-red-500">*</Text>
          </Text>
          <MultiSelectDropdown
            options={dropdowns.fieldLevel}
            selectedValues={formData.ecLevel || []}
            onChange={(values) => handleMultiSelectChange("ecLevel", values)}
            placeholder="Select levels"
          />
          <DropdownField
            label={
              <Text className="font-medium text-lg font-PoppinsBold">
                Looking for leadership? <Text className="text-red-500">*</Text>
              </Text>
            }
            data={yesNo}
            value={formData.leadership || ""}
            placeholder="Select"
            onChange={(item) => handleChange("leadership", item.value)}
          />
          <DropdownField
            label={
              <Text className="font-medium text-lg font-PoppinsBold">
                Interested in research? <Text className="text-red-500">*</Text>
              </Text>
            }
            data={yesNo}
            value={formData.research || ""}
            placeholder="Select"
            onChange={(item) => handleChange("research", item.value)}
          />
          <CustomButton
            title="Next"
            onPress={async () => {
              await Haptics.selectionAsync();
              goToNextSlide();
            }}
            style={{ marginTop: 16, marginBottom: 16 }}
          />
        </SlideWrapper>

        {/* Slide 5 */}
        <SlideWrapper showBack onBack={handleBack}>
          <DropdownField
            label={
              <Text className="font-medium text-lg font-PoppinsBold">
                Opportunity Selectiveness{" "}
                <Text className="text-red-500">*</Text>
              </Text>
            }
            data={dropdowns.opportunitySelectivity}
            value={formData.selectivity || ""}
            placeholder="Select"
            onChange={(item) => handleChange("selectivity", item.value)}
          />
          <DropdownField
            label={
              <Text className="font-medium text-lg font-PoppinsBold">
                Interested in Paid Opportunities?{" "}
                <Text className="text-red-500">*</Text>
              </Text>
            }
            data={yesNo}
            value={formData.paid || ""}
            placeholder="Select"
            onChange={(item) => handleChange("paid", item.value)}
          />
          <DropdownField
            label={
              <Text className="font-medium text-lg font-PoppinsBold">
                EC Format Preference <Text className="text-red-500">*</Text>
              </Text>
            }
            data={dropdowns.extracurricularFormat}
            value={formData.ecType || ""}
            placeholder="Select"
            onChange={(item) => handleChange("ecType", item.value)}
          />
          <DropdownField
            label={
              <Text className="font-medium text-lg font-PoppinsBold">
                Time per week for ECs <Text className="text-red-500">*</Text>
              </Text>
            }
            data={dropdowns.weeklyCommitment}
            value={formData.timeWeekly || ""}
            placeholder="Select"
            onChange={(item) => handleChange("timeWeekly", item.value)}
          />

          <CustomButton
            title="Next"
            onPress={async () => {
              await Haptics.selectionAsync();
              goToNextSlide();
            }}
            style={{ marginTop: 16, marginBottom: 16 }}
          />
        </SlideWrapper>

        {/* Slide 6 */}
        <SlideWrapper showBack onBack={handleBack}>
          <DropdownField
            label={
              <Text className="font-medium text-lg font-PoppinsBold">
                Interested in Travel/Study Abroad?{" "}
                <Text className="text-red-500">*</Text>
              </Text>
            }
            data={yesNo}
            value={formData.travel || ""}
            placeholder="Select"
            onChange={(item) => handleChange("travel", item.value)}
          />
          <DropdownField
            label={
              <Text className="font-medium text-lg font-PoppinsBold">
                Referral Source <Text className="text-red-500">*</Text>
              </Text>
            }
            data={dropdowns.referralSource}
            value={formData.source || ""}
            placeholder="Select"
            onChange={(item) => handleChange("source", item.value)}
          />
          <DropdownField
            label={
              <Text className="font-medium text-lg font-PoppinsBold">
                Used Other EC Apps? <Text className="text-red-500">*</Text>
              </Text>
            }
            data={yesNo}
            value={formData.usedOtherApps || ""}
            placeholder="Select"
            onChange={(item) => handleChange("usedOtherApps", item.value)}
          />
          <DropdownField
            label={
              <Text className="font-medium text-lg font-PoppinsBold">
                Do You Agree to{" "}
                <Text
                  onPress={async () =>
                    await WebBrowser.openBrowserAsync(
                      "https://ec-aiweb.vercel.app/terms-of-use",
                    )
                  }
                  style={{ color: "#5b55f7", textDecorationLine: "underline" }}
                >
                  the Terms
                </Text>
                {" & "}
                <Text
                  onPress={async () =>
                    await WebBrowser.openBrowserAsync(
                      "https://ec-aiweb.vercel.app/privacy-policy",
                    )
                  }
                  style={{ color: "#5b55f7", textDecorationLine: "underline" }}
                >
                  Privacy Policy
                </Text>
                ? <Text className="text-red-500">*</Text>
              </Text>
            }
            data={yesNo}
            value={formData.agreeTerms || ""}
            placeholder="Confirm"
            onChange={(item) => handleChange("agreeTerms", item.value)}
          />

          <CustomButton
            title="Submit"
            onPress={async () => {
              if (!validateSlide(step)) {
                Alert.alert(
                  "Incomplete",
                  "Please fill out all required fields on this page.",
                );
                return;
              }

              // Only show paywall if NOT in update mode
              if (update !== "true" && !isPremium && !hasShownPaywall) {
                const result = await RevenueCatUI.presentPaywallIfNeeded({
                  requiredEntitlementIdentifier: "premium",
                });

                setHasShownPaywall(true);

                if (
                  result === PAYWALL_RESULT.PURCHASED ||
                  result === PAYWALL_RESULT.RESTORED
                ) {
                  setIsPremium(true);
                  await handleSubmit();
                  await Haptics.notificationAsync(
                    Haptics.NotificationFeedbackType.Success,
                  );
                }

                return;
              }

              await handleSubmit();
              await Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Success,
              );
            }}
            style={{ marginTop: 16 }}
          />
        </SlideWrapper>
      </Swiper>
    </SafeAreaView>
  );
};

export default ProfileSetup;
