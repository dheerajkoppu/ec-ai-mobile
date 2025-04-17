import { neon } from "@neondatabase/serverless";

export async function POST(request: Request) {
  try {
    const sql = neon(`${process.env.DATABASE_URL}`);
    const { email } = await request.json();
    if (!email) {
      return Response.json({ error: "Missing user email" }, { status: 400 });
    }

    // 1) Fetch user
    const [user] = await sql`
            SELECT *
            FROM users
            WHERE email = ${email}
                LIMIT 1;
        `;
    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    // 2) Fetch all opportunities in one go
    const opportunities = await sql`
            SELECT *
            FROM opportunities;
        `;

    // Build the prompt
    const prompt = `
You are an experienced college and career advisor trained to match students with extracurricular activities that align with their personal story, ambitions, and goals.

Meet ${user.name}, a ${user.age}-year-old student in ${user.grade_level} at ${user.school_name} in ${user.city}. As a ${user.race_ethnicity}, ${user.gender} student, ${user.name} has already overcome unique challenges. ${
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
    }. They are most motivated by activities that ${
      Array.isArray(user.extracurricular_motivation)
        ? user.extracurricular_motivation.join(", ")
        : user.extracurricular_motivation
    } and aim to one day ${user.field_goal}.

${user.name} is ${
      user.seeking_leadership
        ? "actively seeking leadership roles"
        : "more focused on learning and exploring"
    }, and ${
      user.open_to_own_project
        ? "is even open to launching a personal project"
        : "prefers structured programs and mentorship"
    }. They prefer activities that are ${user.extracurricular_format} with a weekly commitment of around ${user.weekly_commitment}. They ${
      user.interested_in_travel
        ? "are open to traveling for the right experience"
        : "prefer local or virtual options"
    } and ${
      user.interested_in_paid_opportunities
        ? "would ideally like paid opportunities"
        : "are not focused on payment but rather impact and growth"
    }. They're looking for opportunities that are ${
      user.opportunity_selectivity
        ? user.opportunity_selectivity.toLowerCase()
        : "unspecified"
    } in selectivity.

Here is a list of extracurricular opportunities available:
${JSON.stringify(opportunities)}

From the above information, choose the top 3 extracurricular opportunities that best match this student's background, interests, and goals. For each recommendation, provide exactly 3 reasons (each no more than five words).

Return ONLY your answer as raw JSON, with no markdown formatting, code fences, or any additional text. For example, the output should look exactly like this (without extra characters):

[[1, "reason1", "reason2", "reason3"], [2, "reason1", "reason2", "reason3"], [3, "reason1", "reason2", "reason3"]]
`;

    // Call the ChatGPT API
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
      return Response.json(
        { error: "Error calling OpenAI API" },
        { status: 500 },
      );
    }

    // Parse the AI response
    const rawResponse = await chatResponse.text();
    let chatData;
    try {
      chatData = JSON.parse(rawResponse);
    } catch (err) {
      console.error("Failed to parse JSON:", err);
      return Response.json(
        { error: "Failed to parse JSON from ChatGPT API" },
        { status: 500 },
      );
    }
    if (!chatData?.choices?.length) {
      console.error("Invalid response structure:", chatData);
      return Response.json(
        { error: "Invalid response from ChatGPT API" },
        { status: 500 },
      );
    }
    const responseText = chatData.choices[0].message.content.trim();
    if (!responseText) {
      console.error("No content in ChatGPT response");
      return Response.json(
        { error: "No content in ChatGPT response" },
        { status: 500 },
      );
    }

    // Parse suggestions
    type Suggestion = [string, string, string, string];
    let suggestions: Suggestion[];
    try {
      suggestions = JSON.parse(responseText);
    } catch (err) {
      console.error("Error parsing suggestions:", err, responseText);
      return Response.json(
        { error: "Error parsing ChatGPT suggestions" },
        { status: 500 },
      );
    }

    // Map IDs to reasons
    const suggestionMap: Record<number, [string, string, string]> = {};
    const activityIds = suggestions.map(([id, r1, r2, r3]) => {
      const num = parseInt(id, 10);
      suggestionMap[num] = [r1, r2, r3];
      return num;
    });

    // Enrich results by filtering the already-fetched opportunities
    const enrichedActivities = opportunities
      .filter((op) => activityIds.includes(op.id))
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
        top_3_reasons: suggestionMap[op.id] || [],
      }));

    return new Response(JSON.stringify({ enrichedActivities }), {
      status: 200,
    });
  } catch (error) {
    console.error("Error in API route:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
