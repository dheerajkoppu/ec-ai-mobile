import { sql } from "@/lib/db";
import { requireAuth, unauthorizedResponse } from "@/lib/serverAuth";
import { sendEmail, FROM_ADDRESS } from "@/lib/resend";

export async function DELETE(request: Request) {
  let clerkId: string;
  try {
    clerkId = await requireAuth(request);
  } catch {
    return unauthorizedResponse();
  }

  try {
    // One statement deletes the user and their activities and returns the email for the notice
    const deletionResult = await sql`
      WITH deleted_activities AS (
        DELETE FROM activities WHERE clerk_id = ${clerkId}
      )
      DELETE FROM users
      WHERE clerk_id = ${clerkId}
      RETURNING email;
    `;

    if (deletionResult.length === 0) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    const userEmail = deletionResult[0].email;

    // The rows are already deleted, so a failed notice is logged instead of failing the request
    await sendEmail({
      from: FROM_ADDRESS,
      to: "ask.ecai@gmail.com",
      subject: "User Deletion Request",
      text: `The user with email ${userEmail} has requested account deletion. Please delete the user from both Clerk and RevenueCat`,
    }).catch((error) => {
      console.error(`Deletion notice failed for ${clerkId}:`, error);
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
