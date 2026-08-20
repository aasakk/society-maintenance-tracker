export async function sendEmail({ to, subject, body }: { to: string; subject: string; body: string }) {
  // In a real app, integrate Resend or Nodemailer here.
  // Example:
  // import { Resend } from 'resend';
  // const resend = new Resend(process.env.RESEND_API_KEY);
  // await resend.emails.send({ from: 'onboarding@resend.dev', to, subject, html: body });
  
  console.log(`[Email Mock] Sending email to ${to}: ${subject}`);
  console.log(body);
  return true;
}
