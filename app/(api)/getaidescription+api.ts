import { neon } from "@neondatabase/serverless";

export async function POST(request: Request) {
  try {
    const { email, activity_id } = await request.json();
    if (!email || !activity_id) {
      return new Response(JSON.stringify({ error: "Missing params" }), {
        status: 400,
      });
    }

    const sql = neon(process.env.DATABASE_URL as string);

    // Fetch activity name, roles, and all logged hour descriptions
    const [row] = await sql`
      SELECT
        a.name,
        a.roles,
        COALESCE(json_agg(h.description), '[]') AS descriptions
      FROM users u
      JOIN activities a
        ON a.user_id = u.id
       AND u.email = ${email}
       AND a.id = ${activity_id}
      LEFT JOIN hours_logged h
        ON h.activity_id = a.id
      GROUP BY a.name, a.roles
    `;

    if (!row) {
      return new Response(JSON.stringify({ error: "Not found" }), {
        status: 404,
      });
    }
    // Generate prompt from DB values
    const allLoggedDescriptions = (row.descriptions as string[]).join(" ");
    const prompt = `
Act as an elite university admissions officer at an Ivy League. From the provided data about a student's extracurricular activity, write a polished 150-character description suitable for Ivy League application summaries. Focus on highlighting impact, leadership, uniqueness, or sustained commitment. Use elevated but natural language. Only use “I” as a pronoun; no other pronouns. Only return the 150-character description, nothing more.
Name: ${row.name}
Roles: ${row.roles}
All Logged Hours Descriptions: ${allLoggedDescriptions}
    `.trim();

    // Call OpenAI for description generation
    const chatRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4.1-nano",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!chatRes.ok) {
      console.error(await chatRes.text());
      return new Response(JSON.stringify({ error: "OpenAI API error" }), {
        status: 500,
      });
    }

    const { choices } = await chatRes.json();
    const description = choices?.[0]?.message?.content?.trim();
    return new Response(JSON.stringify({ description }), { status: 200 });
  } catch (err: any) {
    console.error(err);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
    });
  }
}
