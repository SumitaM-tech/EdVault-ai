import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import {
  sha256Hex,
  generateMockCid,
  generateMockTx,
  generateQrPayload,
} from '../src/config/env.js';

const prisma = new PrismaClient();

if (process.env.NODE_ENV === 'production' && process.env.SEED_ALLOW_PRODUCTION !== 'true') {
  console.error('Refusing to seed demo accounts in production (set SEED_ALLOW_PRODUCTION=true to override).');
  process.exit(1);
}

async function main() {
  const passwordHash = await bcrypt.hash('password123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@edvault.edu' },
    update: {},
    create: {
      email: 'admin@edvault.edu',
      passwordHash,
      name: 'EdVault Admin',
      role: 'ADMIN',
      institution: 'EdVault University',
      wallet: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
      avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=admin',
    },
  });

  await prisma.user.upsert({
    where: { email: 'faculty@edvault.edu' },
    update: {},
    create: {
      email: 'faculty@edvault.edu',
      passwordHash,
      name: 'Dr. Priya Rao',
      role: 'FACULTY',
      institution: 'EdVault University',
      avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=faculty',
    },
  });

  const student = await prisma.user.upsert({
    where: { email: 'student@edvault.edu' },
    update: {},
    create: {
      email: 'student@edvault.edu',
      passwordHash,
      name: 'Aarav Mehta',
      role: 'STUDENT',
      institution: 'EdVault University',
      degree: 'B.Sc. Computer Science',
      studentId: 'STU-2024-001',
      wallet: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
      year: '2024',
      avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=aarav',
    },
  });

  const recruiter = await prisma.user.upsert({
    where: { email: 'recruiter@edvault.edu' },
    update: {},
    create: {
      email: 'recruiter@edvault.edu',
      passwordHash,
      name: 'Tech Recruiter',
      role: 'RECRUITER',
      institution: 'Global Tech Corp',
      avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=recruiter',
    },
  });

  const credId = 'CRED-DEMO0001';
  const payload = JSON.stringify({
    credentialId: credId,
    studentName: student.name,
    studentId: student.studentId,
    degree: student.degree,
  });
  const hash = sha256Hex(payload);
  const cid = generateMockCid(hash);

  await prisma.credential.upsert({
    where: { id: credId },
    update: {},
    create: {
      id: credId,
      title: 'B.Sc. Computer Science',
      institution: 'EdVault University',
      department: 'Computer Science',
      cgpa: '3.95',
      gradDate: new Date('2024-05-15'),
      hash,
      cid,
      blockchainTx: generateMockTx(),
      qrPayload: generateQrPayload(credId),
      blockNumber: 0,
      // Demo record: not anchored on the local chain, so verification reports anchor=simulated.
      onChainId: null,
      studentId: student.id,
      issuerId: admin.id,
      status: 'VERIFIED',
      timelineEvents: {
        create: [
          {
            title: 'Credential Issued',
            description: 'B.Sc. Computer Science conferred by EdVault University',
            tone: 'success',
          },
          {
            title: 'IPFS (simulated)',
            description: `Demo CID ${cid.slice(0, 20)}...`,
            tone: 'neutral',
          },
          {
            title: 'Blockchain anchor (simulated)',
            description: 'Seeded demo record. Issue a new credential to anchor on the local chain.',
            tone: 'neutral',
          },
          {
            title: 'Recruiter Verified',
            description: 'Credential verified by Global Tech Corp',
            tone: 'success',
          },
        ],
      },
    },
  });

  await prisma.verificationLog.deleteMany({ where: { credentialId: credId } });
  await prisma.verificationLog.createMany({
    data: [
      { credentialId: credId, outcome: 'VERIFIED', method: 'Credential ID' },
      { credentialId: credId, outcome: 'VERIFIED', method: 'QR' },
      { credentialId: credId, outcome: 'VERIFIED', method: 'Credential ID' },
    ],
  });

  console.log('Seed complete:');
  console.log('  Admin:     admin@edvault.edu / password123');
  console.log('  Faculty:   faculty@edvault.edu / password123');
  console.log('  Student:   student@edvault.edu / password123');
  console.log('  Recruiter: recruiter@edvault.edu / password123');
  console.log(`  Sample credential ID: ${credId}`);
}

main()
  .catch((err) => { console.error('Seed failed:', err); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
