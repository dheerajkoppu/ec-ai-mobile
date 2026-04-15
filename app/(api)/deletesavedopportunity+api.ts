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
    const { opportunity_id } = await request.json();

    if (!opportunity_id) {
      return new Response(
        JSON.stringify({ error: "Missing required field: opportunity_id" }),
        { status: 400 },
      );
    }

    const normalizedOpportunityId = String(opportunity_id).trim();
    if (!/^\d+$/.test(normalizedOpportunityId)) {
      return new Response(
        JSON.stringify({ error: "Invalid opportunity_id" }),
        { status: 400 },
      );
    }
    const parsedOpportunityId = Number.parseInt(normalizedOpportunityId, 10);

    const response = await sql`
      DELETE FROM user_saved_opportunities
      WHERE clerk_id = ${clerkId} AND opportunity_id = ${parsedOpportunityId};
    `;

    return new Response(JSON.stringify({ data: response }), { status: 200 });
  } catch (error) {
    console.error("Error removing saved opportunity:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
    });
  }
}
