import { neon } from "@neondatabase/serverless";

export async function POST(request: Request) {
  try {
    const sql = neon(`${process.env.DATABASE_URL}`);
    const { user_id, activity_id } = await request.json();

    if (!user_id || !activity_id) {
      return new Response(JSON.stringify({ error: "Missing fields" }), {
        status: 400,
      });
    }

    const logs = await sql`
      SELECT date_of_activity, hours_logged, description
      FROM hours_logged
      WHERE user_id = ${user_id} AND activity_id = ${activity_id}
      ORDER BY date_of_activity DESC;
    `;

    return new Response(JSON.stringify({ data: logs }), { status: 200 });
  } catch (error) {
    console.error("Error fetching activity logs:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
    });
  }
}
