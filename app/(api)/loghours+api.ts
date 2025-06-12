import { neon } from "@neondatabase/serverless";

export async function POST(request: Request) {
  try {
    const sql = neon(`${process.env.DATABASE_URL}`);
    const {
      user_id,
      activity_id,
      date_of_activity,
      hours_logged,
      description,
    } = await request.json();

    // Validate required fields
    if (!user_id || !activity_id || !date_of_activity || !hours_logged) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Insert a new hours_logged record
    const response = await sql`
      INSERT INTO hours_logged (
        user_id,
        activity_id,
        date_of_activity,
        hours_logged,
        description
      )
      VALUES (
               ${user_id},
               ${activity_id},
               ${date_of_activity},
               ${hours_logged},
               ${description || null}
             );
    `;

    return new Response(JSON.stringify({ data: response }), {
      status: 201,
    });
  } catch (error) {
    console.error("Error logging hours:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
