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
      name,
      activity_type,
      hours_per_week,
      weeks_per_year,
      roles,
      description,
      grades,
    } = await request.json();

    if (
      !name ||
      !activity_type ||
      !hours_per_week ||
      !weeks_per_year ||
      !roles ||
      !grades
    ) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const insertedActivities = await sql`
      INSERT INTO activities (
        user_id,
        clerk_id,
        name,
        activity_type,
        hours_per_week,
        weeks_per_year,
        roles,
        description,
        grades
      )
      SELECT
        u.id,
        ${clerkId},
        ${name},
        ${activity_type},
        ${hours_per_week},
        ${weeks_per_year},
        ${roles},
        ${description},
        ${grades}
      FROM users u
      WHERE u.clerk_id = ${clerkId}
      RETURNING id;
    `;

    if (insertedActivities.length === 0) {
      return Response.json(
        { error: "User profile not found" },
        { status: 404 },
      );
    }

    return new Response(JSON.stringify({ data: insertedActivities[0] }), {
      status: 201,
    });
  } catch (error) {
    console.error("Error creating activity:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
