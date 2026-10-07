import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const departments = [
  { name: 'Computer Science', code: 'CS' },
  { name: 'Information Technology', code: 'IT' },
  { name: 'Electrical and Computer Engineering', code: 'ECE' },
  { name: 'Civil Engineering', code: 'CE' },
  { name: 'Business and Economics', code: 'BE' },
  { name: 'Health Sciences', code: 'HS' },
];

async function main() {
  await prisma.chatMessage.deleteMany();
  await prisma.progressComment.deleteMany();
  await prisma.progressReport.deleteMany();
  await prisma.teamJoinRequest.deleteMany();
  await prisma.teamMember.deleteMany();
  await prisma.supervisorRequest.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.passwordReset.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.team.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();
  await prisma.department.deleteMany();

  const createdDepts = [];
  for (const d of departments) {
    createdDepts.push(await prisma.department.create({ data: d }));
  }
  const cs = createdDepts[0];
  const it = createdDepts[1];
  const ece = createdDepts[2];

  const password = await bcrypt.hash('Password@123', 12);

  const admin = await prisma.user.create({
    data: {
      name: 'System Administrator',
      email: 'admin@dbu.edu.et',
      password,
      role: 'ADMIN',
      department_id: cs.id,
    },
  });

  const instructor = await prisma.user.create({
    data: {
      name: 'Dr. Alemayehu Bekele',
      email: 'instructor@dbu.edu.et',
      password,
      role: 'INSTRUCTOR',
      department_id: cs.id,
    },
  });

  const instructor2 = await prisma.user.create({
    data: {
      name: 'Dr. Sara Tadesse',
      email: 'sara.tadesse@dbu.edu.et',
      password,
      role: 'INSTRUCTOR',
      department_id: ece.id,
    },
  });

  const student = await prisma.user.create({
    data: {
      name: 'Hana Getachew',
      email: 'student@dbu.edu.et',
      password,
      role: 'STUDENT',
      department_id: cs.id,
    },
  });

  const student2 = await prisma.user.create({
    data: {
      name: 'Mikiyas Worku',
      email: 'mikiyas@dbu.edu.et',
      password,
      role: 'STUDENT',
      department_id: cs.id,
    },
  });

  const student3 = await prisma.user.create({
    data: {
      name: 'Liya Kebede',
      email: 'liya@dbu.edu.et',
      password,
      role: 'STUDENT',
      department_id: it.id,
    },
  });

  const industry = await prisma.user.create({
    data: {
      name: 'Ethio Digital Solutions',
      email: 'industry@partner.et',
      password,
      role: 'INDUSTRY',
      industry_approved: true,
    },
  });

  const approved = await prisma.project.create({
    data: {
      title: 'Smart Campus Attendance with Face Recognition',
      description:
        'Design a privacy-aware attendance system for DBU lecture halls using computer vision, a web dashboard for department heads, and offline fallback for poor connectivity.',
      type: 'ACADEMIC',
      status: 'APPROVED',
      posted_by: student.id,
      department_id: cs.id,
      supervisor_id: instructor.id,
    },
  });

  await prisma.project.create({
    data: {
      title: 'Low-cost Irrigation Sensor Network for North Shewa Farmers',
      description:
        'Industry-sponsored IoT soil moisture network with SMS alerts in Amharic. Students will prototype sensors, a gateway, and a simple farmer dashboard.',
      type: 'INDUSTRY',
      status: 'APPROVED',
      posted_by: industry.id,
      department_id: ece.id,
    },
  });

  await prisma.project.create({
    data: {
      title: 'DBU Alumni Mentorship Matching Portal',
      description:
        'A matching portal that pairs final-year students with alumni mentors based on department, career interest, and availability.',
      type: 'ACADEMIC',
      status: 'PENDING',
      posted_by: student3.id,
      department_id: it.id,
    },
  });

  const team = await prisma.team.create({
    data: {
      project_id: approved.id,
      leader_id: student.id,
      status: 'ACTIVE',
    },
  });

  await prisma.teamMember.createMany({
    data: [
      { team_id: team.id, student_id: student.id },
      { team_id: team.id, student_id: student2.id },
    ],
  });

  await prisma.progressReport.create({
    data: {
      team_id: team.id,
      week: 1,
      description: 'Completed literature review and selected a lightweight face-embedding model suitable for campus labs.',
    },
  });

  await prisma.notification.create({
    data: {
      user_id: student.id,
      type: 'welcome',
      title: 'Welcome to ProjectMarket DBU',
      body: 'Your demo student account is ready. Browse projects, manage your team, and try Selam the voice assistant.',
      link: '/dashboard',
    },
  });

  console.log('Seed complete. Demo password for all users: Password@123');
  console.log('admin@dbu.edu.et | instructor@dbu.edu.et | student@dbu.edu.et | industry@partner.et');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
