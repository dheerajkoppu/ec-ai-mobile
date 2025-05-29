import { neon } from "@neondatabase/serverless";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function DELETE(request: Request) {
  try {
    const sql = neon(`${process.env.DATABASE_URL}`);
    const { userEmail } = await request.json();

    if (!userEmail) {
      return Response.json({ error: "Missing userEmail" }, { status: 400 });
    }

    // One subrequest to fetch ID and delete records
    const deletionResult = await sql`
      WITH target_user AS (
        SELECT id FROM users WHERE email = ${userEmail} LIMIT 1
        ),
        deleted_activities AS (
      DELETE FROM activities WHERE user_id = (SELECT id FROM target_user)
        )
      DELETE FROM users
      WHERE id = (SELECT id FROM target_user)
        RETURNING id;
    `;

    if (deletionResult.length === 0) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    // Send email via Resend (Edge-compatible)
    await resend.emails.send({
      from: "EC-AI <onboarding@resend.dev>", // still works even without your own domain
      to: "ask.ecai@gmail.com",
      subject: "User Deletion Request",
      text: `The user with email ${userEmail} has requested account deletion. Please delete the user from both Clerk and RevenueCat`,
    });

    return new Response(
      JSON.stringify({ message: "User deleted and email sent." }),
      { status: 200 },
    );
  } catch (error) {
    console.error("Error deleting user and sending email:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
