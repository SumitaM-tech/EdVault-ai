import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';

const prismaMock = vi.hoisted(() => ({
  user: { findFirst: vi.fn(), findUnique: vi.fn(), create: vi.fn(), findMany: vi.fn().mockResolvedValue([]), count: vi.fn() },
  credential: { findFirst: vi.fn(), findUnique: vi.fn(), findMany: vi.fn().mockResolvedValue([]), create: vi.fn(), update: vi.fn(), count: vi.fn() },
  verificationLog: { create: vi.fn(), findMany: vi.fn().mockResolvedValue([]), count: vi.fn() },
  iPFSDocument: { upsert: vi.fn() },
}));
vi.mock('../src/lib/prisma.js', () => ({ prisma: prismaMock }));

import { createApp } from '../src/app.js';
import { signToken } from '../src/lib/jwt.js';

const app = createApp();
const token = (role: string, userId = 'u1') => `Bearer ${signToken({ userId, email: `${role}@x.edu`, role })}`;

beforeEach(() => {
  prismaMock.credential.findMany.mockClear();
  prismaMock.user.findMany.mockClear();
});

describe('routes that used to be public now require authentication', () => {
  const cases: Array<[string, string]> = [
    ['get', '/credentials'],
    ['get', '/credentials/CRED-AAAA'],
    ['get', '/students/search?q=aar'],
    ['post', '/ai/chat'],
    ['get', '/dashboard/summary'],
    ['get', '/access-log'],
    ['post', '/credentials/CRED-AAAA/share'],
  ];
  it.each(cases)('%s %s -> 401 without a token', async (method, url) => {
    const res = await (request(app) as any)[method](url);
    expect(res.status).toBe(401);
  });

  it('rejects a malformed token', async () => {
    const res = await request(app).get('/credentials').set('Authorization', 'Bearer not-a-jwt');
    expect(res.status).toBe(401);
  });
});

describe('role-based access', () => {
  it('students cannot search other students', async () => {
    const res = await request(app).get('/students/search?q=a').set('Authorization', token('STUDENT'));
    expect(res.status).toBe(403);
  });

  it('students cannot read the admin dashboard', async () => {
    const res = await request(app).get('/dashboard/summary').set('Authorization', token('STUDENT'));
    expect(res.status).toBe(403);
  });

  it('students cannot issue or revoke credentials', async () => {
    expect((await request(app).post('/credentials').set('Authorization', token('STUDENT')).send({})).status).toBe(403);
    expect((await request(app).post('/credentials/CRED-1/revoke').set('Authorization', token('RECRUITER'))).status).toBe(403);
  });

  it('recruiters cannot list all credentials', async () => {
    const res = await request(app).get('/credentials').set('Authorization', token('RECRUITER'));
    expect(res.status).toBe(403);
  });

  it('a student listing is scoped to their own credentials', async () => {
    await request(app).get('/credentials').set('Authorization', token('STUDENT', 'stu-42'));
    expect(prismaMock.credential.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { studentId: 'stu-42' } })
    );
  });

  it('a student cannot open someone else’s credential', async () => {
    prismaMock.credential.findUnique.mockResolvedValueOnce({
      id: 'CRED-1', studentId: 'someone-else', student: {}, issuer: {}, timelineEvents: [],
    });
    const res = await request(app).get('/credentials/CRED-1').set('Authorization', token('STUDENT', 'stu-42'));
    expect(res.status).toBe(403);
  });
});

describe('hardening', () => {
  it('health reports which services are simulated', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.blockchain).toHaveProperty('mode');
    expect(res.body.ipfs).toHaveProperty('mode');
  });

  it('sets security headers', async () => {
    const res = await request(app).get('/health');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
  });

  it('unknown routes return a JSON 404', async () => {
    const res = await request(app).get('/nope');
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Not found');
  });

  it('public verify of an unknown id is a clean "flagged" result, not an error', async () => {
    prismaMock.credential.findUnique.mockResolvedValueOnce(null);
    const res = await request(app).get('/verify/CRED-NOPE');
    expect(res.status).toBe(200);
    expect(res.body.verified).toBe(false);
  });
});
