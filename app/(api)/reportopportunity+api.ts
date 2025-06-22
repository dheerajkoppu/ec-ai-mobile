import { neon } from "@neondatabase/serverless";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const sql = neon(`${process.env.DATABASE_URL}`);
    const { clerk_id, opportunity_id, reason, details } = await request.json();

    if (!clerk_id || !opportunity_id || !reason) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Insert report into DB
    await sql`
      INSERT INTO reported_opportunities (clerk_id, opportunity_id, reason, details)
      VALUES (${clerk_id}, ${opportunity_id}, ${reason}, ${details || null});
    `;

    // Send email
    await resend.emails.send({
      from: "EC-AI <support@ec-ai.app>",
      to: "ask.ecai@gmail.com",
      subject: "New Opportunity Report Submitted",
      text: `
        A new opportunity has been reported:

        Opportunity ID: ${opportunity_id}
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
