import { Resend } from "resend";
import { createClerkClient } from "@clerk/backend";
import { requireAuth, unauthorizedResponse } from "@/lib/serverAuth";

const resend = new Resend(process.env.RESEND_API_KEY);
const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY!,
});

export async function POST(request: Request) {
  let clerkId: string;
  try {
    clerkId = await requireAuth(request);
  } catch {
    return unauthorizedResponse();
  }

  try {
    // Derive email from Clerk — never trust caller-supplied address
    const clerkUser = await clerkClient.users.getUser(clerkId);
    const userEmail = clerkUser.emailAddresses.find(
      (entry) => entry.id === clerkUser.primaryEmailAddressId,
    )?.emailAddress;

    if (!userEmail) {
      return Response.json({ error: "No email on account" }, { status: 422 });
    }

    await resend.emails.send({
      from: "EC-AI <support@ec-ai.app>",
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
