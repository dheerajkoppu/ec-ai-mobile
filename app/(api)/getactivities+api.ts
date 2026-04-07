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
    const activities = await sql`
      SELECT
        a.id,
        a.name,
        INITCAP(a.activity_type) as category,
        a.hours_per_week,
        a.weeks_per_year,
        a.roles,
        a.description,
        a.grades
      FROM activities a
             JOIN users u ON a.user_id = u.id
      WHERE u.clerk_id = ${clerkId}
      ORDER BY a.id ASC;
    `;

    let totalHoursPerWeek = 0;

    const formatted = activities.map((a: any) => {
      totalHoursPerWeek += a.hours_per_week;
      return {
        id: a.id,
        name: a.name,
        category: a.category,
        hours: a.hours_per_week * a.weeks_per_year,
        hoursPerWeek: a.hours_per_week,
        weeksPerYear: a.weeks_per_year,
        roles: a.roles,
        description: a.description,
        grade: a.grades,
      };
    });

    return new Response(
      JSON.stringify({ data: formatted, totalHoursPerWeek }),
      { status: 200 },
    );
  } catch (error) {
    console.error("Error fetching activities:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
