import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "../../../../lib/prisma";
import { readSession, SESSION_COOKIE } from "../../../../lib/session";
import { currentSemester } from "../../../../lib/semester";

export async function GET(req: Request) {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  const session = token ? await readSession(token) : null;

  if (!session) {
    return NextResponse.json({ error: "Not logged in." }, { status: 401 });
  }
  if (session.role !== "ADMIN") {
    return NextResponse.json({ error: "Not allowed." }, { status: 403 });
  }

  const q = new URL(req.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) {
    return NextResponse.json(
      { error: "Type at least 2 characters to search." },
      { status: 400 }
    );
  }

  const students = await prisma.student.findMany({
    where: {
      OR: [
        { rollNo: { contains: q, mode: "insensitive" } },
        { name: { contains: q, mode: "insensitive" } },
      ],
    },
    include: {
      department: true,
      challans: { include: { feeStructure: true } },
    },
    orderBy: { rollNo: "asc" },
    take: 20,
  });

  const results = students.map((s) => {
    const semester = currentSemester(s.batch, s.semesterOverride);
    const hasCurrent = s.challans.some((c) => c.feeStructure.semester === semester);
    const allPaid = s.challans.every((c) => c.status === "PAID");
    const paidTotal = s.challans
      .filter((c) => c.status === "PAID")
      .reduce((sum, c) => sum + c.amount, 0);

    return {
      rollNo: s.rollNo,
      name: s.name,
      department: s.department.name,
      semester,
      challans: s.challans.length,
      paidTotal,
      cleared: hasCurrent && allPaid,
    };
  });

  return NextResponse.json({ results });
}