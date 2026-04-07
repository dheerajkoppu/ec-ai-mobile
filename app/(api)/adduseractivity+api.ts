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
        (SELECT id FROM users WHERE clerk_id = ${clerkId} LIMIT 1),
        ${name},
        ${activity_type},
        ${hours_per_week},
        ${weeks_per_year},
        ${roles},
        ${description},
        ${grades}
      );
    `;

    return new Response(JSON.stringify({ data: response }), { status: 201 });
  } catch (error) {
    console.error("Error creating activity:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
