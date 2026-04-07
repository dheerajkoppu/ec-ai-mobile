import { sql } from "@/lib/db";
import { requireAuth, unauthorizedResponse } from "@/lib/serverAuth";

export async function POST(request: Request) {
  let clerkId: string;
  try {
    clerkId = await requireAuth(request);
  } catch {
    return unauthorizedResponse();
  }

  try {
    const [recentLogs, totalHoursResult] = await Promise.all([
      sql`
        SELECT hl.description, hl.date_of_activity
        FROM users u
        JOIN activities a
          ON a.user_id = u.id
        JOIN hours_logged hl
          ON hl.activity_id = a.id
        WHERE u.clerk_id = ${clerkId}
          AND (
            hl.user_id = u.clerk_id
            OR hl.user_id = u.id::text
          )
        ORDER BY hl.date_of_activity DESC
        LIMIT 3;
      `,
      sql`
        SELECT SUM(hl.hours_logged) as total_hours
        FROM users u
        JOIN activities a
          ON a.user_id = u.id
        JOIN hours_logged hl
          ON hl.activity_id = a.id
        WHERE u.clerk_id = ${clerkId}
          AND (
            hl.user_id = u.clerk_id
            OR hl.user_id = u.id::text
          );
      `,
    ]);

    const total_hours =
      totalHoursResult[0]?.total_hours !== null
        ? parseFloat(totalHoursResult[0].total_hours)
        : 0;

    return new Response(JSON.stringify({ data: recentLogs, total_hours }), {
      status: 200,
    });
  } catch (error) {
    console.error("Error fetching logged hours:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
    });
  }
}
