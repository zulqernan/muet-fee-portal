import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { prisma } from "../../../lib/prisma";

export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token");
  if (!token) {
    return NextResponse.json({ error: "Missing token." }, { status: 400 });
  }

  const tokenHash = createHash("sha256").update(token).digest("hex");

  const record = await prisma.verificationToken.findUnique({
    where: { tokenHash },
  });

  if (!record || record.expiresAt < new Date()) {
    return NextResponse.json(
      { error: "This link is invalid or has expired." },
      { status: 400 }
    );
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { emailVerifiedAt: new Date() },
    }),
    prisma.verificationToken.delete({ where: { id: record.id } }),
  ]);

  return NextResponse.json({ message: "Email verified. You can now log in." });
}