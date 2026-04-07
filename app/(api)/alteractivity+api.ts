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
    const {
      activityId,
      name,
      category,
      roles,
      grade,
      hoursPerWeek,
      weeksPerYear,
      description,
    } = await request.json();

    if (!activityId) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Update only if the activity belongs to the authenticated user
    const updatedActivity = await sql`
      UPDATE activities a
      SET
        name        = ${name},
        activity_type = ${category},
        roles       = ${roles},
        grades      = ${grade},
        hours_per_week  = ${hoursPerWeek},
        weeks_per_year  = ${weeksPerYear},
        description = ${description}
      FROM users u
      WHERE a.user_id = u.id
        AND u.clerk_id = ${clerkId}
        AND a.id = ${activityId}
      RETURNING a.id, a.name, a.activity_type, a.roles, a.grades,
                a.hours_per_week, a.weeks_per_year, a.description;
    `;

    return new Response(JSON.stringify({ data: updatedActivity }), {
      status: 200,
    });
  } catch (error) {
    console.error("Error updating activity:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
