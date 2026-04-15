import { sql } from "@/lib/db";
import { callOpenAI } from "@/lib/openai";
import { requireAuth, unauthorizedResponse } from "@/lib/serverAuth";

export async function POST(request: Request) {
  try {
    // Opportunities are public reference data; auth is enforced to require sign-in
    await requireAuth(request);
  } catch {
    return unauthorizedResponse();
  }

  try {
    const { activity_id } = await request.json();
    if (!activity_id) {
      return new Response(JSON.stringify({ error: "Missing activity_id" }), {
        status: 400,
      });
    }

    const [opportunity] = await sql`
      SELECT
        activity_name,
        school,
        career_field,
        activity_type,
        location,
        duration,
        deadline,
        description,
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
        hours_per_week
      FROM opportunities
      WHERE id = ${activity_id}
        LIMIT 1
    `;

    if (!opportunity) {
      return new Response(JSON.stringify({ error: "Opportunity not found" }), {
        status: 404,
      });
    }

    const prompt = `
You are a top-tier college advisor helping high school students choose extracurriculars that will impress Ivy League admissions officers. Based on the opportunity info below, generate the top 3 compelling reasons a student should consider joining this opportunity. Focus on leadership, uniqueness, selectivity, skill development, or long-term impact. Format your response as a numbered list (1., 2., 3.). Do not exceed 600 characters total.

Activity Name: ${opportunity.activity_name}
School/Org: ${opportunity.school}
Field: ${opportunity.career_field}
Type: ${opportunity.activity_type}
Location: ${opportunity.location}
Duration: ${opportunity.duration}
Deadline: ${opportunity.deadline}
City: ${opportunity.primary_city}
Hours/Week: ${opportunity.hours_per_week}
Description: ${opportunity.description}
GPA Requirement: ${opportunity.min_gpa}
SAT/ACT: ${opportunity.min_sat}, ${opportunity.min_act}
PSAT: ${opportunity.min_psat}
Leadership Roles Available: ${opportunity.has_leadership_roles ? "Yes" : "No"}
Selective: ${opportunity.selectivity_level}
First Gen/FRL Only: ${opportunity.only_first_gen ? "Yes" : "No"}, ${opportunity.only_frl_students ? "Yes" : "No"}
Outside US: ${opportunity.outside_us ? "Yes" : "No"}
    `.trim();

    const reasons = await callOpenAI(prompt);
    return new Response(JSON.stringify({ reasons }), { status: 200 });
  } catch (err: any) {
    console.error(err);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
    });
  }
}
