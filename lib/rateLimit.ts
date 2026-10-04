import { prisma } from "./prisma";

export async function rateLimit(key: string, limit: number, windowSec: number) {
  const now = new Date();
  const resetAt = new Date(now.getTime() + windowSec * 1000);

  const row = await prisma.rateLimit.findUnique({ where: { key } });

  if (!row || row.resetAt < now) {
    await prisma.rateLimit.upsert({
      where: { key },
      update: { count: 1, resetAt },
      create: { key, count: 1, resetAt },
    });
    return { ok: true as const };
  }

  if (row.count >= limit) {
    return {
      ok: false as const,
      retryAfter: Math.ceil((row.resetAt.getTime() - now.getTime()) / 1000),
    };
  }

  await prisma.rateLimit.update({
    where: { key },
    data: { count: { increment: 1 } },
  });
  return { ok: true as const };
}