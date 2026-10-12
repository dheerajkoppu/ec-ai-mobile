import { Resend } from "resend";

export const resend = new Resend(process.env.RESEND_API_KEY!);
export const FROM_ADDRESS = "EC-AI <support@ec-ai.app>";

type EmailPayload = Parameters<typeof resend.emails.send>[0];

// Resend reports a failed send in its return value instead of throwing
export async function sendEmail(payload: EmailPayload): Promise<void> {
  const { error } = await resend.emails.send(payload);

  if (error) {
    throw new Error(`Resend ${error.name}: ${error.message}`);
  }
}
