import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding demo data...');

  const institution = await prisma.institution.create({
    data: {
      name: 'Global Tech High School',
      subscription_plan: 'pro',
    },
  });

  const password_hash = await bcrypt.hash('password123', 10);

  const admin = await prisma.user.create({
    data: {
      name: 'Super Admin',
      email: 'admin@school.com',
      password_hash,
      role: 'admin',
      institution_id: institution.id,
    },
  });

  const teacher = await prisma.user.create({
    data: {
      name: 'Jane Smith',
      email: 'teacher@school.com',
      password_hash,
      role: 'teacher',
      institution_id: institution.id,
    },
  });

  const cls1 = await prisma.class.create({
    data: {
      name: 'Grade 10 Science',
      level: '10',
      institution_id: institution.id,
    },
  });

  const sub1 = await prisma.subject.create({
    data: {
      name: 'Mathematics',
      code: 'MTH101',
      institution_id: institution.id,
    },
  });

  await prisma.teacherAssignment.create({
    data: {
      teacher_id: teacher.id,
      class_id: cls1.id,
      subject_id: sub1.id,
      institution_id: institution.id,
    },
  });

  const user1 = await prisma.user.create({
    data: {
      name: 'Alice Cooper',
      email: 'adm001@student.com',
      password_hash,
      role: 'student',
      institution_id: institution.id,
    },
  });

  const student1 = await prisma.student.create({
    data: {
      full_name: 'Alice Cooper',
      admission_number: 'ADM001',
      class_id: cls1.id,
      institution_id: institution.id,
      user_id: user1.id,
    },
  });

  const user2 = await prisma.user.create({
    data: {
      name: 'Bob Dylan',
      email: 'adm002@student.com',
      password_hash,
      role: 'student',
      institution_id: institution.id,
    },
  });

  const student2 = await prisma.student.create({
    data: {
      full_name: 'Bob Dylan',
      admission_number: 'ADM002',
      class_id: cls1.id,
      institution_id: institution.id,
      user_id: user2.id,
    },
  });

  console.log('Done seeding.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
