import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma.js';
import { signToken } from '../lib/jwt.js';
import type { LoginInput } from '../validators/auth.validator.js';

function formatRole(role: string) {
  const map: Record<string, string> = {
    STUDENT: 'Student',
    FACULTY: 'Faculty',
    ADMIN: 'Admin',
    RECRUITER: 'Recruiter',
  };
  return map[role] ?? role;
}

export async function loginUser(input: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user) {
    const err = new Error('Invalid email or password') as Error & { status?: number };
    err.status = 401;
    throw err;
  }

  const valid = user.passwordHash ? await bcrypt.compare(input.password, user.passwordHash) : false;
  if (!valid) {
    const err = new Error('Invalid email or password') as Error & { status?: number };
    err.status = 401;
    throw err;
  }

  const token = signToken({ userId: user.id, email: user.email, role: user.role });

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: formatRole(user.role),
      institution: user.institution,
      degree: user.degree,
      wallet: user.wallet,
      year: user.year,
      avatar: user.avatar,
      studentId: user.studentId,
    },
  };
}

export async function getUserById(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { credentials: true },
  });
  if (!user) return null;

  return {
    id: user.id,
    name: user.name,
    role: formatRole(user.role),
    institution: user.institution ?? '',
    degree: user.degree ?? '',
    email: user.email,
    wallet: user.wallet ?? '',
    year: user.year ?? '',
    avatar: user.avatar ?? `https://api.dicebear.com/7.x/identicon/svg?seed=${user.id}`,
    credentials: user.credentials.map(formatCredential),
  };
}

export function formatCredential(c: {
  id: string;
  title: string;
  institution: string;
  issuedAt: Date;
  status: string;
  hash: string;
  cid: string;
  blockchainTx: string;
  qrPayload: string;
  department?: string | null;
  cgpa?: string | null;
  gradDate?: Date | null;
  blockNumber?: number | null;
  revokedAt?: Date | null;
}) {
  return {
    id: c.id,
    title: c.title,
    institution: c.institution,
    issuedAt: c.issuedAt.toISOString(),
    status: c.status === 'REVOKED' ? 'Revoked' : c.status === 'PENDING' ? 'Pending' : 'Verified',
    hash: c.hash,
    cid: c.cid,
    blockchainTx: c.blockchainTx,
    qrPayload: c.qrPayload,
    department: c.department,
    cgpa: c.cgpa,
    gradDate: c.gradDate?.toISOString(),
    blockNumber: c.blockNumber,
    revokedAt: c.revokedAt?.toISOString(),
  };
}
