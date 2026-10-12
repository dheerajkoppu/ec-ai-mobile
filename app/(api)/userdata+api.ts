import { sql } from "@/lib/db";
import { deleteServerCache } from "@/lib/serverCache";
import { requireAuth, unauthorizedResponse } from "@/lib/serverAuth";

class ProfileValidationError extends Error {}

// The app sends these for an unanswered field, including when it echoes back a stored value
const BLANK_VALUES = new Set(["", "none", "nan", "null", "undefined"]);

// Score dropdowns send ranges like "1200-1390" or "1500+", so only the leading number is read
function parseProfileNumber(
  value: unknown,
  label: string,
  { min, max, integer }: { min: number; max: number; integer: boolean },
): number | null {
  const text = String(value ?? "").trim();
  if (BLANK_VALUES.has(text.toLowerCase())) return null;

  const parsed = integer ? parseInt(text, 10) : parseFloat(text);
  if (!Number.isFinite(parsed) || parsed < min || parsed > max) {
    throw new ProfileValidationError(
      `${label} must be a number between ${min} and ${max}`,
    );
  }

  return parsed;
}

export async function POST(request: Request) {
  let clerkId: string;
  try {
    clerkId = await requireAuth(request);
  } catch {
    return unauthorizedResponse();
  }

  try {
    const {
      name,
      gradeLevel,
      race,
      gender,
      age,
      firstGen,
      gpaWeighted,
      gpaUnweighted,
      satScore,
      actScore,
      psatScore,
      careerInterest,
      entrepreneur,
      research,
      ecReason,
      ecLevel,
      leadership,
      selectivity,
      paid,
      travel,
      timeWeekly,
      ecType,
      source,
      usedOtherApps,
      agreeTerms,
    } = await request.json();

    const ageInt = parseProfileNumber(age, "Age", {
      min: 1,
      max: 120,
      integer: true,
    });
    // The GPA columns are numeric(3,2), so anything above 9.99 overflows
    const gpaRange = { min: 0, max: 9.99, integer: false };
    const gpaWeightedNum = parseProfileNumber(
      gpaWeighted,
      "Weighted GPA",
      gpaRange,
    );
    const gpaUnweightedNum = parseProfileNumber(
      gpaUnweighted,
      "Unweighted GPA",
      gpaRange,
    );
    const satScoreInt = parseProfileNumber(satScore, "SAT score", {
      min: 400,
      max: 1600,
      integer: true,
    });
    const actScoreInt = parseProfileNumber(actScore, "ACT score", {
      min: 1,
      max: 36,
      integer: true,
    });
    const psatScoreInt = parseProfileNumber(psatScore, "PSAT score", {
      min: 320,
      max: 1520,
      integer: true,
    });

    const toBool = (val: string | undefined) =>
      val && val.toLowerCase() === "yes";
    const firstGenCollege = toBool(firstGen);
    const wantsToStartBusiness = toBool(entrepreneur);
    const interestedInResearch = toBool(research);
    const seekingLeadership = toBool(leadership);
    const interestedInPaidOpportunities = toBool(paid);
    const interestedInTravel = toBool(travel);
    const usedOtherECFinders = toBool(usedOtherApps);
    const agreedToTerms = toBool(agreeTerms);

    const extracurricularMotivation = ecReason ? [ecReason] : null;

    // Use email as fallback name if none provided; look up email from clerk_id
    const [userRow] = await sql`
      SELECT email FROM users WHERE clerk_id = ${clerkId} LIMIT 1;
    `;
    if (!userRow) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
      });
    }
    const finalName = name || userRow.email;

    const response = await sql`
      UPDATE users
      SET
        name = ${finalName},
        age = ${ageInt},
        grade_level = ${gradeLevel},
        gender = ${gender},
        race_ethnicity = ${race},
        first_gen_college = ${firstGenCollege},
        gpa_weighted = ${gpaWeightedNum},
        gpa_unweighted = ${gpaUnweightedNum},
        sat_score = ${satScoreInt},
        act_score = ${actScoreInt},
        psat_score = ${psatScoreInt},
        career_interest = ${careerInterest},
        wants_to_start_business = ${wantsToStartBusiness},
        interested_in_research = ${interestedInResearch},
        extracurricular_motivation = ${extracurricularMotivation},
        field_goal = ${ecLevel},
        seeking_leadership = ${seekingLeadership},
        opportunity_selectivity = ${selectivity},
        interested_in_paid_opportunities = ${interestedInPaidOpportunities},
        interested_in_travel = ${interestedInTravel},
        weekly_commitment = ${timeWeekly},
        extracurricular_format = ${ecType},
        referral_source = ${source},
        used_other_ec_finders = ${usedOtherECFinders},
        agreed_to_terms = ${agreedToTerms}
      WHERE clerk_id = ${clerkId};
    `;

    await deleteServerCache(`recommendations:${clerkId}:v1`);

    return new Response(JSON.stringify({ data: response }), { status: 200 });
  } catch (error) {
    if (error instanceof ProfileValidationError) {
      return Response.json({ error: error.message }, { status: 400 });
    }

    console.error("Error updating user profile:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
    });
  }
}
