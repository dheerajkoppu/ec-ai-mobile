import { neon } from "@neondatabase/serverless";

export async function POST(request: Request) {
  try {
    const sql = neon(`${process.env.DATABASE_URL}`);
    // Extract fields from request body
    const {
      userEmail,
      name,
      activity_type,
      hours_per_week,
      weeks_per_year,
      roles,
      description,
      grades,
    } = await request.json();

    if (
      !userEmail ||
      !name ||
      !activity_type ||
      !hours_per_week ||
      !weeks_per_year ||
      !roles ||
      !description ||
      !grades
    ) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Insert new activity with user_id looked up from email
    const response = await sql`
            INSERT INTO activities (
                user_id,
                name,
                activity_type,
                hours_per_week,
                weeks_per_year,
                roles,
                description,
                grades
            )
            VALUES (
                           (SELECT id FROM users WHERE email = ${userEmail} LIMIT 1),
                ${name},
                ${activity_type},
                ${hours_per_week},
                ${weeks_per_year},
                ${roles},
                ${description},
                ${grades}
                );`;

    return new Response(JSON.stringify({ data: response }), {
      status: 201,
    });
  } catch (error) {
    console.error("Error creating activity:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
