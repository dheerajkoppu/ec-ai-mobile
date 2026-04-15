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
      UPDATE activities
      SET
        name = ${name},
        activity_type = ${category},
        roles = ${roles},
        grades = ${grade},
        hours_per_week = ${hoursPerWeek},
        weeks_per_year = ${weeksPerYear},
        description = ${description}
      WHERE clerk_id = ${clerkId}
        AND id = ${activityId}
      RETURNING
        id,
        name,
        activity_type,
        roles,
        grades,
        hours_per_week,
        weeks_per_year,
        description;
    `;

    return new Response(JSON.stringify({ data: updatedActivity }), {
      status: 200,
    });
  } catch (error) {
    console.error("Error updating activity:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
