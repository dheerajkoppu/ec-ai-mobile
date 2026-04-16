type Maybe<T> = T | null | undefined;

export type RecommendationUser = {
  careerInterest: Maybe<string[] | string>;
  weeklyCommitment: Maybe<string>;
  seekingLeadership: Maybe<boolean>;
  opportunitySelectivity: Maybe<string>;
  interestedInTravel: Maybe<boolean>;
  gradeLevel: Maybe<string>;
};

export type RecommendationOpportunity = {
  careerField: Maybe<string>;
  hoursPerWeek: Maybe<number | string>;
  hasLeadershipRoles: Maybe<boolean>;
  selectivityLevel: Maybe<string>;
  outsideUS: Maybe<boolean>;
  gradeRequirements: Maybe<string[] | string>;
};

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function toArray(value: Maybe<string[] | string>): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .replace(/^{|}$/g, "")
      .split(",")
      .map((item) => item.trim().replace(/^"+|"+$/g, ""))
      .filter(Boolean);
  }

  return [];
}

function matchInterestScore(
  interests: string[],
  careerField: Maybe<string>,
): number {
  if (interests.length === 0 || !careerField) {
    return 10;
  }

  const normalizedField = normalize(careerField);
  const isMatch = interests.some((interest) => {
    const normalizedInterest = normalize(interest);
    return (
      normalizedInterest === normalizedField ||
      normalizedField.includes(normalizedInterest) ||
      normalizedInterest.includes(normalizedField)
    );
  });

  return isMatch ? 35 : 0;
}

function mapTimeBand(value: Maybe<string | number>): number {
  if (typeof value === "number") {
    if (value < 2) return 1;
    if (value < 5) return 2;
    if (value < 10) return 3;
    return 4;
  }

  if (!value) return 0;

  const text = value.toLowerCase();
  if (text.includes("<2") || text.includes("under 2")) return 1;
  if (text.includes("2-5") || text.includes("2 to 5")) return 2;
  if (text.includes("5-10") || text.includes("5 to 10")) return 3;
  if (text.includes("10+") || text.includes("10 +") || text.includes("10 or more")) {
    return 4;
  }

  return 0;
}

function matchTimeScore(
  weeklyCommitment: Maybe<string>,
  hoursPerWeek: Maybe<string | number>,
): number {
  const userBand = mapTimeBand(weeklyCommitment);
  const oppBand = mapTimeBand(hoursPerWeek);

  if (!userBand || !oppBand) {
    return 5;
  }

  const diff = Math.abs(userBand - oppBand);
  if (diff === 0) return 20;
  if (diff === 1) return 10;
  return 0;
}

function matchLeadershipScore(
  seekingLeadership: Maybe<boolean>,
  hasLeadershipRoles: Maybe<boolean>,
): number {
  if (seekingLeadership == null || hasLeadershipRoles == null) {
    return 7;
  }

  if (seekingLeadership) {
    return hasLeadershipRoles ? 15 : 0;
  }

  return 8;
}

function mapSelectivityBand(value: Maybe<string>): number {
  if (!value) return 0;

  const text = value.toLowerCase();
  if (
    text.includes("high") ||
    text.includes("very selective") ||
    text.includes("competitive") ||
    text.includes("elite")
  ) {
    return 3;
  }

  if (
    text.includes("moderate") ||
    text.includes("somewhat") ||
    text.includes("mid") ||
    text.includes("selective")
  ) {
    return 2;
  }

  if (
    text.includes("open") ||
    text.includes("all") ||
    text.includes("accessible") ||
    text.includes("low")
  ) {
    return 1;
  }

  return 0;
}

function matchSelectivityScore(
  opportunitySelectivity: Maybe<string>,
  selectivityLevel: Maybe<string>,
): number {
  const userBand = mapSelectivityBand(opportunitySelectivity);
  const oppBand = mapSelectivityBand(selectivityLevel);

  if (!userBand || !oppBand) {
    return 7;
  }

  const diff = Math.abs(userBand - oppBand);
  if (diff === 0) return 15;
  if (diff === 1) return 8;
  return 0;
}

function matchGradeScore(
  gradeLevel: Maybe<string>,
  gradeRequirements: Maybe<string[] | string>,
): number {
  if (!gradeLevel) {
    return 5;
  }

  const normalizedGrade = normalize(gradeLevel);
  const requirements = toArray(gradeRequirements);

  if (requirements.length === 0) {
    return 5;
  }

  const matches = requirements.some((requirement) =>
    normalize(requirement).includes(normalizedGrade),
  );

  return matches ? 10 : 0;
}

function matchTravelScore(
  interestedInTravel: Maybe<boolean>,
  outsideUS: Maybe<boolean>,
): number {
  if (interestedInTravel == null || outsideUS == null) {
    return 2;
  }

  if (interestedInTravel && outsideUS) return 5;
  if (!interestedInTravel && !outsideUS) return 5;
  if (interestedInTravel && !outsideUS) return 3;
  return 0;
}

export function calculateRecommendationScore(
  user: RecommendationUser,
  opportunity: RecommendationOpportunity,
): number {
  const interests = toArray(user.careerInterest);

  const score =
    matchInterestScore(interests, opportunity.careerField) +
    matchTimeScore(user.weeklyCommitment, opportunity.hoursPerWeek) +
    matchLeadershipScore(
      user.seekingLeadership,
      opportunity.hasLeadershipRoles,
    ) +
    matchSelectivityScore(
      user.opportunitySelectivity,
      opportunity.selectivityLevel,
    ) +
    matchGradeScore(user.gradeLevel, opportunity.gradeRequirements) +
    matchTravelScore(user.interestedInTravel, opportunity.outsideUS);

  return Math.max(0, Math.min(100, score));
}
