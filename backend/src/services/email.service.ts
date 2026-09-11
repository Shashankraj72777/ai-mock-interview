import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendResetEmail(to: string, rawToken: string) {
  const resetLink = `${process.env.FRONTEND_URL}/reset-password/${rawToken}`;

  await resend.emails.send({
    from: "interviewroom <onboarding@resend.dev>",
    to,
    subject: "Reset your interviewroom password",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #1A1A2E;">Reset your password</h2>
        <p>Click the button below to set a new password. This link expires in 1 hour.</p>
        <a href="${resetLink}" style="display: inline-block; background: #FF6B4A; color: #12141A; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500; margin: 16px 0;">
          Reset Password
        </a>
        <p style="color: #6B7280; font-size: 13px;">If you didn't request this, you can safely ignore this email — your password won't be changed.</p>
        <p style="color: #6B7280; font-size: 12px;">Or paste this link directly: ${resetLink}</p>
      </div>
    `,
  });
}