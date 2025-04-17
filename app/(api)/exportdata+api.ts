import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const { userEmail } = await request.json();

    if (!userEmail) {
      return Response.json({ error: "Missing userEmail" }, { status: 400 });
    }

    await resend.emails.send({
      from: "EC AI <onboarding@resend.dev>", // Use a domain you've verified
      to: "ask.ecai@gmail.com",
      subject: "User Data Request",
      text: `The user with email ${userEmail} has requested a copy of their user data. Please give their users table, activity table, and user saved opportunities table.`,
    });

    return new Response(
      JSON.stringify({ message: "Email sent confirming user data request." }),
      { status: 200 },
    );
  } catch (error) {
    console.error("Error sending email via Resend:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
