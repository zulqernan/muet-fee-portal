import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { prisma } from "../../../../lib/prisma";
import { readSession, SESSION_COOKIE } from "../../../../lib/session";

const schema = z.object({ challanNo: z.string().trim().min(3) });

export async function POST(req: Request) {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  const session = token ? await readSession(token) : null;

  if (!session) {
    return NextResponse.json({ error: "Not logged in." }, { status: 401 });
  }
  if (session.role !== "ACCOUNTS" && session.role !== "ADMIN") {
    return NextResponse.json({ error: "Not allowed." }, { status: 403 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Challan number is required." }, { status: 400 });
  }

  const challanNo = parsed.data.challanNo.toUpperCase();
  const challan = await prisma.challan.findUnique({ where: { challanNo } });

  if (!challan) {
    return NextResponse.json({ error: "Challan not found." }, { status: 404 });
  }
  if (challan.status === "PAID") {
    return NextResponse.json({ error: "Already marked as paid." }, { status: 409 });
  }

  await prisma.$transaction([
    prisma.challan.update({
      where: { id: challan.id },
      data: { status: "PAID", paidAt: new Date(), markedById: session.userId },
    }),
    prisma.auditLog.create({
      data: {
        userId: session.userId,
        action: "MARK_PAID",
        entity: "Challan",
        entityId: challan.challanNo,
      },
    }),
  ]);

  return NextResponse.json({ message: `Challan ${challan.challanNo} marked as paid.` });
}