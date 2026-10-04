import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { randomBytes, createHash } from "crypto";
import { z } from "zod";
import { prisma } from "../../../lib/prisma";

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

  if (process.env.NODE_ENV !== "production") {
    console.log(
      `\n[DEV] Verification link: http://localhost:3000/api/verify?token=${token}\n`
    );
  }

  return NextResponse.json(
    { message: "Registered. Check your email to verify your account." },
    { status: 201 }
  );
}