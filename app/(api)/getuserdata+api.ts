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
    const userData = await sql`
      SELECT
        age,
        grade_level,
        gender,
        race_ethnicity,
        school_name,
        city,
        state,
        free_reduced_lunch,
        first_gen_college,
        gpa_weighted,
        gpa_unweighted,
        sat_score,
        act_score,
        psat_score,
        career_interest,
        wants_to_start_business,
        interested_in_research,
        extracurricular_motivation,
        field_goal,
        seeking_leadership,
        open_to_own_project,
        opportunity_selectivity,
        interested_in_paid_opportunities,
        interested_in_travel,
        weekly_commitment,
        extracurricular_format,
        referral_source,
        used_other_ec_finders,
        wants_notifications,
        agreed_to_terms
      FROM users
      WHERE clerk_id = ${clerkId}
      LIMIT 1;
    `;

    if (!userData || userData.length === 0) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
      });
    }

    return new Response(JSON.stringify({ user: userData[0] }), { status: 200 });
  } catch (error) {
    console.error("Error fetching user data:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
    });
  }
}
