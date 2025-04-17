import { neon } from "@neondatabase/serverless";

export async function POST(request: Request) {
  try {
    const sql = neon(`${process.env.DATABASE_URL}`);
    const { email, activity_id } = await request.json();

    if (!email) {
      return Response.json({ error: "Missing user email" }, { status: 400 });
    }
    if (!activity_id) {
      return Response.json({ error: "Missing activity id" }, { status: 400 });
    }

    // Get the user record
    const [user] = await sql`
      SELECT *
      FROM users
      WHERE email = ${email}
      LIMIT 1;
    `;
    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    // Get the activity record for the user from the activities table
    const [activity] = await sql`
      SELECT name, roles
      FROM activities
      WHERE id = ${activity_id} AND user_id = ${user.id}
      LIMIT 1;
    `;
    if (!activity) {
      return Response.json(
        { error: "Activity not found for this user" },
        { status: 404 },
      );
    }

    // Get all logged hours descriptions for the activity
    const loggedHours = await sql`
      SELECT description
      FROM hours_logged
      WHERE activity_id = ${activity_id};
    `;
    const allLoggedDescriptions = loggedHours
      .map((row: any) => row.description)
      .join(" ");

    // Build the prompt for ChatGPT
    const prompt = `
Act as an elite university admissions officer at an Ivy League. From the provided data about a student's extracurricular activity, write a polished 150-character description suitable for Ivy League application summaries. Focus on highlighting impact, leadership, uniqueness, or sustained commitment. Use elevated but natural language. Only use “I” as a pronoun; no other pronouns. Only return the 150-character description, nothing more.
Name: ${activity.name}
Roles: ${activity.roles}
All Logged Hours Descriptions: ${allLoggedDescriptions}
    `.trim();

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

    const responseData = await chatResponse.json();
    const result = responseData.choices?.[0]?.message?.content?.trim();
    if (!result) {
      console.error("No content returned from ChatGPT API", responseData);
      return Response.json(
        { error: "No content returned from ChatGPT API" },
        { status: 500 },
      );
    }

    console.log("Response:", responseData);
    // Return the 150-character description as JSON
    return new Response(JSON.stringify({ description: result }), {
      status: 200,
    });
  } catch (error) {
    console.error("Error in API route:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
