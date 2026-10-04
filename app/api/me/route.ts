import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "../../../lib/prisma";
import { readSession, SESSION_COOKIE } from "../../../lib/session";
import { currentSemester } from "../../../lib/semester";

export async function GET() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  const session = token ? await readSession(token) : null;

  if (!session) {
    return NextResponse.json({ error: "Not logged in." }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: { student: { include: { department: true } } },
  });

  if (!user) {
    return NextResponse.json({ error: "Not logged in." }, { status: 401 });
  }

  return NextResponse.json({
    email: user.email,
    role: user.role,
    student: user.student
      ? {
          name: user.student.name,
          rollNo: user.student.rollNo,
          department: user.student.department.name,
          batch: user.student.batch,
          semester: currentSemester(
            user.student.batch,
            user.student.semesterOverride
          ),
        }
      : null,
  });
}