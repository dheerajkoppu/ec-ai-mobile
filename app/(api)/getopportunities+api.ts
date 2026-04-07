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
    const opportunities = await sql`
      SELECT
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
        WHERE clerk_id = ${clerkId}
      );
    `;

    const formatted = opportunities.map((op: any) => ({
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
    }));

    return new Response(JSON.stringify({ data: formatted }), { status: 200 });
  } catch (error) {
    console.error("Error fetching opportunities:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
    });
  }
}
