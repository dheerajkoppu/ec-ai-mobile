import { sql } from "@/lib/db";
import { callOpenAI } from "@/lib/openai";
import { requireAuth, unauthorizedResponse } from "@/lib/serverAuth";

export async function POST(request: Request) {
  let clerkId: string;
  try {
    clerkId = await requireAuth(request);
  } catch {
    return unauthorizedResponse();
  }

  try {
    const [row] = await sql`
      SELECT
        u.name,
        u.age,
        u.grade_level,
        u.race_ethnicity,
        u.gender,
        u.free_reduced_lunch,
        u.first_gen_college,
        u.gpa_weighted,
        u.gpa_unweighted,
        u.career_interest,
        u.interested_in_research,
        u.wants_to_start_business,
        u.extracurricular_motivation,
        u.field_goal,
        u.seeking_leadership,
        u.extracurricular_format,
        u.weekly_commitment,
        u.interested_in_travel,
        u.interested_in_paid_opportunities,
        u.opportunity_selectivity,
        (
          SELECT json_agg(
            json_build_object(
              'id', o.id,
              'school', o.school,
              'activity_name', o.activity_name,
              'career_field', o.career_field,
              'activity_type', o.activity_type,
              'location', o.location,
              'duration', o.duration,
              'deadline', o.deadline,
              'application_link', o.application_link,
              'grade_requirements', o.grade_requirements,
              'race_requirements', o.race_requirements,
              'gender_requirements', o.gender_requirements,
              'age_requirements', o.age_requirements,
              'primary_city', o.primary_city,
              'only_frl_students', o.only_frl_students,
              'only_first_gen', o.only_first_gen,
              'min_gpa', o.min_gpa,
              'min_sat', o.min_sat,
              'min_act', o.min_act,
              'min_psat', o.min_psat,
              'has_leadership_roles', o.has_leadership_roles,
              'selectivity_level', o.selectivity_level,
              'outside_us', o.outside_us,
              'hours_per_week', o.hours_per_week,
              'created_at', o.created_at
            )
          )
          FROM opportunities o
        ) AS opportunities
      FROM users u
      WHERE u.clerk_id = ${clerkId}
      LIMIT 1;
    `;

    if (!row) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
      });
    }

    const user = {
      name: row.name,
      age: row.age,
      grade_level: row.grade_level,
      race_ethnicity: row.race_ethnicity,
      gender: row.gender,
      free_reduced_lunch: row.free_reduced_lunch,
      first_gen_college: row.first_gen_college,
      gpa_weighted: row.gpa_weighted,
      gpa_unweighted: row.gpa_unweighted,
      career_interest: row.career_interest,
      interested_in_research: row.interested_in_research,
      wants_to_start_business: row.wants_to_start_business,
      extracurricular_motivation: row.extracurricular_motivation,
      field_goal: row.field_goal,
      seeking_leadership: row.seeking_leadership,
      extracurricular_format: row.extracurricular_format,
      weekly_commitment: row.weekly_commitment,
      interested_in_travel: row.interested_in_travel,
      interested_in_paid_opportunities: row.interested_in_paid_opportunities,
      opportunity_selectivity: row.opportunity_selectivity,
    };

    const opportunities = row.opportunities as any[];

    const prompt = `
You are an experienced college and career advisor trained to match students with extracurricular activities that align with their personal story, ambitions, and goals.

Meet ${user.name}, a ${user.age}-year-old student in ${user.grade_level}. As a ${user.race_ethnicity}, ${user.gender} student, ${user.name} has already overcome unique challenges. ${
      user.free_reduced_lunch && user.first_gen_college
        ? "They receive free or reduced lunch and are the first in their family to pursue college."
        : "They are determined to make the most of the opportunities available to them."
    } With a weighted GPA of ${user.gpa_weighted} and unweighted GPA of ${user.gpa_unweighted}, ${user.name} is academically driven and shows strong potential.

${user.name} is especially interested in ${user.career_interest}, and ${
      user.interested_in_research
        ? "is also interested in research"
        : "is exploring various fields through hands-on experiences"
    }. They ${
      user.wants_to_start_business
        ? "dream of starting their own business"
        : "are open to creative, leadership-driven opportunities"
    }. They are most motivated by ${
      Array.isArray(user.extracurricular_motivation)
        ? user.extracurricular_motivation.join(", ")
        : user.extracurricular_motivation
    } and aim to one day ${user.field_goal}.

${user.name} is ${
      user.seeking_leadership
        ? "actively seeking leadership roles"
        : "more focused on learning and exploring"
    }, and ${
      user.extracurricular_format
        ? "prefers structured programs and mentorship"
        : "has no preference for format"
    }. They prefer activities that are ${user.extracurricular_format} with a weekly commitment of around ${user.weekly_commitment}. They ${
      user.interested_in_travel
        ? "are open to traveling for the right experience"
        : "prefer local or virtual options"
    } and ${
      user.interested_in_paid_opportunities
        ? "would ideally like paid opportunities"
        : "are not focused on payment but rather impact and growth"
    }. They're looking for opportunities that are ${
      user.opportunity_selectivity?.toLowerCase() ?? "unspecified"
    } in selectivity.

Here is a list of extracurricular opportunities available:
${JSON.stringify(opportunities)}

From the above information, choose the top 3 extracurricular opportunities that best match this student's background, interests, and goals. For each recommendation, provide exactly 3 reasons (each no more than five words).

Return ONLY your answer as raw JSON, with no markdown formatting, code fences, or any additional text. For example:
[[1, "reason1", "reason2", "reason3"], [2, "reason1", "reason2", "reason3"], [3, "reason1", "reason2", "reason3"]]
`;

    const responseText = await callOpenAI(prompt, "gpt-5-nano");

    type Suggestion = [string, string, string, string];
    let suggestions: Suggestion[];
    try {
      suggestions = JSON.parse(responseText);
    } catch {
      return new Response(
        JSON.stringify({ error: "Error parsing ChatGPT suggestions" }),
        { status: 500 },
      );
    }

    const suggestionMap: Record<number, [string, string, string]> = {};
    const activityIds = suggestions.map(([id, r1, r2, r3]) => {
      const num = parseInt(id, 10);
      suggestionMap[num] = [r1, r2, r3];
      return num;
    });

    const enrichedActivities = opportunities
      .filter((op) => activityIds.includes(Number(op.id)))
      .map((op) => ({
        id: op.id,
        school: op.school,
        title: op.activity_name,
        careerField: op.career_field,
        activityType: op.activity_type,
        location: op.location,
        duration: op.duration,
        deadline: op.deadline,
        apply: op.application_link,
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
        hasLeadershipRoles: op.has_leadership_roles,
        selectivityLevel: op.selectivity_level,
        outsideUS: op.outside_us,
        hoursPerWeek: op.hours_per_week,
        createdAt: op.created_at,
        top_3_reasons: suggestionMap[Number(op.id)] || [],
      }));

    return new Response(JSON.stringify({ enrichedActivities }), {
      status: 200,
    });
  } catch (error) {
    console.error("Error in API route:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
    });
  }
}
