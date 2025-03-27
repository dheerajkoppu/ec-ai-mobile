import { useUser, useClerk } from "@clerk/clerk-expo";
import { useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  View,
  Text,
  Image,
  ScrollView,
  Switch,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import React, { useState } from "react";
import ReactNativeModal from "react-native-modal";
import * as Linking from "expo-linking";
import * as ImagePicker from "expo-image-picker";
import CustomButton from "@/components/CustomButton";
import { Ionicons } from "@expo/vector-icons";

const Profile = () => {
  const { user } = useUser();
  const { signOut } = useClerk();
  const [imageUri, setImageUri] = useState(user?.imageUrl);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  useEffect(() => {
    const loadImage = async () => {
      const storedImage = await AsyncStorage.getItem("profileImage");
      if (storedImage) {
        setImageUri(storedImage);
      } else {
        setImageUri(user?.imageUrl);
      }
    };
    loadImage();
  }, []);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      const newImageUri = result.assets[0].uri;
      setImageUri(newImageUri);
      await AsyncStorage.setItem("profileImage", newImageUri); // Save to AsyncStorage
    }
  };

  const [aiFeatures, setAIFeatures] = useState(false);
  const [notifications, setNotifications] = useState(true);

  // Modal visibility states for logout and delete account
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Local sign out function replicating SignOutButton logic
  const handleSignOut = async () => {
    try {
      await signOut();
      // Redirect to home page
      Linking.openURL(Linking.createURL("/"));
    } catch (err) {
      console.error(JSON.stringify(err, null, 2));
    }
  };

  const deleteAccount = async () => {
    if (!user?.primaryEmailAddress?.emailAddress) {
      console.log("Error", "User email is missing.");
      return;
    }
    try {
      const response = await fetch("/(api)/deleteuser", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userEmail: user.primaryEmailAddress.emailAddress,
        }), // Send email, not ID
      });

      if (response.ok) {
        await signOut(); // Sign out the user after successful deletion
        Linking.openURL(Linking.createURL("/"));
      } else {
        const error = await response.json();
        console.error("Failed to delete account:", error);
      }
    } catch (err) {
      console.error("Delete account error:", err);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-primary-200 px-4 py-6 pb-10">
      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Information */}
        <View className="items-center mb-6 relative">
          <View className="relative">
            <Image
              source={{ uri: imageUri }}
              className="w-24 h-24 rounded-full"
            />
            <TouchableOpacity
              onPress={pickImage}
              className="absolute bottom-0 right-0 bg-[#5b55f7] p-2 rounded-full shadow"
            >
              <Ionicons name="cloud-upload" size={18} color="white" />
            </TouchableOpacity>
          </View>
          <Text className="text-xl font-PoppinsSemiBold mt-2">
            {user?.fullName}
          </Text>
          <Text className="text-primary-900 text-base font-PoppinsRegular">
            {user?.primaryEmailAddress?.emailAddress}
          </Text>
        </View>

        {/* Customization Section */}
        <View className="bg-white p-4 mb-4 rounded-lg shadow-md">
          <Text className="text-xl font-semibold mb-2 font-PoppinsBold">
            Customization
          </Text>
          <CustomButton
            title="Extracurricular Preferences"
            onPress={() => {}}
            className="w-auto p-1 rounded-lg mb-2 font-PoppinsRegular shadow-md"
          />
        </View>

        {/* Account Settings Section */}
        <View className="bg-white p-4 mb-4 rounded-lg shadow-md">
          <Text className="text-xl font-semibold mb-2 font-PoppinsBold">
            Account Settings
          </Text>
          <View className="flex-row justify-between py-2 font-PoppinsRegular">
            <Text className="text-lg font-PoppinsSemiBold mb-2">
              Notifications
            </Text>
            <Switch value={notifications} onValueChange={setNotifications} />
          </View>
          <CustomButton
            title="Privacy Policy"
            onPress={() => setPrivacyOpen(true)}
            className="w-auto p-2 rounded-lg font-PoppinsRegular shadow-md"
          />

          <CustomButton
            title="Export Data (PDF/CSV)"
            onPress={() => {}}
            className="w-auto p-1 rounded-lg mt-2 font-PoppinsRegular shadow-md"
          />
        </View>

        {/* App Settings Section */}
        <View className="bg-white p-4 mb-4 rounded-lg shadow-md flex-row justify-between">
          <Text className="text-xl font-semibold mb-2 font-PoppinsBold">
            AI Features
          </Text>
          <Switch value={aiFeatures} onValueChange={setAIFeatures} />
        </View>

        {/* Help & Support Section */}
        <View className="bg-white p-4 mb-4 rounded-lg shadow-md">
          <Text className="text-xl font-semibold mb-3 font-PoppinsBold">
            Help & Support
          </Text>

          <CustomButton
            title="Contact Support"
            onPress={() =>
              Linking.openURL(
                "mailto:ask.ecai@gmail.com?subject=Support%20Inquiry&body=Enter%20your%20inquiry...",
              )
            }
            className="w-auto p-1 rounded-lg mb-2 font-PoppinsRegular shadow-md"
          />
          <CustomButton
            title="Submit Feedback"
            onPress={() =>
              Linking.openURL(
                "mailto:ask.ecai@gmail.com?subject=Feedback&body=Enter%20your%20feedback...",
              )
            }
            className="w-auto p-1 rounded-lg font-PoppinsRegular shadow-md"
          />
        </View>

        {/* Log Out and Delete Account Section */}
        <View className="bg-white p-4 mb-4 rounded-lg shadow-md">
          <CustomButton
            title="Log Out"
            onPress={() => setShowSignOutModal(true)}
            bgVariant="danger"
            className="mb-4 shadow-md"
          />
          <CustomButton
            title="Delete Account"
            onPress={() => setShowDeleteModal(true)}
            className="shadow-md"
          />
        </View>
      </ScrollView>

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
        <ScrollView>
          <View className="bg-primary-200 px-4 py-9 rounded-2xl mb-20 shadow-md">
            <TouchableOpacity
              onPress={() => setPrivacyOpen(false)}
              style={{ position: "absolute", top: 20, right: 20, zIndex: 1 }}
            >
              <Text className="text-xl font-bold">×</Text>
            </TouchableOpacity>
            <Text className="text-3xl font-bold text-primary-800 font-PoppinsBold pb-2 text-center">
              Privacy Policy
            </Text>
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
          </View>
        </ScrollView>
      </ReactNativeModal>
      {/* Sign Out Confirmation Modal */}
      <ReactNativeModal isVisible={showSignOutModal}>
        <View className="bg-white px-7 py-9 rounded-2xl">
          <Text className="text-xl font-PoppinsSemiBold text-center mb-4">
            Confirm Logout
          </Text>
          <Text className="text-base font-PoppinsSemiBold text-center mb-6">
            Are you sure you want to log out?
          </Text>
          <View className="flex-row justify-between">
            <CustomButton
              title="Cancel"
              onPress={() => setShowSignOutModal(false)}
              className="w-1/2 p-2 rounded-lg mr-2 font-PoppinsRegular shadow-md"
            />
            <CustomButton
              title="Logout"
              onPress={async () => {
                setShowSignOutModal(false);
                await handleSignOut();
              }}
              bgVariant="danger"
              className="w-1/2 p-2 rounded-lg ml-2 font-PoppinsRegular shadow-md"
            />
          </View>
        </View>
      </ReactNativeModal>

      {/* Delete Account Confirmation Modal */}
      <ReactNativeModal isVisible={showDeleteModal}>
        <View className="bg-white px-7 py-9 rounded-2xl">
          <Text className="text-xl font-PoppinsSemiBold text-center mb-4">
            Confirm Delete Account
          </Text>
          <Text className="text-base font-PoppinsSemiBold text-center mb-6">
            Are you sure you want to delete your account? This action cannot be
            undone.
          </Text>
          <View className="flex-row justify-between">
            <CustomButton
              title="Cancel"
              onPress={() => setShowDeleteModal(false)}
              className="w-1/2 p-2 rounded-lg mr-2 font-PoppinsRegular shadow-md"
            />
            <CustomButton
              title="Delete"
              onPress={() => {
                setShowDeleteModal(false);
                deleteAccount();
              }}
              bgVariant="danger"
              className="w-1/2 p-2 rounded-lg ml-2 font-PoppinsRegular shadow-md"
            />
          </View>
        </View>
      </ReactNativeModal>
    </SafeAreaView>
  );
};

export default Profile;
