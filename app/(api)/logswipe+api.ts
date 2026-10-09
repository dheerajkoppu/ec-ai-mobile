import { sql } from "@/lib/db";
import { deleteServerCache } from "@/lib/serverCache";
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

    const normalizedOpportunityId = String(opportunityId).trim();
    if (!/^\d+$/.test(normalizedOpportunityId)) {
      return Response.json(
        { error: "Invalid opportunityId" },
        { status: 400 },
      );
    }
    const parsedOpportunityId = Number.parseInt(normalizedOpportunityId, 10);

    const inserted = await sql`
      INSERT INTO user_swipes (user_clerk_id, opportunity_id, liked)
      VALUES (${clerkId}, ${parsedOpportunityId}, ${liked})
      RETURNING *;
    `;

    await deleteServerCache(`recommendations:${clerkId}:v1`);

    return new Response(JSON.stringify({ data: inserted }), { status: 200 });
  } catch (error) {
    console.error("Error logging swipe:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
