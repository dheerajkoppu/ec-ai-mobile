import { Resend } from "resend";
const resend = new Resend(process.env.RESEND_API_KEY!);

export async function POST(request: Request) {
  const { email, pdfBase64 } = await request.json();

  if (!email || !pdfBase64) {
    return new Response(JSON.stringify({ error: "Bad payload" }), {
      status: 400,
    });
  }

  // Send email with attached PDF
  await resend.emails.send({
    from: "EC-AI <support@ec-ai.app>",
    to: email,
    replyTo: "ask.ecai@gmail.com",
    subject: "Your EC‑AI Activities PDF",
    text: "Hello,\n\nAttached is your activities PDF.\n\nSincerely,\nEC-AI",
    attachments: [
      {
        filename: "activities.pdf",
        content: pdfBase64,
      },
    ],
  });

  return new Response(JSON.stringify({ sent: true }), { status: 200 });
}
