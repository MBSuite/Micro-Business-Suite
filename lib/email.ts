/* eslint-disable @typescript-eslint/no-explicit-any */
import nodemailer from "nodemailer";

export type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

export async function sendEmail(input: SendEmailInput): Promise<{ sent: boolean; reason?: string }> {
  const from = (process.env.GMAIL_FROM || "").trim();
  const rawPass = (process.env.GMAIL_APP_PASSWORD || "").trim();
  const pass = rawPass.replace(/\s+/g, "");

  if (!from || !pass) {
    console.warn("[email] GMAIL_FROM/GMAIL_APP_PASSWORD not configured; email not sent.");
    return { sent: false, reason: "not_configured" };
  }

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: from, pass },
    });
    await transporter.sendMail({
      from,
      to: input.to,
      subject: input.subject,
      text: input.text,
      html: input.html,
    });
    return { sent: true };
  } catch (err) {
    console.error("[email] sendMail failed:", err instanceof Error ? err.message : err);
    return { sent: false, reason: err instanceof Error ? err.message : "send_failed" };
  }
}
