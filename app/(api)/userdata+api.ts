import { sql } from "@/lib/db";
import { requireAuth, unauthorizedResponse } from "@/lib/serverAuth";

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

    const ageInt = age ? parseInt(age) : null;
    const gpaWeightedNum = gpaWeighted ? parseFloat(gpaWeighted) : null;
    const gpaUnweightedNum = gpaUnweighted ? parseFloat(gpaUnweighted) : null;
    const satScoreInt = satScore ? parseInt(satScore) : null;
    const actScoreInt = actScore ? parseInt(actScore) : null;
    const psatScoreInt = psatScore ? parseInt(psatScore) : null;

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

    return new Response(JSON.stringify({ data: response }), { status: 200 });
  } catch (error) {
    console.error("Error updating user profile:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
    });
  }
}
