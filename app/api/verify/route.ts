import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { prisma } from "../../../lib/prisma";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const base = process.env.APP_URL ?? url.origin;
  const go = (status: "ok" | "invalid") =>
    NextResponse.redirect(new URL(`/verified?status=${status}`, base));

  const token = url.searchParams.get("token");
  if (!token) return go("invalid");

  const tokenHash = createHash("sha256").update(token).digest("hex");

  const record = await prisma.verificationToken.findUnique({
    where: { tokenHash },
  });

  if (!record || record.expiresAt < new Date()) return go("invalid");

  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { emailVerifiedAt: new Date() },
    }),
    prisma.verificationToken.delete({ where: { id: record.id } }),
  ]);

  return go("ok");
}