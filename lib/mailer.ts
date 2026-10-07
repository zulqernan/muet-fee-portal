import nodemailer from "nodemailer";

function transport() {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!user || !pass) {
    throw new Error("SMTP_USER and SMTP_PASS must be set in .env");
  }
  return nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });
}

export async function sendMail(to: string, subject: string, text: string) {
  await transport().sendMail({
    from: `"MUET Fee Portal" <${process.env.SMTP_USER}>`,
    to,
    subject,
    text,
  });
}