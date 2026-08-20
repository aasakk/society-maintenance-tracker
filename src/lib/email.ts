import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail({ to, subject, body }: { to: string; subject: string; body: string }) {
  // If no API key is provided, just log it so the app doesn't crash locally
  if (!process.env.RESEND_API_KEY) {
    console.log(`[Email Mock - Missing API Key] To: ${to} | Subject: ${subject}`);
    return true;
  }

  try {
    await resend.emails.send({
      from: 'Society Tracker <onboarding@resend.dev>', // Resend's default testing sender
      to,
      subject,
      html: body,
    });
    return true;
  } catch (error) {
    console.error("Email send failed:", error);
    return false;
  }
}
