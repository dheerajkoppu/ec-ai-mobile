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
import ReactNativeModal from "react-native-modal";
import RevenueCatUI, { PAYWALL_RESULT } from "react-native-purchases-ui";
import Purchases from "react-native-purchases";

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
  notifications?: string;
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
    backgroundColor: "#f5f7fa",
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

const styles = StyleSheet.create({
  dropdownButton: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    borderRadius: 5,
  },
  dropdownButtonText: {
    fontSize: 16,
    color: "#333",
  },
  modalContainer: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  modalTitle: {
    fontSize: 20,
    marginBottom: 20,
  },
  option: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  selectedOption: {
    backgroundColor: "#ddd",
  },
  optionText: {
    fontSize: 16,
  },
  doneButton: {
    marginTop: 20,
    padding: 10,
    alignSelf: "center",
  },
  doneButtonText: {
    fontSize: 18,
    color: "blue",
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
          <Text style={{ fontSize: 16, color: "white", fontWeight: "600" }}>
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
  const { update } = useLocalSearchParams<{ update?: string }>();
  const [formData, setFormData] = useState<IFormData>({});
  const swiperRef = useRef<Swiper | null>(null);
  const [dropdowns, setDropdowns] = useState<IDropdowns | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(0);
  const [privacyOpen, setPrivacyOpen] = useState(false);

  const handleChange = useCallback((key: keyof IFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  }, []);

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
              notifications: userData.wants_notifications ? "Yes" : "No",
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
        router.push("/(root)/(tabs)/opportunity_match");
      } else {
        router.push("/(root)/(tabs)/opportunity_match");
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
          formData.gpaUnweighted?.trim() &&
          formData.satScore?.trim() &&
          formData.actScore?.trim()
        );
      case 2:
        return !!(
          formData.psatScore?.trim() &&
          formData.careerInterest?.length &&
          formData.entrepreneur?.trim() &&
          formData.research?.trim()
        );
      case 3:
        return !!(
          formData.ecReason?.length &&
          formData.ecLevel?.length &&
          formData.leadership?.trim() &&
          formData.selectivity?.trim()
        );
      case 4:
        return !!(
          formData.paid?.trim() &&
          formData.ecType?.trim() &&
          formData.timeWeekly?.trim() &&
          formData.travel?.trim()
        );
      case 5:
        return !!(
          formData.source?.trim() &&
          formData.usedOtherApps?.trim() &&
          formData.notifications?.trim() &&
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
        console.log("dropdowns payload:", result);

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
            onPress={goToNextSlide}
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

          <CustomButton
            title="Next"
            onPress={goToNextSlide}
            style={{ marginTop: 16, marginBottom: 16 }}
          />
        </SlideWrapper>

        {/* Slide 3 */}
        <SlideWrapper showBack onBack={handleBack}>
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
            onPress={goToNextSlide}
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
                Opportunity Selectiveness{" "}
                <Text className="text-red-500">*</Text>
              </Text>
            }
            data={dropdowns.opportunitySelectivity}
            value={formData.selectivity || ""}
            placeholder="Select"
            onChange={(item) => handleChange("selectivity", item.value)}
          />
          <CustomButton
            title="Next"
            onPress={goToNextSlide}
            style={{ marginTop: 16, marginBottom: 16 }}
          />
        </SlideWrapper>

        {/* Slide 5 */}
        <SlideWrapper showBack onBack={handleBack}>
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
          <CustomButton
            title="Next"
            onPress={goToNextSlide}
            style={{ marginTop: 16, marginBottom: 16 }}
          />
        </SlideWrapper>

        {/* Slide 6 */}
        <SlideWrapper showBack onBack={handleBack}>
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
                Notifications? <Text className="text-red-500">*</Text>
              </Text>
            }
            data={yesNo}
            value={formData.notifications || ""}
            placeholder="Select"
            onChange={(item) => handleChange("notifications", item.value)}
          />
          <DropdownField
            label={
              <Text className="font-medium text-lg font-PoppinsBold">
                Do You Agree to{" "}
                <Text
                  onPress={() => setPrivacyOpen(true)}
                  className="font-medium text-lg font-PoppinsBold text-primary-500"
                >
                  The Terms & Privacy Policy?
                </Text>{" "}
                <Text className="text-red-500">*</Text>
              </Text>
            }
            data={yesNo}
            value={formData.agreeTerms || ""}
            placeholder="Confirm"
            onChange={(item) => handleChange("agreeTerms", item.value)}
          />
          <CustomButton
            title="Submit"
            onPress={() => {
              if (validateSlide(step)) {
                handleSubmit();
              } else {
                Alert.alert(
                  "Incomplete",
                  "Please fill out all required fields on this page.",
                );
              }
            }}
            style={{ marginTop: 16 }}
          />
        </SlideWrapper>
      </Swiper>

      <ReactNativeModal
        isVisible={privacyOpen}
        style={{
          justifyContent: "flex-start",
          marginTop: 60,
          marginHorizontal: 10,
          marginBottom: 30,
        }}
        onBackdropPress={() => setPrivacyOpen(false)}
        onBackButtonPress={() => setPrivacyOpen(false)}
      >
        <View className="bg-primary-200 px-4 py-6 rounded-2xl mb-20 shadow-md max-h-[90vh]">
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-2xl font-bold text-primary-800 font-PoppinsBold text-center flex-1">
              Privacy Policy
            </Text>
            <TouchableOpacity onPress={() => setPrivacyOpen(false)}>
              <Text className="text-3xl font-bold text-primary-800 px-2">
                ×
              </Text>
            </TouchableOpacity>
          </View>
          <ScrollView className="max-h-[80vh]">
            <View className="bg-white p-4 mb-3 rounded-lg">
              <Text className="text-xl font-medium text-primary-800 font-PoppinsSemiBold pb-1 text-left">
                1. Privacy and Data Protection Rules
              </Text>

              <Text className="text-xs font-medium text-primary-800 font-PoppinsSemiBold pb-1 text-left">
                Data Collection Transparency:
              </Text>
              <Text className="text-xs font-light text-primary-800 font-PoppinsLight pb-1 text-left">
                Clearly inform users about the data being collected (e.g.,
                academic information, extracurricular participation, personal
                preferences) and how it will be used.
              </Text>
              <Text className="text-xs font-medium text-primary-800 font-PoppinsSemiBold pb-1 text-left">
                Data Protection:
              </Text>
              <Text className="text-xs font-light text-primary-800 font-PoppinsLight pb-1 text-left">
                Ensure all personal and academic data is securely stored using
                encryption and comply with COPPA.
              </Text>
              <Text className="text-xs font-medium text-primary-800 font-PoppinsSemiBold pb-1 text-left">
                Consent:
              </Text>
              <Text className="text-xs font-light text-primary-800 font-PoppinsLight pb-1 text-left">
                Obtain explicit consent from users (or their guardians, for
                underage users) for collecting and using their data.
              </Text>
              <Text className="text-xs font-medium text-primary-800 font-PoppinsSemiBold pb-1 text-left">
                Right to Delete Data:
              </Text>
              <Text className="text-xs font-light text-primary-800 font-PoppinsLight pb-1 text-left">
                Allow users to delete their account and all associated data at
                any time.
              </Text>
              <Text className="text-xs font-medium text-primary-800 font-PoppinsSemiBold pb-1 text-left">
                Anonymity and Privacy:
              </Text>
              <Text className="text-xs font-light text-primary-800 font-PoppinsLight pb-1.5 text-left">
                Ensure that personal data is not shared with third parties
                without explicit consent from the user.
              </Text>

              <Text className="text-xl font-medium text-primary-800 font-PoppinsSemiBold pb-1 text-left">
                2. User-Generated Content Rules
              </Text>

              <Text className="text-xs font-medium text-primary-800 font-PoppinsSemiBold pb-1 text-left">
                Content Moderation:
              </Text>
              <Text className="text-xs font-light text-primary-800 font-PoppinsLight pb-1 text-left">
                Monitor and moderate user-generated content (like feedback,
                reviews, and posts) to ensure it adheres to community guidelines
                and does not contain inappropriate or offensive material.
              </Text>
              <Text className="text-xs font-medium text-primary-800 font-PoppinsSemiBold pb-1 text-left">
                Reporting System:
              </Text>
              <Text className="text-xs font-light text-primary-800 font-PoppinsLight pb-1 text-left">
                Provide an easy way for users to report inappropriate content or
                behavior within the app.
              </Text>
              <Text className="text-xs font-medium text-primary-800 font-PoppinsSemiBold pb-1 text-left">
                Respectful Communication:
              </Text>
              <Text className="text-xs font-light text-primary-800 font-PoppinsLight pb-1 text-left">
                Encourage users to communicate respectfully and constructively,
                especially if interacting with others about extracurricular
                activities or feedback on events.
              </Text>

              <Text className="text-xl font-medium text-primary-800 font-PoppinsSemiBold pb-1 text-left">
                3. Account and Profile Management
              </Text>

              <Text className="text-xs font-medium text-primary-800 font-PoppinsSemiBold pb-1 text-left">
                Age Restrictions:
              </Text>
              <Text className="text-xs font-light text-primary-800 font-PoppinsLight pb-1 text-left">
                Ensure users meet the minimum age requirement (13 or older,
                depending on jurisdiction). For users under 18, parental consent
                should be obtained.
              </Text>
              <Text className="text-xs font-medium text-primary-800 font-PoppinsSemiBold pb-1 text-left">
                Profile Accuracy:
              </Text>
              <Text className="text-xs font-light text-primary-800 font-PoppinsLight pb-1 text-left">
                Encourage users to provide accurate information about their
                extracurricular preferences, academic achievements, and goals
                for the best experience.
              </Text>
              <Text className="text-xs font-medium text-primary-800 font-PoppinsSemiBold pb-1 text-left">
                Password Security:
              </Text>
              <Text className="text-xs font-light text-primary-800 font-PoppinsLight pb-1 text-left">
                Implement secure login methods (e.g., two-factor authentication)
                to prevent unauthorized access to users' accounts.
              </Text>

              <Text className="text-xl font-medium text-primary-800 font-PoppinsSemiBold pb-1 text-left">
                4. Recommendation System and AI Guidelines
              </Text>

              <Text className="text-xs font-medium text-primary-800 font-PoppinsSemiBold pb-1 text-left">
                Transparency of AI:
              </Text>
              <Text className="text-xs font-light text-primary-800 font-PoppinsLight pb-1 text-left">
                Make it clear to users that the app’s recommendations are
                AI-generated, and explain how the algorithm works (e.g., based
                on academic performance, extracurricular history, goals).
              </Text>
              <Text className="text-xs font-medium text-primary-800 font-PoppinsSemiBold pb-1 text-left">
                Opt-in/Opt-out for Recommendations:
              </Text>
              <Text className="text-xs font-light text-primary-800 font-PoppinsLight pb-1 text-left">
                Allow users to choose whether they want to receive AI-generated
                recommendations for extracurricular activities.
              </Text>
              <Text className="text-xs font-medium text-primary-800 font-PoppinsSemiBold pb-1 text-left">
                Non-bias:
              </Text>
              <Text className="text-xs font-light text-primary-800 font-PoppinsLight pb-1 text-left">
                Ensure the AI is free from biases that might unfairly prioritize
                certain extracurricular activities or demographics over others.
              </Text>
              <Text className="text-xs font-medium text-primary-800 font-PoppinsSemiBold pb-1 text-left">
                Informed Recommendations:
              </Text>
              <Text className="text-xs font-light text-primary-800 font-PoppinsLight pb-1 text-left">
                Ensure the recommendations are aligned with the user’s
                interests, goals, and past activity participation.
              </Text>

              <Text className="text-xl font-medium text-primary-800 font-PoppinsSemiBold pb-1 text-left">
                5. Content and Activity Guidelines
              </Text>

              <Text className="text-xs font-medium text-primary-800 font-PoppinsSemiBold pb-1 text-left">
                Content Relevance:
              </Text>
              <Text className="text-xs font-light text-primary-800 font-PoppinsLight pb-1 text-left">
                Activities and events featured on the app should be relevant to
                the user’s interests, age group, and location to avoid
                overwhelming them.
              </Text>
              <Text className="text-xs font-medium text-primary-800 font-PoppinsSemiBold pb-1 text-left">
                Activity Accuracy:
              </Text>
              <Text className="text-xs font-light text-primary-800 font-PoppinsLight pb-1 text-left">
                Ensure that all extracurricular activities listed are accurate,
                up-to-date, and aligned with the user’s goals.
              </Text>
              <Text className="text-xs font-medium text-primary-800 font-PoppinsSemiBold pb-1 text-left">
                Notifications and Reminders:
              </Text>
              <Text className="text-xs font-light text-primary-800 font-PoppinsLight pb-1.5 text-left">
                Provide timely and relevant notifications regarding upcoming
                deadlines for extracurricular opportunities, ensuring they are
                not overly frequent or annoying.
              </Text>

              <Text className="text-xl font-medium text-primary-800 font-PoppinsSemiBold pb-1 text-left">
                6. Terms of Use and User Conduct
              </Text>

              <Text className="text-xs font-medium text-primary-800 font-PoppinsSemiBold pb-1 text-left">
                Terms and Conditions:
              </Text>
              <Text className="text-xs font-light text-primary-800 font-PoppinsLight pb-1 text-left">
                Ensure users agree to a comprehensive set of terms and
                conditions outlining the app's usage rules, privacy policy, and
                data collection practices.
              </Text>
              <Text className="text-xs font-medium text-primary-800 font-PoppinsSemiBold pb-1 text-left">
                Fair Use of the Platform:
              </Text>
              <Text className="text-xs font-light text-primary-800 font-PoppinsLight pb-1 text-left">
                Prohibit the misuse of the app, such as spamming, harassment, or
                using the platform to promote unrelated services or products.
              </Text>

              <Text className="text-xl font-medium text-primary-800 font-PoppinsSemiBold pb-1 text-left">
                7. Security Rules
              </Text>

              <Text className="text-xs font-medium text-primary-800 font-PoppinsSemiBold pb-1 text-left">
                Secure Communication:
              </Text>
              <Text className="text-xs font-light text-primary-800 font-PoppinsLight pb-1 text-left">
                Ensure that all communication between users and the app (e.g.,
                messages, recommendations) is encrypted to protect personal
                data.
              </Text>
              <Text className="text-xs font-medium text-primary-800 font-PoppinsSemiBold pb-1 text-left">
                Security Breach Protocol:
              </Text>
              <Text className="text-xs font-light text-primary-800 font-PoppinsLight pb-1 text-left">
                Implement a clear protocol for responding to security breaches,
                including notifying users if their data is compromised.
              </Text>
              <Text className="text-xs font-medium text-primary-800 font-PoppinsSemiBold pb-1 text-left">
                Regular Audits:
              </Text>
              <Text className="text-xs font-light text-primary-800 font-PoppinsLight pb-1 text-left">
                Conduct regular security audits and updates to ensure the app
                remains secure and free from vulnerabilities.
              </Text>

              <Text className="text-xl font-medium text-primary-800 font-PoppinsSemiBold pb-1 text-left">
                8. User Support and Feedback
              </Text>

              <Text className="text-xs font-medium text-primary-800 font-PoppinsSemiBold pb-1 text-left">
                Customer Support:
              </Text>
              <Text className="text-xs font-light text-primary-800 font-PoppinsLight pb-1 text-left">
                Provide users with access to customer support to resolve issues
                related to the app’s functionality or privacy concerns.
              </Text>
              <Text className="text-xs font-medium text-primary-800 font-PoppinsSemiBold pb-1 text-left">
                Feedback Mechanism:
              </Text>
              <Text className="text-xs font-light text-primary-800 font-PoppinsLight pb-1 text-left">
                Allow users to provide feedback on the app’s features, recommend
                new activities, and suggest improvements.
              </Text>

              <Text className="text-xl font-medium text-primary-800 font-PoppinsSemiBold pb-1 text-left">
                9. Advertising and Sponsorship Guidelines
              </Text>

              <Text className="text-xs font-medium text-primary-800 font-PoppinsSemiBold pb-1 text-left">
                Clear Labeling of Sponsored Content:
              </Text>
              <Text className="text-xs font-light text-primary-800 font-PoppinsLight pb-1 text-left">
                Clearly differentiate between organic content and sponsored or
                promotional activities, such as advertisements for specific
                extracurriculars or programs.
              </Text>
              <Text className="text-xs font-medium text-primary-800 font-PoppinsSemiBold pb-1 text-left">
                Ethical Advertising:
              </Text>
              <Text className="text-xs font-light text-primary-800 font-PoppinsLight pb-1 text-left">
                Ensure that any advertisements or sponsorships are
                age-appropriate and do not exploit students' insecurities or
                promote harmful content.
              </Text>

              <Text className="text-xl font-medium text-primary-800 font-PoppinsSemiBold pb-1 text-left">
                10. In-app Purchases or Monetization
              </Text>

              <Text className="text-xs font-medium text-primary-800 font-PoppinsSemiBold pb-1 text-left">
                Transparency in Pricing:
              </Text>
              <Text className="text-xs font-light text-primary-800 font-PoppinsLight pb-1 text-left">
                Ensure that all prices and fees are clearly outlined before
                users make a purchase.
              </Text>
              <Text className="text-xs font-medium text-primary-800 font-PoppinsSemiBold pb-1 text-left">
                No Forced Purchases:
              </Text>
              <Text className="text-xs font-light text-primary-800 font-PoppinsLight pb-1.5 text-left">
                Ensure that users can access the core features of the app
                without being required to make purchases, ensuring the app
                remains usable for everyone, regardless of budget.
              </Text>
            </View>
          </ScrollView>
        </View>
      </ReactNativeModal>
    </SafeAreaView>
  );
};

export default ProfileSetup;
