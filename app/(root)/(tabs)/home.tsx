import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { SignedIn, useUser } from "@clerk/clerk-expo";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "expo-router";
import ReactNativeModal from "react-native-modal";
import { FontAwesome } from "@expo/vector-icons"; // Import FontAwesome for trash icon

interface Opportunity {
  id: string;
  title: string;
  activityType: string;
  location: string;
  duration?: string;
  deadline?: string;
}

export default function Home() {
  const { user } = useUser();
  const activitiesThisWeek = 5;
  const totalHoursLogged = 40;
  const streak = 7;
  const recentActivities = [
    { name: "Volunteered at shelter", timestamp: "2 days ago" },
    { name: "Hackathon Participation", timestamp: "4 days ago" },
    { name: "Comp Sci Club Meeting", timestamp: "6 days ago" },
  ];
  const [savedOpportunities, setSavedOpportunities] = useState<Opportunity[]>(
    [],
  );
  const [modalVisible, setModalVisible] = useState(false);

  // Load opportunities from AsyncStorage
  const loadSavedOpportunities = async () => {
    try {
      const savedData = await AsyncStorage.getItem("savedOpportunities");
      if (savedData) {
        setSavedOpportunities(JSON.parse(savedData));
      } else {
        setSavedOpportunities([]);
      }
    } catch (error) {
      console.error("Error loading saved opportunities:", error);
    }
  };

  const [profileImage, setProfileImage] = useState<string | null>(null);

  useEffect(() => {
    const loadProfileImage = async () => {
      const storedImage = await AsyncStorage.getItem("profileImage");
      if (storedImage) {
        setProfileImage(storedImage);
      }
    };
    loadProfileImage();
  }, []);

  // Delete an opportunity
  const deleteOpportunity = async (id: string) => {
    const updatedOpportunities = savedOpportunities.filter(
      (opp) => opp.id !== id,
    );
    setSavedOpportunities(updatedOpportunities);
    await AsyncStorage.setItem(
      "savedOpportunities",
      JSON.stringify(updatedOpportunities),
    );
  };

  useFocusEffect(
    useCallback(() => {
      loadSavedOpportunities();
    }, []),
  );

  return (
    <SafeAreaView className="flex-1 bg-primary-200 px-4 py-6 font-PoppinsBlack">
      <SignedIn>
        <ScrollView>
          <View className="flex-row items-center mb-4">
            <Image
              source={
                profileImage ? { uri: profileImage } : { uri: user?.imageUrl }
              } // Use the URI for profile image or fallback
              className="w-16 h-16 rounded-full"
            />
            <View className="ml-4">
              <Text className="text-lg font-PoppinsSemiBold">
                Hello, {user?.fullName}!
              </Text>
              <Text className="text-gray-500 font-PoppinsRegular">
                Total Hours Logged: {totalHoursLogged}
              </Text>
            </View>
          </View>

          <View className="bg-general-400 p-6 rounded-lg mb-4 space-y-2">
            <Text className="text-xl text-white font-PoppinsSemiBold">
              Quick Stats
            </Text>
            <Text className="text-white text-base font-PoppinsSemiBold ">
              Activities this week:{" "}
              <Text className="font-normal">{activitiesThisWeek}</Text>
            </Text>
            <Text className="text-white text-base font-PoppinsSemiBold font-bold">
              Streak: <Text className="font-normal">{streak} days</Text>
            </Text>
          </View>

          <View className="bg-white p-6 rounded-xl shadow-lg mb-4">
            <Text className="text-xl font-PoppinsBold text-gray-900 mb-4">
              Recent Activities
            </Text>
            {recentActivities.map((activity, index) => (
              <View
                key={index}
                className="flex-row justify-between font-PoppinsRegular items-center py-3 border-b border-gray-200 last:border-b-0"
              >
                <Text className="text-base text-gray-800">{activity.name}</Text>
                <Text className="text-sm text-gray-500">
                  {activity.timestamp}
                </Text>
              </View>
            ))}
          </View>

          <View className="mb-4">
            <TouchableOpacity
              onPress={() => setModalVisible(true)}
              className="bg-general-400 p-3 rounded-lg mb-2"
            >
              <Text className="text-white font-PoppinsSemiBold text-base text-center">
                Saved Opportunities
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* MODAL */}
        <ReactNativeModal
          isVisible={modalVisible}
          style={{
            justifyContent: "flex-start",
            marginTop: 60,
            marginHorizontal: 10,
          }}
          onBackdropPress={() => setModalVisible(false)}
          onBackButtonPress={() => setModalVisible(false)}
        >
          <View className="bg-primary-200 px-7 py-9 rounded-2xl mb-16 shadow-md">
            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              style={{ position: "absolute", top: 20, right: 20, zIndex: 1 }}
            >
              <Text className="text-xl font-bold">×</Text>
            </TouchableOpacity>
            <Text className="text-3xl font-bold text-gray-800 font-PoppinsBold pb-2 text-center">
              Saved Opportunities
            </Text>

            {savedOpportunities.length > 0 ? (
              <FlatList
                data={savedOpportunities}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <View className="bg-white p-4 mb-3 rounded-lg flex-row justify-between items-center">
                    <View>
                      <Text className="text-lg font-PoppinsSemiBold text-gray-900">
                        {item.title}
                      </Text>
                      <Text className="text-sm text-gray-500">
                        {item.activityType} | {item.location}
                      </Text>
                      {item.duration && (
                        <Text className="text-sm text-gray-500">
                          Duration: {item.duration}
                        </Text>
                      )}
                      {item.deadline && (
                        <Text className="text-sm text-gray-500">
                          Deadline: {item.deadline}
                        </Text>
                      )}
                    </View>

                    <TouchableOpacity
                      onPress={() => deleteOpportunity(item.id)}
                    >
                      <FontAwesome name="trash" size={22} color="red" />
                    </TouchableOpacity>
                  </View>
                )}
              />
            ) : (
              <Text className="text-gray-500 text-base text-center">
                No saved opportunities yet.
              </Text>
            )}
          </View>
        </ReactNativeModal>
      </SignedIn>
    </SafeAreaView>
  );
}
