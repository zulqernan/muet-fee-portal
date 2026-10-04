import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
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
    update: {},
    create: {
      departmentId: se.id,
      semester: 5,
      session: "2026",
      amount: 45000,
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

  const hash = await bcrypt.hash("DevOnly12345", 10);
  await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: { email: "admin@example.com", passwordHash: hash, role: Role.ADMIN, emailVerifiedAt: new Date() },
  });
  await prisma.user.upsert({
    where: { email: "accounts@example.com" },
    update: {},
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