import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// MUET semester fee (PDF): tuition 25000 + games 1500 + developmental 1300
// + transport 18000 + exam 3000 = 48800
const SEMESTER_FEE = 48800;

async function main() {
  const password = process.env.SEED_PASSWORD;
  if (!password || password.length < 12) {
    throw new Error("Set SEED_PASSWORD (at least 12 characters) in .env first.");
  }

  const se = await prisma.department.upsert({
    where: { name: "Software Engineering" },
    update: {},
    create: { name: "Software Engineering" },
  });
  const cs = await prisma.department.upsert({
    where: { name: "Computer Systems Engineering" },
    update: {},
    create: { name: "Computer Systems Engineering" },
  });

  await prisma.feeStructure.upsert({
    where: {
      departmentId_semester_session: {
        departmentId: se.id,
        semester: 5,
        session: "2026",
      },
    },
    update: { amount: SEMESTER_FEE },
    create: {
      departmentId: se.id,
      semester: 5,
      session: "2026",
      amount: SEMESTER_FEE,
      dueDate: new Date("2026-11-15"),
      lateFeePerDay: 100,
    },
  });

  const students = [
    { rollNo: "24SW001", name: "Test Student One", departmentId: se.id, batch: 2024, officialEmail: "student1@example.com" },
    { rollNo: "24SW002", name: "Test Student Two", departmentId: se.id, batch: 2024, officialEmail: "student2@example.com" },
    { rollNo: "24CS001", name: "Test Student Three", departmentId: cs.id, batch: 2024, officialEmail: "student3@example.com" },
  ];
  for (const s of students) {
    await prisma.student.upsert({ where: { rollNo: s.rollNo }, update: {}, create: s });
  }

  const hash = await bcrypt.hash(password, 10);
  await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: { passwordHash: hash },
    create: { email: "admin@example.com", passwordHash: hash, role: Role.ADMIN, emailVerifiedAt: new Date() },
  });
  await prisma.user.upsert({
    where: { email: "accounts@example.com" },
    update: { passwordHash: hash },
    create: { email: "accounts@example.com", passwordHash: hash, role: Role.ACCOUNTS, emailVerifiedAt: new Date() },
  });
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });