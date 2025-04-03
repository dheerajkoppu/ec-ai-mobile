import nodemailer from "nodemailer";

export async function POST(request: Request) {
  try {
    const { userEmail } = await request.json();

    if (!userEmail) {
      return Response.json({ error: "Missing userEmail" }, { status: 400 });
    }

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
      subject: "User Data Request",
      text: `The user with email ${userEmail} has requested a copy of their user data. Please give their users table, activity table, and user saved opportunities table.`,
    });

    return new Response(
      JSON.stringify({ message: "Email sent confirming user data request." }),
      { status: 200 },
    );
  } catch (error) {
    console.error("Error sending data request email:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
