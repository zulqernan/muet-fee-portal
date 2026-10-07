import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { randomBytes } from "crypto";
import {
  PDFDocument,
  PDFFont,
  PDFPage,
  StandardFonts,
  degrees,
  rgb,
} from "pdf-lib";
import { prisma } from "../../../../lib/prisma";
import { readSession, SESSION_COOKIE } from "../../../../lib/session";
import { currentSemester } from "../../../../lib/semester";
import { lateFee } from "../../../../lib/fees";
import { amountInWords } from "../../../../lib/numberToWords";

// Placeholders: replace after the university and the bank approve this system.
const BANK_NAME = "Bank name";
const BRANCH = "Branch name";
const ACCOUNT = "A/c No: XXXX-XXXXXXXX-XX";
const UNIVERSITY =
  "Mehran University of Engineering & Technology SZAB, Campus Khairpur Mirs";

const LINES = [
  "Admission Fees",
  "Tuition Fees",
  "Transport Fees",
  "Hostel Fees",
  "Examination Fees",
  "Tender Fees",
  "Certificates Fees",
  "Workshop Fees",
  "Bank Challan Fees",
  "Other Fees",
];

const COPIES = [
  "For Account's Branch Use",
  "For Concerned Office Use",
  "For Depositor's / Candidate Use",
];

type Data = {
  challanNo: string;
  date: string;
  name: string;
  rollNo: string;
  semester: number;
  amount: number;
  late: number;
  total: number;
  paid: boolean;
};

function money(n: number) {
  return `Rs. ${n.toLocaleString("en-US")}`;
}

function drawCopy(
  page: PDFPage,
  x: number,
  w: number,
  label: string,
  d: Data,
  font: PDFFont,
  bold: PDFFont
) {
  const ink = rgb(0.1, 0.1, 0.1);
  const grey = rgb(0.45, 0.45, 0.45);
  const rule = rgb(0.25, 0.25, 0.25);
  let y = 570;

  // Logo placeholder and copy label
  page.drawRectangle({
    x,
    y: y - 28,
    width: 66,
    height: 28,
    borderColor: grey,
    borderWidth: 0.6,
  });
  page.drawText("Bank logo", { x: x + 14, y: y - 18, size: 7, font, color: grey });
  page.drawText(`(${label})`, { x: x + 72, y: y - 10, size: 7, font, color: grey });
  page.drawText(`${BANK_NAME}, ${BRANCH}`, {
    x: x + 72,
    y: y - 22,
    size: 7.5,
    font: bold,
    color: ink,
  });
  y -= 42;

  page.drawText(`Challan No. ${d.challanNo}`, { x, y, size: 8, font: bold, color: ink });
  page.drawText(`Date ${d.date}`, { x: x + w - 68, y, size: 8, font, color: ink });
  y -= 12;

  page.drawText(UNIVERSITY, { x, y, size: 6.5, font, color: ink, maxWidth: w, lineHeight: 8 });
  y -= 20;
  page.drawText(
    `Please receive and credit to MUET student fees. ${ACCOUNT}`,
    { x, y, size: 7, font: bold, color: ink, maxWidth: w, lineHeight: 9 }
  );
  y -= 22;

  // Officer signature box
  page.drawRectangle({
    x,
    y: y - 28,
    width: w,
    height: 28,
    borderColor: rule,
    borderWidth: 0.5,
  });
  page.drawText("Officer signature and stamp (placeholder)", {
    x: x + 6,
    y: y - 17,
    size: 6.5,
    font,
    color: grey,
  });
  y -= 44;

  page.drawText(`Name of Candidate: ${d.name}`, { x, y, size: 8, font, color: ink });
  y -= 14;
  page.drawText(`Roll No: ${d.rollNo}`, { x, y, size: 8, font, color: ink });
  page.drawText(`Semester: ${d.semester}`, { x: x + w - 70, y, size: 8, font, color: ink });
  y -= 16;

  // Fee table
  const rowH = 17;
  const rows = LINES.length + 1;
  const top = y;
  const colAmount = x + w - 70;
  page.drawRectangle({
    x,
    y: top - rows * rowH,
    width: w,
    height: rows * rowH,
    borderColor: rule,
    borderWidth: 0.6,
  });
  for (let i = 1; i < rows; i++) {
    page.drawLine({
      start: { x, y: top - i * rowH },
      end: { x: x + w, y: top - i * rowH },
      thickness: 0.4,
      color: grey,
    });
  }
  page.drawLine({
    start: { x: x + 20, y: top },
    end: { x: x + 20, y: top - rows * rowH },
    thickness: 0.4,
    color: grey,
  });
  page.drawLine({
    start: { x: colAmount, y: top },
    end: { x: colAmount, y: top - rows * rowH },
    thickness: 0.4,
    color: grey,
  });

  page.drawText("S.No", { x: x + 2, y: top - 12, size: 6.5, font: bold, color: ink });
  page.drawText("DETAILS", { x: x + 24, y: top - 12, size: 7, font: bold, color: ink });
  page.drawText("AMOUNT", { x: colAmount + 6, y: top - 12, size: 7, font: bold, color: ink });

  LINES.forEach((name, i) => {
    const base = top - (i + 2) * rowH + 5;
    page.drawText(String(i + 1), { x: x + 7, y: base, size: 7, font, color: ink });

    const isLate = i === LINES.length - 1 && d.late > 0;
    page.drawText(isLate ? "Other Fees (late fee)" : name, {
      x: x + 24,
      y: base,
      size: 7.5,
      font,
      color: ink,
    });

    if (i === 0) {
      page.drawText(`Semester ${d.semester} fee`, {
        x: x + 92,
        y: base,
        size: 6.5,
        font,
        color: grey,
      });
      page.drawText(money(d.amount), { x: colAmount + 4, y: base, size: 7.5, font: bold, color: ink });
    }
    if (isLate) {
      page.drawText(money(d.late), { x: colAmount + 4, y: base, size: 7.5, font: bold, color: ink });
    }
  });

  y = top - rows * rowH - 14;
  page.drawText("Total", { x: colAmount - 40, y, size: 8.5, font: bold, color: ink });
  page.drawText(money(d.total), { x: colAmount + 4, y, size: 8.5, font: bold, color: ink });
  y -= 18;

  page.drawText(`Rupees in words: ${amountInWords(d.total)}`, {
    x,
    y,
    size: 7.5,
    font,
    color: ink,
    maxWidth: w,
    lineHeight: 10,
  });

  // Manager and Cashier
  page.drawLine({ start: { x: x + 4, y: 78 }, end: { x: x + 74, y: 78 }, thickness: 0.4, color: grey });
  page.drawLine({ start: { x: x + w - 74, y: 78 }, end: { x: x + w - 4, y: 78 }, thickness: 0.4, color: grey });
  page.drawText("Manager", { x: x + 20, y: 68, size: 7, font, color: grey });
  page.drawText("Cashier", { x: x + w - 56, y: 68, size: 7, font, color: grey });

  if (d.paid) {
    page.drawText("PAID", {
      x: x + w / 2 - 30,
      y: top - 120,
      size: 34,
      font: bold,
      color: rgb(0.1, 0.5, 0.2),
      opacity: 0.5,
      rotate: degrees(18),
    });
  }
}

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

  const paid = challan.status === "PAID";
  const late = paid ? 0 : lateFee(fee.dueDate, fee.lateFeePerDay);

  const data: Data = {
    challanNo: challan.challanNo,
    date: new Date().toLocaleDateString("en-GB"),
    name: student.name,
    rollNo: student.rollNo,
    semester,
    amount: challan.amount,
    late,
    total: challan.amount + late,
    paid,
  };

  const pdf = await PDFDocument.create();
  const page = pdf.addPage([842, 595]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const margin = 18;
  const gap = 14;
  const w = (842 - margin * 2 - gap * 2) / 3;

  COPIES.forEach((label, i) => {
    const x = margin + i * (w + gap);
    drawCopy(page, x, w, label, data, font, bold);
    if (i > 0) {
      page.drawLine({
        start: { x: x - gap / 2, y: 585 },
        end: { x: x - gap / 2, y: 30 },
        thickness: 0.3,
        color: rgb(0.7, 0.7, 0.7),
      });
    }
  });

  page.drawText("DEMO - NOT AN OFFICIAL CHALLAN", {
    x: 100,
    y: 110,
    size: 40,
    font: bold,
    color: rgb(0.8, 0.1, 0.1),
    opacity: 0.12,
    rotate: degrees(30),
  });

  const bytes = await pdf.save();

  return new Response(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${challan.challanNo}.pdf"`,
    },
  });
}