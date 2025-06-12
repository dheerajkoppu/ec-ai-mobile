import { neon } from "@neondatabase/serverless";

export async function POST(request: Request) {
  try {
    const sql = neon(`${process.env.DATABASE_URL}`);
    const { user_id } = await request.json();

    if (!user_id) {
      return new Response(JSON.stringify({ error: "Missing user ID" }), {
        status: 400,
      });
    }

    // Fetch the 3 most recent activity logs for the user
    const recentLogs = await sql`
      SELECT description, date_of_activity
      FROM hours_logged
      WHERE user_id = ${user_id}
      ORDER BY date_of_activity DESC
        LIMIT 3;
    `;

    // Aggregate total hours logged by the user
    const totalHoursResult = await sql`
      SELECT SUM(hours_logged) as total_hours
      FROM hours_logged
      WHERE user_id = ${user_id};
    `;

    // Fallback to 0 if no hours are logged
    const total_hours =
      totalHoursResult[0]?.total_hours !== null
        ? parseFloat(totalHoursResult[0].total_hours)
        : 0;

    return new Response(
      JSON.stringify({
        data: recentLogs,
        total_hours,
      }),
      { status: 200 },
    );
  } catch (error) {
    console.error("Error fetching logged hours:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
    });
  }
}
