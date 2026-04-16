import { sql } from "@/lib/db";
import { calculateRecommendationScore } from "@/lib/recommendationScore";
import { requireAuth, unauthorizedResponse } from "@/lib/serverAuth";

const RECOMMENDATION_BATCH_SIZE = 120;

export async function POST(request: Request) {
  let clerkId: string;

  try {
    clerkId = await requireAuth(request);
  } catch {
    return unauthorizedResponse();
  }

  try {
    const [user] = await sql`
      SELECT
        career_interest,
        weekly_commitment,
        seeking_leadership,
        opportunity_selectivity,
        interested_in_travel,
        grade_level
      FROM users
      WHERE clerk_id = ${clerkId}
      LIMIT 1;
    `;

    if (!user) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
      });
    }

    const opportunitiesRaw = await sql`
      SELECT
        id,
        activity_name,
        career_field,
        activity_type,
        hours_per_week,
        has_leadership_roles,
        selectivity_level,
        outside_us,
        grade_requirements,
        description,
        pictureurl,
        prestige,
        created_at
      FROM opportunities
      WHERE id NOT IN (
        SELECT opportunity_id
        FROM user_saved_opportunities
        WHERE clerk_id = ${clerkId}
      )
      ORDER BY created_at DESC
      LIMIT ${RECOMMENDATION_BATCH_SIZE * 3}; -- grab more, rank later
    `;

    const scored = opportunitiesRaw.map((op: any) => ({
      id: op.id,
      title: op.activity_name ?? "",
      activityType: op.activity_type ?? "",
      description: op.description ?? "",
      pictureurl: op.pictureurl ?? null,
      prestige: op.prestige ?? 0,
      matchScore: calculateRecommendationScore(
        {
          careerInterest: user.career_interest,
          weeklyCommitment: user.weekly_commitment,
          seekingLeadership: user.seeking_leadership,
          opportunitySelectivity: user.opportunity_selectivity,
          interestedInTravel: user.interested_in_travel,
          gradeLevel: user.grade_level,
        },
        {
          careerField: op.career_field,
          hoursPerWeek: op.hours_per_week,
          hasLeadershipRoles: op.has_leadership_roles,
          selectivityLevel: op.selectivity_level,
          outsideUS: op.outside_us,
          gradeRequirements: op.grade_requirements,
        },
      ),
    }));

    const sorted = scored
      .sort(
        (
          a: { matchScore: number },
          b: { matchScore: number },
        ) => b.matchScore - a.matchScore,
      )
      .slice(0, RECOMMENDATION_BATCH_SIZE);

    return new Response(JSON.stringify({ data: sorted }), {
      status: 200,
    });
  } catch (error) {
    console.error("Error fetching recommendations:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
    });
  }
}
