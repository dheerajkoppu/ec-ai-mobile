import { neon } from "@neondatabase/serverless";

export async function POST(request: Request) {
  try {
    const sql = neon(`${process.env.DATABASE_URL}`);
    const { clerk_id } = await request.json();

    if (!clerk_id) {
      return new Response(JSON.stringify({ error: "Missing clerk ID" }), {
        status: 400,
      });
    }

    // Fetch all opportunities the user has saved
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
        created_at
      FROM opportunities
      WHERE id IN (
        SELECT opportunity_id
        FROM user_saved_opportunities
        WHERE clerk_id = ${clerk_id}
      );
    `;

    // Normalize field names for frontend compatibility
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
      gradeRequirements: op.grade_requirements,
      raceRequirements: op.race_requirements,
      genderRequirements: op.gender_requirements,
      ageRequirements: op.age_requirements,
      primaryCity: op.primary_city,
      onlyFRLStudents: op.only_frl_students,
      onlyFirstGen: op.only_first_gen,
      minGPA: op.min_gpa,
      minSAT: op.min_sat,
      minACT: op.min_act,
      minPSAT: op.min_psat,
      description: op.description,
      hasLeadershipRoles: op.has_leadership_roles,
      selectivityLevel: op.selectivity_level,
      outsideUS: op.outside_us,
      hoursPerWeek: op.hours_per_week,
      createdAt: op.created_at,
    }));

    return new Response(JSON.stringify({ data: formatted }), { status: 200 });
  } catch (error) {
    console.error("Error fetching saved opportunities:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
    });
  }
}
