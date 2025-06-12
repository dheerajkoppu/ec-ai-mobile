import { neon } from "@neondatabase/serverless";

export async function POST(request: Request) {
  try {
    const sql = neon(`${process.env.DATABASE_URL}`);
    const {
      userEmail,
      activityId,
      name,
      category,
      roles,
      grade,
      hoursPerWeek,
      weeksPerYear,
      description,
    } = await request.json();

    if (!userEmail || !activityId) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Update the activity if it belongs to the user with the given email
    const updatedActivity = await sql`
            UPDATE activities a
            SET
                name = ${name},
                activity_type = ${category},
                roles = ${roles},
                grades = ${grade},
                hours_per_week = ${hoursPerWeek},
                weeks_per_year = ${weeksPerYear},
                description = ${description}
                FROM users u
            WHERE a.user_id = u.id
              AND u.email = ${userEmail}
              AND a.id = ${activityId}
                RETURNING a.id, a.name, a.activity_type, a.roles, a.grades, a.hours_per_week, a.weeks_per_year, a.description;
        `;

    return new Response(JSON.stringify({ data: updatedActivity }), {
      status: 200,
    });
  } catch (error) {
    console.error("Error updating activity:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
