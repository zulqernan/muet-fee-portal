import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { randomBytes, createHash } from "crypto";
import { z } from "zod";
import { prisma } from "../../../lib/prisma";
import { sendMail } from "../../../lib/mailer";

const schema = z.object({
  rollNo: z.string().trim().min(3),
  email: z.email(),
  password: z.string().min(8).max(72),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input. Password must be at least 8 characters." },
      { status: 400 }
    );
  }

  const { rollNo, email, password } = parsed.data;

  const student = await prisma.student.findUnique({
    where: { rollNo: rollNo.toUpperCase() },
  });

  if (!student || student.officialEmail.toLowerCase() !== email.toLowerCase()) {
    return NextResponse.json(
      { error: "Roll number and email do not match our records." },
      { status: 400 }
    );
  }

  if (student.userId) {
    return NextResponse.json(
      { error: "This roll number is already registered." },
      { status: 409 }
    );
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const token = randomBytes(32).toString("hex");
  const tokenHash = createHash("sha256").update(token).digest("hex");

  try {
    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { email: email.toLowerCase(), passwordHash, role: "STUDENT" },
      });
      await tx.student.update({
        where: { id: student.id },
        data: { userId: user.id },
      });
      await tx.verificationToken.create({
        data: {
          tokenHash,
          userId: user.id,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      });
    });
  } catch {
    return NextResponse.json(
      { error: "Could not create account. Try again." },
      { status: 500 }
    );
  }

  const baseUrl = process.env.APP_URL ?? "http://localhost:3000";
  const link = `${baseUrl}/api/verify?token=${token}`;

  if (process.env.NODE_ENV !== "production") {
    console.log(`\n[DEV] Verification link: ${link}\n`);
  }

  try {
    await sendMail(
      email.toLowerCase(),
      "Verify your MUET Fee Portal account",
      `Hello ${student.name},\n\nPlease verify your email by opening this link (valid for 24 hours):\n\n${link}\n\nIf you did not register, ignore this email.`
    );
  } catch (e) {
    console.error("Verification email failed:", e);
    return NextResponse.json(
      {
        message:
          "Account created, but we could not send the verification email. Please contact the accounts office.",
      },
      { status: 201 }
    );
  }

  return NextResponse.json(
        {
      message:
        "Registered. Check your email (and the Spam folder) to verify your account.",
    },
    { status: 201 }
  );
}