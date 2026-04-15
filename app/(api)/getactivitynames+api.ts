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
        a.name
      FROM activities a
      WHERE a.clerk_id = ${clerkId};
    `;

    return new Response(JSON.stringify({ data: activities }), { status: 200 });
  } catch (error) {
    console.error("Error fetching activities:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
