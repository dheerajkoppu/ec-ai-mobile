import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  ScrollView,
  Linking,
  Dimensions,
  ImageBackground,
} from "react-native";
import Swiper from "react-native-deck-swiper";
import { useUser } from "@clerk/clerk-expo";
import ReactNativeModal from "react-native-modal";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { RefreshControl } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface Opportunity {
  id: string;
  school?: string;
  title: string;
  careerField?: string;
  activityType: string;
  location: string;
  duration?: string;
  deadline?: string;
  apply?: string;
  gradeRequirements?: string;
  raceRequirements?: string;
  genderRequirements?: string;
  ageRequirements?: string;
  primaryCity?: string;
  onlyFRLStudents?: boolean;
  onlyFirstGen?: boolean;
  minGPA?: number;
  minSAT?: number;
  minACT?: number;
  minPSAT?: number;
  hasLeadershipRoles?: boolean;
  selectivityLevel?: string;
  outsideUS?: boolean;
  hoursPerWeek?: number;
  pictureurl?: string;
  createdAt?: string;
  description?: string;
  prestige?: number;
}

const { width } = Dimensions.get("window");
const CARD_WIDTH = width - 40;
const CARD_HEIGHT = 520;

const renderStars = (rating?: number) => {
  if (rating === undefined || rating === null) return "N/A";
  const fullStars = Math.round(rating);
  return "★".repeat(fullStars) + "☆".repeat(5 - fullStars);
};

const Opportunities = () => {
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useUser();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [savedOpportunities, setSavedOpportunities] = useState<Set<string>>(
    new Set(),
  );
  const [selectedOpportunity, setSelectedOpportunity] =
    useState<Opportunity | null>(null);

  const fetchOpportunities = async () => {
    if (!user) return;
    try {
      const response = await fetch("/(api)/getopportunities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clerk_id: user.id }),
      });
      if (!response.ok) throw new Error("Failed to fetch opportunities");
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

      // Filter out already swiped
      const swiped = await AsyncStorage.getItem("swipedOpportunities");
      const swipedSet = swiped ? new Set(JSON.parse(swiped)) : new Set();
      const filtered = formatted.filter((op) => !swipedSet.has(op.id));

      setOpportunities(filtered);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Error fetching opportunities");
    } finally {
      setLoading(false);
    }
  };

  const markOpportunityAsSwiped = async (id: string) => {
    try {
      const swiped = await AsyncStorage.getItem("swipedOpportunities");
      const swipedSet = swiped ? new Set(JSON.parse(swiped)) : new Set();
      swipedSet.add(id);
      await AsyncStorage.setItem(
        "swipedOpportunities",
        JSON.stringify(Array.from(swipedSet)),
      );
    } catch (err) {
      console.log("Failed to save swiped opportunity", err);
    }
  };

  const handleSave = async (op: Opportunity) => {
    if (!user || savedOpportunities.has(op.id)) return;
    setSavedOpportunities((prev) => new Set(prev).add(op.id));
    await markOpportunityAsSwiped(op.id);
    try {
      await fetch("https://ec-ai.expo.app/addsavedopportunity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clerk_id: user.id, opportunity_id: op.id }),
      });
    } catch {
      // ignore
    }
  };

  const handleSkip = async (op: Opportunity) => {
    await markOpportunityAsSwiped(op.id);
  };

  useEffect(() => {
    if (user) fetchOpportunities();
  }, [user]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOpportunities();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#F5F7FA" }}>
        <ActivityIndicator size="large" color="#5b55f6" />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#F5F7FA" }}>
        <Text style={{ color: "red", textAlign: "center", marginTop: 20 }}>
          {error}
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F5F7FA" }}>
      <View style={{ alignItems: "center", marginVertical: 16 }}>
        <Text className="text-3xl font-bold text-gray-800 font-PoppinsBold pb-2">
          Opportunity Match
        </Text>
        <Text className="text-gray-500 font-PoppinsRegular">
          Swipe RIGHT to Save an opportunity. Swipe left to skip.
        </Text>
      </View>

      <Swiper
        cards={opportunities}
        onSwipedRight={(i) => handleSave(opportunities[i])}
        onSwipedLeft={(i) => handleSkip(opportunities[i])}
        infinite
        stackSize={3}
        verticalSwipe={false}
        cardVerticalMargin={20}
        backgroundColor="transparent"
        containerStyle={{ flex: 1, marginTop: 150 }}
        renderCard={(item: Opportunity) => (
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => setSelectedOpportunity(item)}
          >
            <ImageBackground
              source={{ uri: item.pictureurl }}
              style={{
                width: CARD_WIDTH,
                height: CARD_HEIGHT,
                backgroundColor: "#FFF",
                borderRadius: 12,
                padding: 16,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
                elevation: 4,
                alignSelf: "center",
              }}
              imageStyle={{ borderRadius: 12 }}
            >
              <View
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  padding: 16,
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
                    Prestige:{" "}
                  </Text>
                  {renderStars(item.prestige)}
                </Text>

                <Text className="text-white text-md font-PoppinsRegular">
                  <Text className=" text-white text-md font-PoppinsSemiBold">
                    Activity Type:{" "}
                  </Text>
                  {item.activityType}
                </Text>

                {item.description && (
                  <Text className="text-white text-md font-PoppinsRegular">
                    <Text className=" text-white text-md font-PoppinsSemiBold">
                      Description:{" "}
                    </Text>
                    {item.description}
                  </Text>
                )}
              </View>
            </ImageBackground>
          </TouchableOpacity>
        )}
      />

      <ReactNativeModal
        isVisible={selectedOpportunity !== null}
        onBackdropPress={() => setSelectedOpportunity(null)}
        style={{ marginTop: 60, marginHorizontal: 10 }}
      >
        <View
          style={{
            backgroundColor: "#FFF",
            borderRadius: 12,
            padding: 16,
            maxHeight: "80%",
          }}
        >
          <TouchableOpacity
            onPress={() => setSelectedOpportunity(null)}
            style={{ position: "absolute", top: 16, right: 16, zIndex: 1 }}
          >
            <MaterialCommunityIcons name="close" size={24} color="#000" />
          </TouchableOpacity>
          <Text
            style={{
              fontSize: 22,
              fontWeight: "700",
              color: "#000",
              marginBottom: 12,
            }}
          >
            {selectedOpportunity?.title}
          </Text>
          <ScrollView>
            {[
              ["School", selectedOpportunity?.school],
              ["Career Field", selectedOpportunity?.careerField],
              ["Activity Type", selectedOpportunity?.activityType],
              ["Location", selectedOpportunity?.location],
              ["Duration", selectedOpportunity?.duration],
              ["Deadline", selectedOpportunity?.deadline],
              ["Grade Requirements", selectedOpportunity?.gradeRequirements],
              ["Race Requirements", selectedOpportunity?.raceRequirements],
              ["Gender Requirements", selectedOpportunity?.genderRequirements],
              ["Age Requirements", selectedOpportunity?.ageRequirements],
              ["Primary City", selectedOpportunity?.primaryCity],
              ["Min GPA", selectedOpportunity?.minGPA],
              ["Min SAT", selectedOpportunity?.minSAT],
              ["Min ACT", selectedOpportunity?.minACT],
              ["Min PSAT", selectedOpportunity?.minPSAT],
              ["Selectivity Level", selectedOpportunity?.selectivityLevel],
              ["Hours per Week", selectedOpportunity?.hoursPerWeek],
              ["Added On", selectedOpportunity?.createdAt],
            ].map(
              ([label, value], idx) =>
                value !== undefined && (
                  <Text key={idx} style={{ fontSize: 14, marginBottom: 8 }}>
                    <Text style={{ fontWeight: "600" }}>{label}:</Text> {value}
                  </Text>
                ),
            )}

            {/* ⭐ Prestige field rendered as stars */}
            <Text style={{ fontSize: 14, marginBottom: 8 }}>
              <Text style={{ fontWeight: "600" }}>Prestige:</Text>{" "}
              {renderStars(selectedOpportunity?.prestige)}
            </Text>

            <Text style={{ fontSize: 14, marginBottom: 8 }}>
              <Text style={{ fontWeight: "600" }}>Only FRL Students:</Text>{" "}
              {selectedOpportunity?.onlyFRLStudents ? "Yes" : "No"}
            </Text>
            <Text style={{ fontSize: 14, marginBottom: 8 }}>
              <Text style={{ fontWeight: "600" }}>Only First Gen:</Text>{" "}
              {selectedOpportunity?.onlyFirstGen ? "Yes" : "No"}
            </Text>
            <Text style={{ fontSize: 14, marginBottom: 8 }}>
              <Text style={{ fontWeight: "600" }}>Has Leadership Roles:</Text>{" "}
              {selectedOpportunity?.hasLeadershipRoles ? "Yes" : "No"}
            </Text>
            <Text style={{ fontSize: 14, marginBottom: 8 }}>
              <Text style={{ fontWeight: "600" }}>Outside US:</Text>{" "}
              {selectedOpportunity?.outsideUS ? "Yes" : "No"}
            </Text>

            {selectedOpportunity?.apply && (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 8,
                }}
              >
                <Text style={{ fontWeight: "600" }}>Apply:</Text>
                <TouchableOpacity
                  onPress={() => Linking.openURL(selectedOpportunity.apply!)}
                  style={{ marginLeft: 8 }}
                >
                  <Text
                    style={{
                      color: "#3B82F6",
                      textDecorationLine: "underline",
                      fontSize: 14,
                    }}
                  >
                    {selectedOpportunity.apply}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </View>
      </ReactNativeModal>
    </SafeAreaView>
  );
};

export default Opportunities;
