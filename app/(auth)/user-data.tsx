import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Text,
  View,
  Alert,
  ActivityIndicator,
  Image,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Swiper from "react-native-swiper";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useUser } from "@clerk/clerk-expo";
import * as ImagePicker from "expo-image-picker";

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
  careerInterest?: string;
  entrepreneur?: string;
  research?: string;
  ecReason?: string;
  ecLevel?: string;
  leadership?: string;
  createOwn?: string;
  selectivity?: string;
  paid?: string;
  travel?: string;
  timeWeekly?: string;
  ecType?: string;
  source?: string;
  usedOtherApps?: string;
  profilePic?: string;
  notifications?: string;
  agreeTerms?: string;
}

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
    <View className="bg-white px-4 py-6 rounded-lg shadow-md mb-16 pb-20">
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

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });
    if (!result.canceled) {
      handleChange("profilePic", result.assets[0].uri);
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
      <SafeAreaView className="flex-1 bg-primary-200 justify-center items-center">
        <ActivityIndicator size="large" color="#5b55f6" />
        <Text className="text-lg mt-2 text-gray-600 font-PoppinsRegular">
          Loading form...
        </Text>
      </SafeAreaView>
    );
  }

  const yesNo = dropdowns.yesNo;

  return (
    <SafeAreaView className="flex-1 bg-primary-200">
      <View className="px-4 pt-6 pb-2">
        <Text className="text-3xl font-bold text-gray-800 font-PoppinsBold">
          Profile Setup
        </Text>
        <Text className="text-base text-gray-600 font-PoppinsRegular">
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
        <SlideWrapper showBack={step > 0} onBack={handleBack}>
          <DropdownField
            label="Grade Level"
            data={dropdowns.grades}
            value={formData.gradeLevel || ""}
            placeholder="Select grade"
            onChange={(item) => handleChange("gradeLevel", item.value)}
          />
          <DropdownField
            label="Race/Ethnicity"
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
            onPress={() => swiperRef.current?.scrollBy(1)}
            className="mt-4 mb-4"
          />
        </SlideWrapper>

        <SlideWrapper showBack onBack={handleBack}>
          <DropdownField
            label="City & State"
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
            onPress={() => swiperRef.current?.scrollBy(1)}
            className="mt-4 mb-4"
          />
        </SlideWrapper>

        <SlideWrapper showBack onBack={handleBack}>
          <InputField
            label="SAT Score"
            keyboardType="numeric"
            placeholder="Enter SAT Score"
            value={formData.satScore}
            onChangeText={(val) => handleChange("satScore", val)}
          />
          <InputField
            label="ACT Score"
            keyboardType="numeric"
            placeholder="Enter ACT Score"
            value={formData.actScore}
            onChangeText={(val) => handleChange("actScore", val)}
          />
          <InputField
            label="PSAT Score"
            keyboardType="numeric"
            placeholder="Enter PSAT Score"
            value={formData.psatScore}
            onChangeText={(val) => handleChange("psatScore", val)}
          />
          <DropdownField
            label="Career Interest"
            data={dropdowns.careerInterest}
            value={formData.careerInterest || ""}
            placeholder="Select a career"
            onChange={(item) => handleChange("careerInterest", item.value)}
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
            onPress={() => swiperRef.current?.scrollBy(1)}
            className="mt-4 mb-4"
          />
        </SlideWrapper>

        <SlideWrapper showBack onBack={handleBack}>
          <DropdownField
            label="Interested in research?"
            data={yesNo}
            value={formData.research || ""}
            placeholder="Select"
            onChange={(item) => handleChange("research", item.value)}
          />
          <DropdownField
            label="Why ECs?"
            data={dropdowns.extracurricularReasons}
            value={formData.ecReason || ""}
            placeholder="Select"
            onChange={(item) => handleChange("ecReason", item.value)}
          />
          <DropdownField
            label="Level to reach in your field?"
            data={dropdowns.fieldLevel}
            value={formData.ecLevel || ""}
            placeholder="Select"
            onChange={(item) => handleChange("ecLevel", item.value)}
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
            onPress={() => swiperRef.current?.scrollBy(1)}
            className="mt-4 mb-4"
          />
        </SlideWrapper>

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
            onPress={() => swiperRef.current?.scrollBy(1)}
            className="mt-4 mb-4"
          />
        </SlideWrapper>

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
          <CustomButton
            title="Pick a Profile Picture"
            onPress={pickImage}
            className="mt-4 mb-4"
          />
          {formData.profilePic && (
            <Image
              source={{ uri: formData.profilePic }}
              style={{
                width: 75,
                height: 75,
                alignSelf: "center",
                marginVertical: 6,
              }}
            />
          )}
          <DropdownField
            label="Notifications?"
            data={yesNo}
            value={formData.notifications || ""}
            placeholder="Select"
            onChange={(item) => handleChange("notifications", item.value)}
          />
          <DropdownField
            label="Agree to Terms & Privacy Policy"
            data={yesNo}
            value={formData.agreeTerms || ""}
            placeholder="Confirm"
            onChange={(item) => handleChange("agreeTerms", item.value)}
          />
          <CustomButton
            title="Submit"
            onPress={handleSubmit}
            className="mt-4"
          />
        </SlideWrapper>
      </Swiper>
    </SafeAreaView>
  );
};

export default ProfileSetup;
