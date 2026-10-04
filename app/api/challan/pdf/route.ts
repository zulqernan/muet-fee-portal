import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { randomBytes } from "crypto";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { prisma } from "../../../../lib/prisma";
import { readSession, SESSION_COOKIE } from "../../../../lib/session";
import { currentSemester } from "../../../../lib/semester";
import { lateFee } from "../../../../lib/fees";

export async function GET() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  const session = token ? await readSession(token) : null;
  if (!session) {
    return NextResponse.json({ error: "Not logged in." }, { status: 401 });
  }

  const student = await prisma.student.findUnique({
    where: { userId: session.userId },
    include: { department: true },
  });
  if (!student) {
    return NextResponse.json(
      { error: "Only students can download a challan." },
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
  const total = challan.amount + late;

  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595, 842]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  page.drawText("MUET - Fee Challan", {
    x: 50, y: 780, size: 20, font: bold, color: rgb(0.1, 0.1, 0.1),
  });
  page.drawText("Demo document - not an official challan", {
    x: 50, y: 760, size: 10, font, color: rgb(0.5, 0.5, 0.5),
  });

  const rows: [string, string][] = [
    ["Challan No", challan.challanNo],
    ["Name", student.name],
    ["Roll No", student.rollNo],
    ["Department", student.department.name],
    ["Semester", String(semester)],
    ["Session", fee.session],
    ["Due Date", fee.dueDate.toISOString().slice(0, 10)],
    ["Status", challan.status],
    ["Fee Amount", `Rs. ${challan.amount}`],
    ["Late Fee", `Rs. ${late}`],
    ["Total Payable", `Rs. ${total}`],
  ];

  let y = 710;
  for (const [label, value] of rows) {
    page.drawText(label, { x: 50, y, size: 12, font: bold });
    page.drawText(value, { x: 200, y, size: 12, font });
    y -= 28;
  }

  page.drawText(
    `Late fee is Rs. ${fee.lateFeePerDay} per day after the due date. Amount shown is as of download time.`,
    { x: 50, y: y - 10, size: 9, font, color: rgb(0.4, 0.4, 0.4) }
  );

  const bytes = await pdf.save();

  return new Response(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${challan.challanNo}.pdf"`,
    },
  });
}