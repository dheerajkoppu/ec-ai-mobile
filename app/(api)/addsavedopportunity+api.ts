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
    const { opportunity_id } = await request.json();

    if (!opportunity_id) {
      return Response.json(
        { error: "Missing required field: opportunity_id" },
        { status: 400 },
      );
    }

    const normalizedOpportunityId = String(opportunity_id).trim();
    if (!/^\d+$/.test(normalizedOpportunityId)) {
      return Response.json(
        { error: "Invalid opportunity_id" },
        { status: 400 },
      );
    }
    const parsedOpportunityId = Number.parseInt(normalizedOpportunityId, 10);

    const response = await sql`
      INSERT INTO user_saved_opportunities (clerk_id, opportunity_id)
      VALUES (${clerkId}, ${parsedOpportunityId});
    `;

    deleteServerCache(`recommendations:${clerkId}:v1`);

    return new Response(JSON.stringify({ data: response }), { status: 201 });
  } catch (error) {
    console.error("Error saving opportunity:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
