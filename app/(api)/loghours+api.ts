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
    const { activity_id, date_of_activity, hours_logged, description } =
      await request.json();

    if (!activity_id || !date_of_activity || hours_logged === undefined) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Insert a log only if the activity belongs to the authenticated user.
    // RETURNING lets us reliably detect whether a row was actually written.
    const insertedLogs = await sql`
      INSERT INTO hours_logged (
        user_id,
        activity_id,
        date_of_activity,
        hours_logged,
        description
      )
      SELECT
        u.clerk_id,
        a.id,
        ${date_of_activity},
        ${hours_logged},
        ${description || null}
      FROM users u
      JOIN activities a
        ON a.user_id = u.id
      WHERE u.clerk_id = ${clerkId}
        AND a.id = ${activity_id}
      RETURNING id, user_id, activity_id, date_of_activity, hours_logged, description;
    `;

    if (insertedLogs.length === 0) {
      return Response.json(
        { error: "Activity not found or access denied" },
        { status: 404 },
      );
    }

    return new Response(JSON.stringify({ data: insertedLogs[0] }), {
      status: 201,
    });
  } catch (error) {
    console.error("Error logging hours:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
