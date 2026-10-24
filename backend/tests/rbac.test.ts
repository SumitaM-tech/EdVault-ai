import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';

const prismaMock = vi.hoisted(() => ({
  user: { findFirst: vi.fn(), findUnique: vi.fn().mockResolvedValue(null), create: vi.fn(), update: vi.fn(), findMany: vi.fn().mockResolvedValue([]), count: vi.fn() },
  credential: { findFirst: vi.fn(), findUnique: vi.fn().mockResolvedValue(null), findMany: vi.fn().mockResolvedValue([]), create: vi.fn(), update: vi.fn(), count: vi.fn() },
  verificationLog: { create: vi.fn(), findMany: vi.fn().mockResolvedValue([]), count: vi.fn() },
  iPFSDocument: { upsert: vi.fn() },
}));
vi.mock('../src/lib/prisma.js', () => ({ prisma: prismaMock }));

import { createApp } from '../src/app.js';
import { signToken } from '../src/lib/jwt.js';
import { ROLES } from '../src/config/permissions.js';

const app = createApp();
const as = (role: string, userId = 'u1') => `Bearer ${signToken({ userId, email: `${role}@x.edu`, role })}`;

/** [method, url, roles that must be ALLOWED past the role gate] */
const matrix: Array<[string, string, string[]]> = [
  ['get',  '/admin/users',              ['ADMIN']],
  ['post', '/admin/users',              ['ADMIN']],
  ['get',  '/access-log',               ['ADMIN']],
  ['get',  '/fraud/insights',           ['ADMIN']],
  ['get',  '/ai/compliance-report',     ['ADMIN']],
  ['get',  '/dashboard/summary',        ['ADMIN', 'FACULTY']],
  ['post', '/credentials',              ['ADMIN', 'FACULTY']],
  ['post', '/email/send',               ['ADMIN', 'FACULTY']],
  ['get',  '/students/search?q=ab',     ['ADMIN', 'FACULTY', 'RECRUITER']],
  ['get',  '/students/me/did',          ['STUDENT']],
];

describe('four-role access matrix', () => {
  for (const [method, url, allowed] of matrix) {
    for (const role of ROLES) {
      const ok = allowed.includes(role);
      it(`${role} ${method.toUpperCase()} ${url} -> ${ok ? 'passes role gate' : '403'}`, async () => {
        const res = await (request(app) as any)[method](url).set('Authorization', as(role)).send({});
        if (ok) expect(res.status).not.toBe(403);
        else expect(res.status).toBe(403);
      });
    }
  }
});

describe('faculty revoke scope', () => {
  it('faculty cannot revoke a credential issued by someone else', async () => {
    prismaMock.credential.findUnique.mockResolvedValueOnce({ id: 'C1', issuerId: 'other', status: 'VERIFIED', onChainId: null });
    const res = await request(app).post('/credentials/C1/revoke').set('Authorization', as('FACULTY', 'me'));
    expect(res.status).toBe(403);
  });
  it('admin can revoke any credential', async () => {
    prismaMock.credential.findUnique.mockResolvedValueOnce({ id: 'C1', issuerId: 'other', status: 'VERIFIED', onChainId: null });
    prismaMock.credential.update.mockResolvedValueOnce({ id: 'C1', title: 't', institution: 'i', status: 'REVOKED', student: {}, timelineEvents: [], issuedAt: new Date(), hash: 'h', cid: 'c', blockchainTx: 'x', qrPayload: 'q' });
    const res = await request(app).post('/credentials/C1/revoke').set('Authorization', as('ADMIN'));
    expect(res.status).not.toBe(403);
  });
});

describe('admin cannot demote themselves', () => {
  it('rejects own role change', async () => {
    const res = await request(app).patch('/admin/users/a1/role').set('Authorization', as('ADMIN', 'a1')).send({ role: 'STUDENT' });
    expect(res.status).toBe(400);
  });
});

describe('DID + issuer signature', () => {
  it('resolves a did:ethr identifier publicly', async () => {
    const did = 'did:ethr:31337:0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
    const res = await request(app).get(`/did/${encodeURIComponent(did)}`);
    expect(res.status).toBe(200);
    expect(res.body.didDocument.id).toBe(did);
  });
  it('rejects a malformed DID', async () => {
    expect((await request(app).get('/did/not-a-did')).status).toBe(400);
  });
});
