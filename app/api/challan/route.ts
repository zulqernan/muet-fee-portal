import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { randomBytes } from "crypto";
import { prisma } from "../../../lib/prisma";
import { readSession, SESSION_COOKIE } from "../../../lib/session";
import { currentSemester } from "../../../lib/semester";
import { lateFee } from "../../../lib/fees";

export async function GET() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  const session = token ? await readSession(token) : null;

  if (!session) {
    return NextResponse.json({ error: "Not logged in." }, { status: 401 });
  }

  const student = await prisma.student.findUnique({
    where: { userId: session.userId },
  });
  if (!student) {
    return NextResponse.json(
      { error: "Only students can get a challan." },
      { status: 403 }
    );
  }

  const semester = currentSemester(student.batch, student.semesterOverride);

  const fee = await prisma.feeStructure.findFirst({
    where: { departmentId: student.departmentId, semester },
    orderBy: { session: "desc" },
  });
  if (!fee) {
    return NextResponse.json(
      { error: "No fee structure is set for your department and semester yet." },
      { status: 404 }
    );
  }

  let challan = await prisma.challan.findUnique({
    where: {
      studentId_feeStructureId: {
        studentId: student.id,
        feeStructureId: fee.id,
      },
    },
  });

  if (!challan) {
    challan = await prisma.challan.create({
      data: {
        challanNo: "CH-" + randomBytes(5).toString("hex").toUpperCase(),
        studentId: student.id,
        feeStructureId: fee.id,
        amount: fee.amount,
      },
    });
  }

  const late =
    challan.status === "PAID" ? 0 : lateFee(fee.dueDate, fee.lateFeePerDay);

  return NextResponse.json({
    challanNo: challan.challanNo,
    semester,
    session: fee.session,
    amount: challan.amount,
    dueDate: fee.dueDate,
    status: challan.status,
    lateFee: late,
    totalPayable: challan.amount + late,
  });
}