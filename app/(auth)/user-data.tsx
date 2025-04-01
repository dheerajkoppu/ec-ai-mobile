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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Swiper from "react-native-swiper";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useUser } from "@clerk/clerk-expo";

import InputField from "@/components/InputField";
import DropdownField from "@/components/DropdownField";
import CustomButton from "@/components/CustomButton";
import { fetchAPI } from "@/lib/fetch";
import { router } from "expo-router";

interface DropdownOption {
  label: string;
  value: string;
}

interface IDropdowns {
  yesNo: DropdownOption[];
  grades: DropdownOption[];
  raceEthnicity: DropdownOption[];
  schoolName: DropdownOption[];
  gender: DropdownOption[];
  cities: DropdownOption[];
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
  schoolName?: string;
  gender?: string;
  age?: string;
  location?: string;
  lunch?: string;
  firstGen?: string;
  gpaWeighted?: string;
  gpaUnweighted?: string;
  satScore?: string;
  actScore?: string;
  psatScore?: string;
  // Changed to array for multi-select
  careerInterest?: string[];
  entrepreneur?: string;
  research?: string;
  // Changed to array for multi-select
  ecReason?: string[];
  // Changed to array for multi-select
  ecLevel?: string[];
  leadership?: string;
  createOwn?: string;
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
        style={[styles.option, isSelected && styles.selectedOption]}
        onPress={() => toggleOption(item.value)}
      >
        <Text style={styles.optionText}>{item.label}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View>
      <TouchableOpacity
        style={styles.dropdownButton}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.dropdownButtonText}>
          {selectedValues.length
            ? options
                .filter((o) => selectedValues.includes(o.value))
                .map((o) => o.label)
                .join(", ")
            : placeholder}
        </Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide">
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Select Options</Text>
          <FlatList
            data={options}
            keyExtractor={(item) => item.value}
            renderItem={renderOption}
          />
          <TouchableOpacity
            style={styles.doneButton}
            onPress={() => setModalVisible(false)}
          >
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
};

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

// SlideWrapper component to wrap each slide in the form
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
        padding: 16,
        borderRadius: 8,
        shadowColor: "#000",
        marginBottom: 16,
        paddingBottom: 20,
      }}
    >
      {showBack && (
        <TouchableOpacity
          onPress={onBack}
          style={{ position: "absolute", top: 10, left: 10, zIndex: 10 }}
        >
          <Text>{"< Back"}</Text>
        </TouchableOpacity>
      )}
      {children}
    </View>
  </KeyboardAwareScrollView>
);

const ProfileSetup: React.FC = () => {
  const { user } = useUser();
  const [formData, setFormData] = useState<IFormData>({});
  const swiperRef = useRef<Swiper | null>(null);
  const [dropdowns, setDropdowns] = useState<IDropdowns | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(0);

  const handleChange = useCallback((key: keyof IFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  }, []);

  // Handler for multi-select fields
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
      const response = await fetchAPI("/(api)/userdata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      console.log("API result:", response);
      if (response.ok) {
        router.push("/(root)/(tabs)/home");
      } else {
        router.push("/(root)/(tabs)/home");
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
        // Slide 1: Grade Level, Race/Ethnicity, School Name, Gender, Age
        return !!(
          formData.gradeLevel?.trim() &&
          formData.race?.trim() &&
          formData.schoolName?.trim() &&
          formData.gender?.trim() &&
          formData.age?.trim()
        );
      case 1:
        // Slide 2: City, Lunch, First-Gen, Weighted GPA, Unweighted GPA
        return !!(
          formData.location?.trim() &&
          formData.lunch?.trim() &&
          formData.firstGen?.trim() &&
          formData.gpaWeighted?.trim() &&
          formData.gpaUnweighted?.trim()
        );
      case 2:
        // Slide 3: SAT, ACT, PSAT, Career Interest (multi-select), Entrepreneur
        return !!(
          formData.satScore?.trim() &&
          formData.actScore?.trim() &&
          formData.psatScore?.trim() &&
          formData.careerInterest &&
          formData.careerInterest.length > 0 &&
          formData.entrepreneur?.trim()
        );
      case 3:
        // Slide 4: Research, EC Goals (multi-select), Field Level (multi-select), Leadership, Create Own
        return !!(
          formData.research?.trim() &&
          formData.ecReason &&
          formData.ecReason.length > 0 &&
          formData.ecLevel &&
          formData.ecLevel.length > 0 &&
          formData.leadership?.trim() &&
          formData.createOwn?.trim()
        );
      case 4:
        // Slide 5: Opportunity Selectiveness, Paid, Travel, Weekly Commitment, EC Format
        return !!(
          formData.selectivity?.trim() &&
          formData.paid?.trim() &&
          formData.travel?.trim() &&
          formData.timeWeekly?.trim() &&
          formData.ecType?.trim()
        );
      case 5:
        // Slide 6: Referral Source, Used Other Apps, Notifications, Agree Terms
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
        const result = await fetchAPI("/(api)/fetchdropdowns", {
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
            label="Grade Level"
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
            label="School Name"
            data={dropdowns.schoolName}
            value={formData.schoolName || ""}
            placeholder="Select school"
            onChange={(item) => handleChange("schoolName", item.value)}
          />
          <DropdownField
            label="Gender"
            data={dropdowns.gender}
            value={formData.gender || ""}
            placeholder="Select gender"
            onChange={(item) => handleChange("gender", item.value)}
          />
          <InputField
            label="Age"
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
            label="City"
            data={dropdowns.cities}
            value={formData.location || ""}
            placeholder="Select location"
            onChange={(item) => handleChange("location", item.value)}
          />
          <DropdownField
            label="Free/Reduced Lunch?"
            data={yesNo}
            value={formData.lunch || ""}
            placeholder="Select"
            onChange={(item) => handleChange("lunch", item.value)}
          />
          <DropdownField
            label="First-gen Student?"
            data={yesNo}
            value={formData.firstGen || ""}
            placeholder="Select"
            onChange={(item) => handleChange("firstGen", item.value)}
          />
          <InputField
            label="Weighted GPA"
            keyboardType="numeric"
            placeholder="Enter weighted GPA"
            value={formData.gpaWeighted}
            onChangeText={(val) => handleChange("gpaWeighted", val)}
          />
          <InputField
            label="Unweighted GPA"
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
            label="SAT Score"
            data={dropdowns.satRange}
            value={formData.satScore || ""}
            placeholder="Select SAT range"
            onChange={(item) => handleChange("satScore", item.value)}
          />
          <DropdownField
            label="ACT Score"
            data={dropdowns.actRange}
            value={formData.actScore || ""}
            placeholder="Select ACT range"
            onChange={(item) => handleChange("actScore", item.value)}
          />
          <DropdownField
            label="PSAT Score"
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
            Career Interest
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
            label="Want to start a business or nonprofit?"
            data={yesNo}
            value={formData.entrepreneur || ""}
            placeholder="Select"
            onChange={(item) => handleChange("entrepreneur", item.value)}
          />
          <CustomButton
            title="Next"
            onPress={goToNextSlide}
            style={{ marginTop: 16, marginBottom: 16 }}
          />
        </SlideWrapper>

        {/* Slide 4 */}
        <SlideWrapper showBack onBack={handleBack}>
          <DropdownField
            label="Interested in research?"
            data={yesNo}
            value={formData.research || ""}
            placeholder="Select"
            onChange={(item) => handleChange("research", item.value)}
          />
          <Text
            style={{
              fontSize: 18,
              fontFamily: "Poppins-Bold",
              marginBottom: 5,
              color: "#333",
            }}
          >
            EC Goals?
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
              marginBottom: 5,
              color: "#333",
            }}
          >
            Level to reach in your field?
          </Text>
          <MultiSelectDropdown
            options={dropdowns.fieldLevel}
            selectedValues={formData.ecLevel || []}
            onChange={(values) => handleMultiSelectChange("ecLevel", values)}
            placeholder="Select levels"
          />
          <DropdownField
            label="Looking for leadership?"
            data={yesNo}
            value={formData.leadership || ""}
            placeholder="Select"
            onChange={(item) => handleChange("leadership", item.value)}
          />
          <DropdownField
            label="Open to starting your own club/project?"
            data={yesNo}
            value={formData.createOwn || ""}
            placeholder="Select"
            onChange={(item) => handleChange("createOwn", item.value)}
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
            label="Opportunity Selectiveness"
            data={dropdowns.opportunitySelectivity}
            value={formData.selectivity || ""}
            placeholder="Select"
            onChange={(item) => handleChange("selectivity", item.value)}
          />
          <DropdownField
            label="Interested in Paid Opportunities?"
            data={yesNo}
            value={formData.paid || ""}
            placeholder="Select"
            onChange={(item) => handleChange("paid", item.value)}
          />
          <DropdownField
            label="Interested in Travel/Study Abroad?"
            data={yesNo}
            value={formData.travel || ""}
            placeholder="Select"
            onChange={(item) => handleChange("travel", item.value)}
          />
          <DropdownField
            label="Time per Week for ECs"
            data={dropdowns.weeklyCommitment}
            value={formData.timeWeekly || ""}
            placeholder="Select"
            onChange={(item) => handleChange("timeWeekly", item.value)}
          />
          <DropdownField
            label="EC Format Preference"
            data={dropdowns.extracurricularFormat}
            value={formData.ecType || ""}
            placeholder="Select"
            onChange={(item) => handleChange("ecType", item.value)}
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
            label="Referral Source"
            data={dropdowns.referralSource}
            value={formData.source || ""}
            placeholder="Select"
            onChange={(item) => handleChange("source", item.value)}
          />
          <DropdownField
            label="Used Other EC Apps?"
            data={yesNo}
            value={formData.usedOtherApps || ""}
            placeholder="Select"
            onChange={(item) => handleChange("usedOtherApps", item.value)}
          />
          <DropdownField
            label="Notifications?"
            data={yesNo}
            value={formData.notifications || ""}
            placeholder="Select"
            onChange={(item) => handleChange("notifications", item.value)}
          />
          <DropdownField
            label="Agree to Terms & Privacy Policy & Under 18"
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
    </SafeAreaView>
  );
};

export default ProfileSetup;
