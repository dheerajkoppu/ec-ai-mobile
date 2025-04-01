import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Linking,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { SignedIn, useUser } from "@clerk/clerk-expo";
import { useFocusEffect } from "expo-router";
import ReactNativeModal from "react-native-modal";
import { FontAwesome, MaterialCommunityIcons } from "@expo/vector-icons";

interface Opportunity {
  id: string;
  title: string;
  activityType: string;
  location: string;
  duration?: string;
  deadline?: string;
  apply: string;
}

export default function Home() {
  const { user } = useUser();
  const [recentActivities, setRecentActivities] = useState<
    { name: string; timestamp: string }[]
  >([]);
  const [totalHoursLogged, setTotalHoursLogged] = useState(0);
  const [savedOpportunities, setSavedOpportunities] = useState<Opportunity[]>(
    [],
  );
  const [modalVisible, setModalVisible] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch saved opportunities from API using the user's clerk_id
  const loadSavedOpportunities = async () => {
    if (!user) return;
    try {
      const res = await fetch("/(api)/getsavedopportunities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clerk_id: user.id }),
      });
      const json = await res.json();
      if (res.ok) {
        // Map API response: activityName -> title, applicationLink -> apply
        const mapped = json.data.map((item: any) => ({
          id: item.id,
          title: item.activityName || "No Title",
          activityType: item.activityType,
          location: item.location,
          duration: item.duration,
          deadline: item.deadline
            ? new Date(item.deadline).toISOString().split("T")[0]
            : undefined,
          apply: item.applicationLink,
        }));
        setSavedOpportunities(mapped);
      } else {
        console.error("Error fetching saved opportunities:", json.error);
        setSavedOpportunities([]);
      }
    } catch (error) {
      console.error("Error loading saved opportunities:", error);
      setSavedOpportunities([]);
    }
  };

  const fetchRecentActivities = async () => {
    try {
      const res = await fetch("/(api)/getloggedhours", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user?.id }),
      });
      const json = await res.json();
      if (res.ok) {
        const formatted = json.data.map((item: any) => ({
          name: item.description || "No description",
          timestamp: formatDateDifference(new Date(item.date_of_activity)),
        }));
        setRecentActivities(formatted);
        setTotalHoursLogged(json.total_hours || 0);
      } else {
        console.error("Error fetching activities:", json.error);
      }
    } catch (err) {
      console.error("Failed to fetch logged hours:", err);
    }
  };

  const formatDateDifference = (date: Date) => {
    const now = new Date();
    const diff = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 3600 * 24),
    );
    if (diff === 0) return "Today";
    if (diff === 1) return "1 day ago";
    return `${diff} days ago`;
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchRecentActivities();
    await loadSavedOpportunities();
    setRefreshing(false);
  };

  useEffect(() => {
    if (user?.id) {
      fetchRecentActivities();
      loadSavedOpportunities();
    }
  }, [user]);

  // Delete a saved opportunity by calling the API route,
  // then update local state.
  const deleteOpportunity = async (id: string) => {
    if (!user) return;
    try {
      const res = await fetch("/(api)/deletesavedopportunity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clerk_id: user.id, opportunity_id: id }),
      });
      if (!res.ok) {
        console.error("Failed to remove saved opportunity from backend");
        return;
      }
      // Update local state
      const updatedOpportunities = savedOpportunities.filter(
        (opp) => opp.id !== id,
      );
      setSavedOpportunities(updatedOpportunities);
    } catch (error) {
      console.error("Error removing saved opportunity:", error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadSavedOpportunities();
    }, [user]),
  );

  return (
    <SafeAreaView className="flex-1 bg-primary-200 px-4 py-6 font-PoppinsBlack">
      <SignedIn>
        <ScrollView
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <View className="flex-row items-center mb-4">
            <Image
              source={{ uri: user?.imageUrl }}
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

          <View className="bg-white p-6 rounded-xl shadow-lg mb-4">
            <Text className="text-xl font-PoppinsBold text-gray-900 mb-4">
              Recent Activities
            </Text>
            {recentActivities.length > 0 ? (
              recentActivities.map((activity, index) => (
                <View
                  key={index}
                  className="flex-row justify-between font-PoppinsRegular items-center py-3 border-b border-gray-200 last:border-b-0"
                >
                  <Text className="text-base text-gray-800">
                    {activity.name}
                  </Text>
                  <Text className="text-sm text-gray-500">
                    {activity.timestamp}
                  </Text>
                </View>
              ))
            ) : (
              <Text className="text-base text-gray-500">
                No recent activities found.
              </Text>
            )}
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

        {/* Modal for Saved Opportunities */}
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
              <MaterialCommunityIcons name="close" size={24} color="#000" />
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
                      {item.apply && (
                        <View className="flex-row flex-wrap items-center">
                          <Text className="font-PoppinsSemiBold text-xs">
                            Apply:{" "}
                          </Text>
                          <TouchableOpacity
                            onPress={() => Linking.openURL(item.apply)}
                          >
                            <Text className="text-blue-500 underline font-PoppinsRegular text-xs">
                              {item.apply}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>

                    <TouchableOpacity
                      onPress={() => deleteOpportunity(item.id)}
                    >
                      <FontAwesome name="trash" size={22} color="red" />
                    </TouchableOpacity>
                  </View>
                )}
                ListEmptyComponent={
                  <View style={{ alignItems: "center", marginTop: 20 }}>
                    <Text className="text-gray-500 text-base text-center">
                      No saved opportunities yet.
                    </Text>
                  </View>
                }
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
