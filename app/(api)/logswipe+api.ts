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
    const { opportunityId, liked } = await request.json();

    if (!opportunityId || liked === undefined) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const inserted = await sql`
      INSERT INTO user_swipes (user_clerk_id, opportunity_id, liked)
      VALUES (${clerkId}, ${opportunityId}, ${liked})
      RETURNING *;
    `;

    return new Response(JSON.stringify({ data: inserted }), { status: 200 });
  } catch (error) {
    console.error("Error logging swipe:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
