import { useUser, useClerk } from "@clerk/clerk-expo";
import { View, Text, Image, ScrollView, Switch } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import React, { useState } from "react";
import ReactNativeModal from "react-native-modal";
import * as Linking from "expo-linking";
import CustomButton from "@/components/CustomButton";

const Profile = () => {
  const { user } = useUser();
  const { signOut } = useClerk();

  const [darkMode, setDarkMode] = useState(false);
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
        <View className="items-center mb-6">
          <Image
            source={{ uri: user?.imageUrl }}
            className="w-24 h-24 rounded-full"
          />
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
            title="Privacy Preferences"
            onPress={() => {}}
            className="w-auto p-1 rounded-lg font-PoppinsRegular shadow-md"
          />
          <CustomButton
            title="Export Data (PDF/CSV)"
            onPress={() => {}}
            className="w-auto p-1 rounded-lg mt-2 font-PoppinsRegular shadow-md"
          />
        </View>

        {/* App Settings Section */}
        <View className="bg-white p-4 mb-4 rounded-lg shadow-md">
          <Text className="text-xl font-semibold mb-2 font-PoppinsBold">
            App Settings
          </Text>
          <View className="flex-row justify-between py-2 font-PoppinsRegular">
            <Text className="text-lg font-PoppinsSemiBold mb-2">
              AI Features
            </Text>
            <Switch value={darkMode} onValueChange={setDarkMode} />
          </View>
          <CustomButton
            title="Language Preferences"
            onPress={() => {}}
            className="w-auto p-1 rounded-lg font-PoppinsRegular shadow-md"
          />
        </View>

        {/* Help & Support Section */}
        <View className="bg-white p-4 mb-4 rounded-lg shadow-md">
          <Text className="text-xl font-semibold mb-3 font-PoppinsBold">
            Help & Support
          </Text>
          <CustomButton
            title="FAQs"
            onPress={() => {}}
            className="w-auto p-1 rounded-lg mb-2 font-PoppinsRegular shadow-md"
          />
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
