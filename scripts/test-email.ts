import { sendMail } from "../lib/mailer";

const to = process.argv[2];
if (!to) {
  console.error("Usage: npx tsx --env-file=.env scripts/test-email.ts you@example.com");
  process.exit(1);
}

sendMail(to, "MUET Fee Portal test", "If you can read this, email sending works.")
  .then(() => console.log("Email sent."))
  .catch((e) => {
    console.error("Failed:", e.message);
    process.exit(1);
  });