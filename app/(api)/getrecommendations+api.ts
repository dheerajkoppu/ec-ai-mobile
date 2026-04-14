import { sql } from "@/lib/db";
import { requireAuth, unauthorizedResponse } from "@/lib/serverAuth";

const RECOMMENDATION_BATCH_SIZE = 120;

function mapTimeRange(label: string): number {
  switch (label) {
    case "<2 hours":
      return 1;
    case "2-5 hours":
      return 2;
    case "5-10 hours":
      return 3;
    case "10+ hours":
      return 4;
    default:
      return 0;
  }
}

function hoursToLabel(hours: any): string {
  if (typeof hours === "string") return hours; // already label
  if (hours < 2) return "<2 hours";
  if (hours < 5) return "2-5 hours";
  if (hours < 10) return "5-10 hours";
  return "10+ hours";
}

function calculateMatchScore(
  user: { interests: string[]; time: string },
  opp: any,
): number {
  let score = 0;

  if (
    user.interests &&
    opp.career_field &&
    user.interests.includes(opp.career_field)
  ) {
    score += 50;
  }

  const userBand = mapTimeRange(user.time);
  const oppBand = mapTimeRange(hoursToLabel(opp.hours_per_week));

  const diff = Math.abs(userBand - oppBand);

  if (diff === 0) score += 50;
  else if (diff === 1) score += 25;

  return score;
}

export async function POST(request: Request) {
  let clerkId: string;

  try {
    clerkId = await requireAuth(request);
  } catch {
    return unauthorizedResponse();
  }

  try {
    const [user] = await sql`
      SELECT career_interest, weekly_commitment
      FROM users
      WHERE clerk_id = ${clerkId}
      LIMIT 1;
    `;

    if (!user) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
      });
    }

    const interests = user.career_interest
      ? user.career_interest
          .replace(/^{|}$/g, "")
          .split(",")
          .map((s: string) => s.trim())
      : [];

    const time = user.weekly_commitment || "";

    // 🔥 ONLY filter in SQL (no complex scoring)
    const opportunitiesRaw = await sql`
      SELECT
        id,
        activity_name,
        career_field,
        activity_type,
        hours_per_week,
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
      matchScore: calculateMatchScore({ interests, time }, op),
    }));

    const sorted = scored
      .sort((a, b) => b.matchScore - a.matchScore)
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