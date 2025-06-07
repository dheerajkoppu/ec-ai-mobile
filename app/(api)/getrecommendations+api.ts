import { neon } from "@neondatabase/serverless";

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

function hoursToLabel(hours: number): string {
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
  )
    score += 50;

  const userBand = mapTimeRange(user.time);
  const oppBand = mapTimeRange(hoursToLabel(opp.hours_per_week || 0));
  const diff = Math.abs(userBand - oppBand);
  if (diff === 0) score += 50;
  else if (diff === 1) score += 25;

  return score;
}

export async function POST(request: Request) {
  try {
    const sql = neon(`${process.env.DATABASE_URL}`);
    const { clerk_id } = await request.json();

    if (!clerk_id) {
      return new Response(JSON.stringify({ error: "Missing clerk ID" }), {
        status: 400,
      });
    }

    const [userRaw, opportunitiesRaw] = await Promise.all([
      sql`SELECT career_interest, weekly_commitment FROM users WHERE clerk_id = ${clerk_id} LIMIT 1;`,
      sql`SELECT
            id,
            school,
            activity_name,
            career_field,
            activity_type,
            location,
            duration,
            deadline,
            application_link,
            grade_requirements,
            race_requirements,
            gender_requirements,
            age_requirements,
            primary_city,
            only_frl_students,
            only_first_gen,
            min_gpa,
            min_sat,
            min_act,
            min_psat,
            has_leadership_roles,
            selectivity_level,
            outside_us,
            hours_per_week,
            description,
            pictureurl,
            prestige,
            created_at
          FROM opportunities
          WHERE id NOT IN (
            SELECT opportunity_id
            FROM user_saved_opportunities
            WHERE clerk_id = ${clerk_id}
          );`,
    ]);

    const user = userRaw[0];
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

    const scored = opportunitiesRaw.map((op: any) => ({
      id: op.id,
      school: op.school,
      activityName: op.activity_name,
      careerField: op.career_field,
      activityType: op.activity_type,
      location: op.location,
      duration: op.duration,
      deadline: op.deadline,
      applicationLink: op.application_link,
      gradeRequirements: Array.isArray(op.grade_requirements)
        ? op.grade_requirements.join(", ")
        : op.grade_requirements,
      raceRequirements: Array.isArray(op.race_requirements)
        ? op.race_requirements.join(", ")
        : op.race_requirements,
      genderRequirements: Array.isArray(op.gender_requirements)
        ? op.gender_requirements.join(", ")
        : op.gender_requirements,
      ageRequirements: Array.isArray(op.age_requirements)
        ? op.age_requirements.join(", ")
        : op.age_requirements,
      primaryCity: op.primary_city,
      onlyFRLStudents: op.only_frl_students,
      onlyFirstGen: op.only_first_gen,
      minGPA: op.min_gpa,
      minSAT: op.min_sat,
      minACT: op.min_act,
      minPSAT: op.min_psat,
      hasLeadershipRoles: op.has_leadership_roles,
      selectivityLevel: op.selectivity_level,
      outsideUS: op.outside_us,
      hoursPerWeek: op.hours_per_week,
      description: op.description,
      pictureurl: op.pictureurl,
      prestige: op.prestige,
      createdAt: op.created_at,
      matchScore: calculateMatchScore({ interests, time }, op),
    }));

    const sorted = scored.sort((a, b) => b.matchScore - a.matchScore);

    return new Response(JSON.stringify({ data: sorted }), { status: 200 });
  } catch (error) {
    console.error("Error fetching recommendations:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
    });
  }
}
