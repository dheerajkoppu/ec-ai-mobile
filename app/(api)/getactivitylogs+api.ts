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
    const { activity_id } = await request.json();

    if (!activity_id) {
      return new Response(JSON.stringify({ error: "Missing fields" }), {
        status: 400,
      });
    }

    const logs = await sql`
      SELECT hl.date_of_activity, hl.hours_logged, hl.description
      FROM hours_logged hl
      JOIN activities a ON a.id = hl.activity_id
      WHERE a.clerk_id = ${clerkId}
        AND hl.activity_id = ${activity_id}
      ORDER BY hl.date_of_activity DESC;
    `;

    return new Response(JSON.stringify({ data: logs }), { status: 200 });
  } catch (error) {
    console.error("Error fetching activity logs:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
    });
  }
}
