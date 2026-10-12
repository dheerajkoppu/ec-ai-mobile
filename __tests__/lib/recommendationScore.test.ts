import { describe, expect, it } from "@jest/globals";
import {
  calculateRecommendationScore,
  rankRecommendations,
  type RecommendationOpportunity,
  type RecommendationUser,
} from "@/lib/recommendationScore";

const student: RecommendationUser = {
  careerInterest: ["Engineering"],
  weeklyCommitment: "2-5 hours",
  seekingLeadership: true,
  opportunitySelectivity: "Highly selective",
  interestedInTravel: false,
  gradeLevel: "11th Grade",
};

const perfectMatch: RecommendationOpportunity = {
  careerField: "Engineering",
  hoursPerWeek: 3,
  hasLeadershipRoles: true,
  selectivityLevel: "High",
  outsideUS: false,
  gradeRequirements: ["10th Grade", "11th Grade"],
};

const unknownUser: RecommendationUser = {
  careerInterest: null,
  weeklyCommitment: null,
  seekingLeadership: null,
  opportunitySelectivity: null,
  interestedInTravel: null,
  gradeLevel: null,
};

const unknownOpportunity: RecommendationOpportunity = {
  careerField: null,
  hoursPerWeek: null,
  hasLeadershipRoles: null,
  selectivityLevel: null,
  outsideUS: null,
  gradeRequirements: null,
};

const score = (
  user: Partial<RecommendationUser>,
  opportunity: Partial<RecommendationOpportunity>,
) =>
  calculateRecommendationScore(
    { ...student, ...user },
    { ...perfectMatch, ...opportunity },
  );

describe("calculateRecommendationScore", () => {
  it("gives 100 when every factor matches", () => {
    expect(calculateRecommendationScore(student, perfectMatch)).toBe(100);
  });

  it("gives partial credit when nothing is known", () => {
    // interest 10 + time 5 + leadership 7 + selectivity 7 + grade 5 + travel 2
    expect(calculateRecommendationScore(unknownUser, unknownOpportunity)).toBe(
      36,
    );
  });

  it("takes 35 points off for a career field the student did not pick", () => {
    expect(score({}, { careerField: "Law" })).toBe(65);
  });

  it("matches a career interest that is part of the field name", () => {
    expect(score({}, { careerField: "Software Engineering" })).toBe(100);
  });

  it("reads career interests sent as a Postgres array literal", () => {
    expect(score({ careerInterest: '{"Law","Engineering"}' }, {})).toBe(100);
  });

  it("gives half the time points when the commitment is one band away", () => {
    expect(score({}, { hoursPerWeek: 7 })).toBe(90);
  });

  it("gives no time points when the commitment is two bands away", () => {
    expect(score({}, { hoursPerWeek: 12 })).toBe(80);
  });

  it("compares a text commitment on the opportunity with the student's", () => {
    expect(score({}, { hoursPerWeek: "2-5 hours" })).toBe(100);
  });

  it("gives no leadership points when a student wants a role that is not offered", () => {
    expect(score({}, { hasLeadershipRoles: false })).toBe(85);
  });

  it("gives a neutral leadership score when the student is not seeking a role", () => {
    expect(score({ seekingLeadership: false }, {})).toBe(93);
  });

  it("treats 'very selective' as high selectivity, not moderate", () => {
    expect(score({}, { selectivityLevel: "Very selective" })).toBe(100);
  });

  it("gives partial selectivity points one band away", () => {
    expect(score({}, { selectivityLevel: "Moderate" })).toBe(93);
  });

  it("gives no grade points when the student's grade is not accepted", () => {
    expect(score({}, { gradeRequirements: ["9th Grade"] })).toBe(90);
  });

  it("gives no travel points for an opportunity abroad when the student will not travel", () => {
    expect(score({}, { outsideUS: true })).toBe(95);
  });

  it("gives fewer travel points for a local opportunity when the student wants to travel", () => {
    expect(score({ interestedInTravel: true }, {})).toBe(98);
  });
});

describe("rankRecommendations", () => {
  const card = (id: number, matchScore: number) => ({ id, matchScore });

  it("ranks unswiped opportunities by score, highest first", () => {
    const ranked = rankRecommendations(
      [card(1, 40), card(2, 90), card(3, 65)],
      3,
      10,
    );

    expect(ranked.map((item) => item.id)).toEqual([2, 3, 1]);
  });

  it("keeps already-swiped opportunities after the unswiped ones, in the order given", () => {
    const ranked = rankRecommendations(
      [card(1, 40), card(2, 90), card(3, 99), card(4, 10), card(5, 70)],
      2,
      10,
    );

    expect(ranked.map((item) => item.id)).toEqual([2, 1, 3, 4, 5]);
  });

  it("keeps the original order for equal scores", () => {
    const ranked = rankRecommendations(
      [card(1, 50), card(2, 50), card(3, 50)],
      3,
      10,
    );

    expect(ranked.map((item) => item.id)).toEqual([1, 2, 3]);
  });

  it("cuts the batch to the limit", () => {
    const ranked = rankRecommendations(
      [card(1, 10), card(2, 20), card(3, 30)],
      3,
      2,
    );

    expect(ranked.map((item) => item.id)).toEqual([3, 2]);
  });
});
