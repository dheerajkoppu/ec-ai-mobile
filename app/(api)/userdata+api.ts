import { neon } from "@neondatabase/serverless";

export async function POST(request: Request) {
  try {
    const sql = neon(process.env.DATABASE_URL as string);
    const {
      userEmail,
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

    // Check for required field(s)
    if (!userEmail) {
      return new Response(
        JSON.stringify({ error: "Missing required field: userEmail" }),
        { status: 400 },
      );
    }

    // Use a fallback for name if not provided
    const finalName = name || userEmail;

    // Convert string numeric values.
    const ageInt = age ? parseInt(age) : null;
    const gpaWeightedNum = gpaWeighted ? parseFloat(gpaWeighted) : null;
    const gpaUnweightedNum = gpaUnweighted ? parseFloat(gpaUnweighted) : null;
    const satScoreInt = satScore ? parseInt(satScore) : null;
    const actScoreInt = actScore ? parseInt(actScore) : null;
    const psatScoreInt = psatScore ? parseInt(psatScore) : null;

    // Utility: Convert "yes"/"no" strings to booleans.
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

    // Wrap ecReason into an array for the TEXT[] column (if provided)
    const extracurricularMotivation = ecReason ? [ecReason] : null;

    // Update the user record where email matches the provided userEmail.
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
      WHERE email = ${userEmail};
    `;

    return new Response(JSON.stringify({ data: response }), {
      status: 200,
    });
  } catch (error) {
    console.error("Error updating user profile:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
    });
  }
}
