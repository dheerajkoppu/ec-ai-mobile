import { neon } from "@neondatabase/serverless";
import nodemailer from "nodemailer";

export async function DELETE(request: Request) {
  try {
    const sql = neon(`${process.env.DATABASE_URL}`);
    const { userEmail } = await request.json();

    if (!userEmail) {
      return Response.json({ error: "Missing userEmail" }, { status: 400 });
    }

    // Step 1: Get user ID
    const userIdResult = await sql`
      SELECT id FROM users WHERE email = ${userEmail} LIMIT 1;
    `;
    const userId = userIdResult[0]?.id;

    if (!userId) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    // Step 2 + 3: Delete activities and user in parallel
    const deleteQueries = Promise.all([
      sql`DELETE FROM activities WHERE user_id = ${userId};`,
      sql`DELETE FROM users WHERE id = ${userId};`,
    ]);

    // Step 4: Send email notification (run in parallel too)
    const sendEmail = (async () => {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.ADMIN_EMAIL,
          pass: process.env.ADMIN_EMAIL_PASS,
        },
      });

      await transporter.sendMail({
        from: `"EC AI" <${process.env.ADMIN_EMAIL}>`,
        to: "ask.ecai@gmail.com",
        subject: "User Deletion Request",
        text: `The user with email ${userEmail} has requested account deletion.`,
      });
    })();

    // Wait for both SQL deletions and email to complete
    await Promise.all([deleteQueries, sendEmail]);

    return new Response(
      JSON.stringify({ message: "User deleted and email sent." }),
      { status: 200 },
    );
  } catch (error) {
    console.error("Error deleting user and sending email:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
