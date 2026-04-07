import { sql } from "@/lib/db";
import { requireAuth, unauthorizedResponse } from "@/lib/serverAuth";
import { resend, FROM_ADDRESS } from "@/lib/resend";

export async function DELETE(request: Request) {
  let clerkId: string;
  try {
    clerkId = await requireAuth(request);
  } catch {
    return unauthorizedResponse();
  }

  try {
    // Delete user and their activities; get email for the notification
    const deletionResult = await sql`
      WITH target_user AS (
        SELECT id, email FROM users WHERE clerk_id = ${clerkId} LIMIT 1
      ),
      deleted_activities AS (
        DELETE FROM activities WHERE user_id = (SELECT id FROM target_user)
      )
      DELETE FROM users
      WHERE id = (SELECT id FROM target_user)
      RETURNING email;
    `;

    if (deletionResult.length === 0) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    const userEmail = deletionResult[0].email;

    await resend.emails.send({
      from: FROM_ADDRESS,
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
