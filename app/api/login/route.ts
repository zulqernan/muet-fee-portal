import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../../../lib/prisma";
import { createSession, SESSION_COOKIE } from "../../../lib/session";
import { rateLimit } from "../../../lib/rateLimit";

const schema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input." }, { status: 400 });
  }

  const { email, password } = parsed.data;
  const cleanEmail = email.toLowerCase();

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  const key = `login:${ip}:${cleanEmail}`;

  const limit = await rateLimit(key, 5, 15 * 60);
  if (!limit.ok) {
    const minutes = Math.ceil(limit.retryAfter / 60);
    return NextResponse.json(
      { error: `Too many attempts. Try again in ${minutes} minute(s).` },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } }
    );
  }

  const user = await prisma.user.findUnique({
    where: { email: cleanEmail },
  });
  const passwordOk = user
    ? await bcrypt.compare(password, user.passwordHash)
    : false;

  if (!user || !passwordOk) {
    return NextResponse.json(
      { error: "Wrong email or password." },
      { status: 401 }
    );
  }

  if (!user.emailVerifiedAt) {
    return NextResponse.json(
      { error: "Please verify your email first." },
      { status: 403 }
    );
  }

  await prisma.rateLimit.deleteMany({ where: { key } });

  const token = await createSession({ userId: user.id, role: user.role });

  const res = NextResponse.json({ message: "Logged in.", role: user.role });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 7 * 24 * 60 * 60,
  });
  return res;
}