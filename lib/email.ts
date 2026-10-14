import nodemailer from "nodemailer";

export function isAuthEmailConfigured() {
  return Boolean(
    process.env.SMTP_HOST?.trim() &&
    process.env.SMTP_USER?.trim() &&
    process.env.SMTP_PASSWORD?.trim(),
  );
}

export function getAuthEmailErrorMessage(error: unknown) {
  if (!isAuthEmailConfigured()) {
    return "Email sending is not configured. Set SMTP_HOST, SMTP_USER, and SMTP_PASSWORD in .env.local, then restart the app. For Gmail, SMTP_PASSWORD must be a Google App Password.";
  }

  const code =
    error && typeof error === "object" && "code" in error && typeof error.code === "string"
      ? error.code
      : "";
  const responseCode =
    error && typeof error === "object" && "responseCode" in error && typeof error.responseCode === "number"
      ? error.responseCode
      : undefined;

  if (code === "EAUTH" || responseCode === 535) {
    return "The email provider rejected the SMTP login. Check SMTP_USER and use a Google App Password for Gmail, then restart the app.";
  }
  if (code === "ECONNECTION" || code === "ETIMEDOUT" || code === "ESOCKET") {
    return "The app could not connect to the email provider. Check SMTP_HOST, SMTP_PORT, and SMTP_SECURE.";
  }
  if (responseCode !== undefined && responseCode >= 500) {
    return "The email provider rejected the message. Check that SMTP_FROM is an address authorized to send from this account.";
  }

  return "The email provider could not send the code. Check your SMTP settings and the server log, then try again.";
}

function getTransporter() {
  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASSWORD?.trim();
  if (!host || !user || !pass) throw new Error("SMTP email configuration is missing");
  return nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: { user, pass },
  });
}

export async function sendAuthOtp(email: string, otp: string, purpose: "verification" | "password-reset") {
  const transporter = getTransporter();
  const address = process.env.SMTP_FROM?.trim() || process.env.SMTP_USER?.trim();
  if (!address) throw new Error("SMTP sender address is missing");
  const name = process.env.SMTP_FROM_NAME?.trim() || "JobFlow";

  const verification = purpose === "verification";
  const subject = verification ? "Your JobFlow verification code" : "Your JobFlow password reset code";
  const action = verification ? "verify your email address" : "reset your password";

  await transporter.sendMail({
    from: { name, address },
    to: email,
    subject,
    text: `Use ${otp} to ${action}. This code expires in 10 minutes.`,
    html: `<p>Use this code to ${action}:</p><p style="font-size: 24px; font-weight: bold; letter-spacing: 4px">${otp}</p><p>This code expires in 10 minutes.</p>`,
  });
}