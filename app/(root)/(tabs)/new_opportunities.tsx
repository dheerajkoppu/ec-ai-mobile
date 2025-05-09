import React, { useState, useEffect } from "react";
import {
  View,
  Image,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  ScrollView,
  Linking,
  StyleSheet,
  Dimensions,
  ImageBackground,
} from "react-native";
import Swiper from "react-native-deck-swiper";
import { useUser } from "@clerk/clerk-expo";
import ReactNativeModal from "react-native-modal";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { images } from "@/constants";
import { RefreshControl } from "react-native";

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
}

const { width } = Dimensions.get("window");
const CARD_WIDTH = width - 40;
const CARD_HEIGHT = 520;

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
      const response = await fetch("https://ec-ai.expo.app/getopportunities", {
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
      }));
      setOpportunities(formatted);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Error fetching opportunities");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchOpportunities();
  }, [user]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOpportunities();
    setRefreshing(false);
  };

  const handleSave = async (op: Opportunity) => {
    if (!user || savedOpportunities.has(op.id)) return;
    setSavedOpportunities((prev) => new Set(prev).add(op.id));
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

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#5b55f6" />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <Text className="text-3xl font-bold text-gray-800 font-PoppinsBold pb-2">
          Opportunity Match
        </Text>
        <Text className="text-gray-500 font-PoppinsRegular">
          Swipe RIGHT to Save an Opportunity. Swipe left to skip.
        </Text>
      </View>
      <Swiper
        cards={opportunities}
        onSwipedRight={(i) => handleSave(opportunities[i])}
        onSwipedLeft={() => {}}
        infinite={true}
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
              style={styles.card}
              imageStyle={{ borderRadius: 12 }}
            >
              <View style={styles.footerOverlay}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardMeta}>
                  Activity Type: {item.activityType}
                </Text>
                {item.description && (
                  <Text style={styles.cardMeta}>
                    Description: {item.description}
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
        <View style={styles.modalContainer}>
          <TouchableOpacity
            onPress={() => setSelectedOpportunity(null)}
            style={styles.modalClose}
          >
            <MaterialCommunityIcons name="close" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.cardTitle}>{selectedOpportunity?.title}</Text>
          <ScrollView>
            <Text style={styles.modalText}>
              <Text style={styles.modalLabel}>School:</Text>{" "}
              {selectedOpportunity?.school}
            </Text>
            <Text style={styles.modalText}>
              <Text style={styles.modalLabel}>Career Field:</Text>{" "}
              {selectedOpportunity?.careerField}
            </Text>
            <Text style={styles.modalText}>
              <Text style={styles.modalLabel}>Activity Type:</Text>{" "}
              {selectedOpportunity?.activityType}
            </Text>
            <Text style={styles.modalText}>
              <Text style={styles.modalLabel}>Location:</Text>{" "}
              {selectedOpportunity?.location}
            </Text>
            {selectedOpportunity?.duration && (
              <Text style={styles.modalText}>
                <Text style={styles.modalLabel}>Duration:</Text>{" "}
                {selectedOpportunity.duration}
              </Text>
            )}
            {selectedOpportunity?.deadline && (
              <Text style={styles.modalText}>
                <Text style={styles.modalLabel}>Deadline:</Text>{" "}
                {selectedOpportunity.deadline}
              </Text>
            )}
            {selectedOpportunity?.apply && (
              <View style={[styles.modalText, { flexDirection: "row" }]}>
                <Text style={styles.modalLabel}>Apply:</Text>
                <TouchableOpacity
                  onPress={() => Linking.openURL(selectedOpportunity.apply!)}
                  style={{ marginLeft: 8 }}
                >
                  <Text style={styles.applyText}>
                    {selectedOpportunity.apply}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
            {selectedOpportunity?.gradeRequirements && (
              <Text style={styles.modalText}>
                <Text style={styles.modalLabel}>Grade Requirements:</Text>{" "}
                {selectedOpportunity.gradeRequirements}
              </Text>
            )}
            {selectedOpportunity?.raceRequirements && (
              <Text style={styles.modalText}>
                <Text style={styles.modalLabel}>Race Requirements:</Text>{" "}
                {selectedOpportunity.raceRequirements}
              </Text>
            )}
            {selectedOpportunity?.genderRequirements && (
              <Text style={styles.modalText}>
                <Text style={styles.modalLabel}>Gender Requirements:</Text>{" "}
                {selectedOpportunity.genderRequirements}
              </Text>
            )}
            {selectedOpportunity?.ageRequirements && (
              <Text style={styles.modalText}>
                <Text style={styles.modalLabel}>Age Requirements:</Text>{" "}
                {selectedOpportunity.ageRequirements}
              </Text>
            )}
            {selectedOpportunity?.primaryCity && (
              <Text style={styles.modalText}>
                <Text style={styles.modalLabel}>Primary City:</Text>{" "}
                {selectedOpportunity.primaryCity}
              </Text>
            )}
            <Text style={styles.modalText}>
              <Text style={styles.modalLabel}>Only FRL Students:</Text>{" "}
              {selectedOpportunity?.onlyFRLStudents ? "Yes" : "No"}
            </Text>
            <Text style={styles.modalText}>
              <Text style={styles.modalLabel}>Only First Gen:</Text>{" "}
              {selectedOpportunity?.onlyFirstGen ? "Yes" : "No"}
            </Text>
            {selectedOpportunity?.minGPA !== undefined && (
              <Text style={styles.modalText}>
                <Text style={styles.modalLabel}>Min GPA:</Text>{" "}
                {selectedOpportunity.minGPA}
              </Text>
            )}
            {selectedOpportunity?.minSAT !== undefined && (
              <Text style={styles.modalText}>
                <Text style={styles.modalLabel}>Min SAT:</Text>{" "}
                {selectedOpportunity.minSAT}
              </Text>
            )}
            {selectedOpportunity?.minACT !== undefined && (
              <Text style={styles.modalText}>
                <Text style={styles.modalLabel}>Min ACT:</Text>{" "}
                {selectedOpportunity.minACT}
              </Text>
            )}
            {selectedOpportunity?.minPSAT !== undefined && (
              <Text style={styles.modalText}>
                <Text style={styles.modalLabel}>Min PSAT:</Text>{" "}
                {selectedOpportunity.minPSAT}
              </Text>
            )}
            <Text style={styles.modalText}>
              <Text style={styles.modalLabel}>Has Leadership Roles:</Text>{" "}
              {selectedOpportunity?.hasLeadershipRoles ? "Yes" : "No"}
            </Text>
            {selectedOpportunity?.selectivityLevel && (
              <Text style={styles.modalText}>
                <Text style={styles.modalLabel}>Selectivity Level:</Text>{" "}
                {selectedOpportunity.selectivityLevel}
              </Text>
            )}
            <Text style={styles.modalText}>
              <Text style={styles.modalLabel}>Outside US:</Text>{" "}
              {selectedOpportunity?.outsideUS ? "Yes" : "No"}
            </Text>
            {selectedOpportunity?.hoursPerWeek !== undefined && (
              <Text style={styles.modalText}>
                <Text style={styles.modalLabel}>Hours per Week:</Text>{" "}
                {selectedOpportunity.hoursPerWeek}
              </Text>
            )}
            {selectedOpportunity?.createdAt && (
              <Text style={styles.modalText}>
                <Text style={styles.modalLabel}>Added On:</Text>{" "}
                {selectedOpportunity.createdAt}
              </Text>
            )}
          </ScrollView>
        </View>
      </ReactNativeModal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },
  errorText: {
    color: "red",
    textAlign: "center",
    marginTop: 20,
  },
  headerContainer: {
    alignItems: "center",
    marginVertical: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#5B55F6",
  },
  headerSubtitle: {
    fontSize: 16,
    color: "#333",
    marginTop: 4,
  },
  card: {
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
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  cardLabel: {
    fontWeight: "600",
  },
  cardText: {
    fontSize: 14,
    marginBottom: 6,
  },
  applyContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  applyLink: {
    marginLeft: 6,
  },
  applyText: {
    color: "#3B82F6",
    textDecorationLine: "underline",
    fontSize: 14,
  },
  modalContainer: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 16,
    maxHeight: "80%",
  },
  modalClose: {
    position: "absolute",
    top: 16,
    right: 16,
    zIndex: 1,
  },
  modalLabel: {
    fontWeight: "600",
  },
  modalText: {
    fontSize: 14,
    marginBottom: 8,
  },
  footerOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },

  cardMeta: {
    fontSize: 14,
    color: "#FFFFFF",
  },
});

export default Opportunities;
