import { sql } from "@/lib/db";
import { requireAuth, unauthorizedResponse } from "@/lib/serverAuth";
import { resend, FROM_ADDRESS } from "@/lib/resend";

export async function POST(request: Request) {
  let clerkId: string;
  try {
    clerkId = await requireAuth(request);
  } catch {
    return unauthorizedResponse();
  }

  try {
    const { opportunity_id, reason, details } = await request.json();

    if (!opportunity_id || !reason) {
      return Response.json(
        { error: "Missing required fields" },
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

    await sql`
      INSERT INTO reported_opportunities (clerk_id, opportunity_id, reason, details)
      VALUES (${clerkId}, ${parsedOpportunityId}, ${reason}, ${details || null});
    `;

    await resend.emails.send({
      from: FROM_ADDRESS,
      to: "ask.ecai@gmail.com",
      subject: "New Opportunity Report Submitted",
      text: `
A new opportunity has been reported:

Opportunity ID: ${parsedOpportunityId}
Reason: ${reason}
Details: ${details || "(No additional details provided)"}
      `,
    });

    return new Response(JSON.stringify({ message: "Report submitted." }), {
      status: 200,
    });
  } catch (error) {
    console.error("Error reporting opportunity:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
