import { neon } from "@neondatabase/serverless";

export async function POST(request: Request) {
  try {
    const sql = neon(process.env.DATABASE_URL!);
    const { email } = await request.json();

    if (!email) {
      return new Response(JSON.stringify({ error: "Missing user email" }), {
        status: 400,
      });
    }

    // Fetch user and all opportunities from the database
    const [row] = await sql`
      SELECT
        u.*,
        (
          SELECT json_agg(o)
          FROM opportunities o
        ) AS opportunities
      FROM users u
      WHERE u.email = ${email}
        LIMIT 1;
    `;

    if (!row) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
      });
    }

    // Build user profile object for OpenAI prompt
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

    // Prompt engineering to generate top 3 matching opportunities with reasons
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

    // Call OpenAI API to get top 3 recommended opportunities
    const chatResponse = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4.1-nano",
          messages: [{ role: "user", content: prompt }],
        }),
      },
    );

    if (!chatResponse.ok) {
      const errorText = await chatResponse.text();
      console.error("Error calling OpenAI API:", errorText);
      return new Response(
        JSON.stringify({ error: "Error calling OpenAI API" }),
        { status: 500 },
      );
    }

    const rawResponse = await chatResponse.text();

    // ChatGPT sometimes returns plain text instead of JSON — handle both cases
    let chatData;
    try {
      chatData = JSON.parse(rawResponse);
    } catch {
      return new Response(
        JSON.stringify({ error: "Failed to parse JSON from ChatGPT API" }),
        { status: 500 },
      );
    }

    const responseText = chatData.choices?.[0]?.message?.content?.trim();
    if (!responseText) {
      return new Response(
        JSON.stringify({ error: "No content in ChatGPT response" }),
        { status: 500 },
      );
    }

    // Parse the final JSON stringified array of suggestions
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

    // Map suggestion IDs to their reasons
    const suggestionMap: Record<number, [string, string, string]> = {};
    const activityIds = suggestions.map(([id, r1, r2, r3]) => {
      const num = parseInt(id, 10);
      suggestionMap[num] = [r1, r2, r3];
      return num;
    });

    // Attach the top 3 reasons to each recommended opportunity
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
