import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "../../../../lib/prisma";
import { readSession, SESSION_COOKIE } from "../../../../lib/session";

export async function GET() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  const session = token ? await readSession(token) : null;

  if (!session) {
    return NextResponse.json({ error: "Not logged in." }, { status: 401 });
  }
  if (session.role !== "ADMIN") {
    return NextResponse.json({ error: "Not allowed." }, { status: 403 });
  }

  const departments = await prisma.department.findMany({
    orderBy: { name: "asc" },
    include: {
      students: { select: { challans: { select: { status: true } } } },
    },
  });

  const stats = departments.map((d) => {
    let paid = 0;
    let unpaid = 0;
    let noChallan = 0;

    for (const s of d.students) {
      if (s.challans.length === 0) {
        noChallan++;
      } else if (s.challans.every((c) => c.status === "PAID")) {
        paid++;
      } else {
        unpaid++;
      }
    }

    return {
      department: d.name,
      totalStudents: d.students.length,
      paid,
      unpaid,
      noChallan,
    };
  });

  return NextResponse.json({ stats });
}