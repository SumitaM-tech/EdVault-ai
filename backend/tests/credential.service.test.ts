import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createHash } from 'crypto';

const prismaMock = vi.hoisted(() => ({
  user: { findFirst: vi.fn(), findUnique: vi.fn(), create: vi.fn() },
  credential: { findFirst: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
  verificationLog: { create: vi.fn() },
  iPFSDocument: { upsert: vi.fn() },
}));
const chainMock = vi.hoisted(() => ({
  issueOnChain: vi.fn(),
  revokeOnChain: vi.fn(),
  getOnChainCredential: vi.fn(),
  recordVerification: vi.fn(),
  getVerificationHistory: vi.fn(),
}));
const ipfsMock = vi.hoisted(() => ({ uploadDocument: vi.fn(), getGatewayUrl: vi.fn((c: string) => `https://gw/${c}`) }));

vi.mock('../src/lib/prisma.js', () => ({ prisma: prismaMock }));
vi.mock('../src/services/blockchain.service.js', () => ({ blockchainService: chainMock }));
vi.mock('../src/services/ipfs.service.js', () => ({ ipfsService: ipfsMock }));
vi.mock('../src/services/groq.service.js', () => ({
  analyzeFraud: vi.fn().mockResolvedValue({ level: 'TRUSTED', summary: '' }),
  summarizeAcademicProfile: vi.fn(),
  extractTextFromImage: vi.fn(),
}));
vi.mock('../src/services/email.service.js', () => ({
  sendVerificationAlert: vi.fn().mockResolvedValue(undefined),
  sendCredentialEmail: vi.fn(),
}));

import { createCredential, verifyCredential, revokeCredential } from '../src/services/credential.service.js';

const sha = (b: Buffer | string) => createHash('sha256').update(b).digest('hex');
const PDF = Buffer.from('%PDF-1.4\nhello credential\n%%EOF');
const input = {
  studentName: 'Aarav Mehta', studentId: 'STU-1', institution: 'EdVault University',
  degree: 'B.Sc. CS', department: 'CS', cgpa: '3.9', gradDate: '2024-05-15',
};

const credRow = (over: Record<string, unknown> = {}) => ({
  id: 'CRED-1', title: 'T', institution: 'I', issuedAt: new Date(), status: 'VERIFIED',
  hash: sha(PDF), cid: 'bafy', blockchainTx: '0xabc', qrPayload: 'http://x/verify/CRED-1',
  onChainId: 'abcd-1', studentId: 's1',
  student: { id: 's1', name: 'A', email: 'a@x.edu', institution: 'I', degree: 'D', year: '2024', wallet: '0x1', avatar: null },
  ...over,
});

beforeEach(() => {
  vi.clearAllMocks();
  prismaMock.credential.findFirst.mockResolvedValue(null);
  prismaMock.verificationLog.create.mockResolvedValue({});
  ipfsMock.uploadDocument.mockImplementation(async (buf: Buffer) => ({ cid: `bafy-${sha(buf).slice(0, 8)}`, hash: sha(buf), size: buf.length, mock: false }));
  chainMock.issueOnChain.mockResolvedValue({ onChainId: 'ab-1', txHash: '0xtx', blockNumber: 7, mock: false });
  chainMock.recordVerification.mockResolvedValue('0xaudit');
});

describe('issuing', () => {
  beforeEach(() => {
    prismaMock.user.findFirst.mockResolvedValue(null);
    prismaMock.user.create.mockImplementation(async ({ data }: any) => ({ id: 's1', ...data }));
    prismaMock.credential.create.mockImplementation(async ({ data }: any) => ({
      ...credRow(), ...data, issuedAt: new Date(), issuer: {}, timelineEvents: [],
      student: { id: 's1', email: 'a@x.edu', name: 'A' },
    }));
    prismaMock.user.findUnique.mockResolvedValue({ id: 's1', name: 'A', role: 'STUDENT', email: 'a@x.edu', credentials: [] });
  });

  it('anchors the SHA-256 of the actual PDF bytes, not of metadata', async () => {
    await createCredential('issuer', input, PDF, 'degree.pdf');
    expect(chainMock.issueOnChain).toHaveBeenCalledWith(expect.any(String), sha(PDF), expect.any(String));
    expect(ipfsMock.uploadDocument).toHaveBeenCalledWith(PDF, 'degree.pdf', expect.any(String));
  });

  it('pins the metadata JSON when no PDF is supplied, and hashes those exact bytes', async () => {
    await createCredential('issuer', input);
    const [pinned] = ipfsMock.uploadDocument.mock.calls[0];
    expect(chainMock.issueOnChain.mock.calls[0][1]).toBe(sha(pinned));
  });

  it('rejects files that are not PDFs', async () => {
    await expect(createCredential('issuer', input, Buffer.from('MZ not a pdf'), 'evil.exe')).rejects.toMatchObject({ status: 400 });
    expect(chainMock.issueOnChain).not.toHaveBeenCalled();
  });

  it('rejects a document that was already issued', async () => {
    prismaMock.credential.findFirst.mockResolvedValueOnce({ id: 'CRED-OLD' });
    await expect(createCredential('issuer', input, PDF, 'a.pdf')).rejects.toMatchObject({ status: 409 });
  });

  it('creates new students with a random one-time password, never "student123"', async () => {
    const a = await createCredential('issuer', input, PDF, 'a.pdf');
    prismaMock.credential.findFirst.mockResolvedValue(null);
    const b = await createCredential('issuer', { ...input, studentId: 'STU-2' }, Buffer.from('%PDF-1.4 other'), 'b.pdf');
    const pa = (a as any).studentAccount.temporaryPassword as string;
    const pb = (b as any).studentAccount.temporaryPassword as string;
    expect(pa).toBeTruthy();
    expect(pa).not.toBe('student123');
    expect(pa).not.toBe(pb);
    const stored = prismaMock.user.create.mock.calls[0][0].data.passwordHash as string;
    expect(stored).toMatch(/^\$2[aby]\$/);
  });

  it('does not store the credential if the chain call fails', async () => {
    chainMock.issueOnChain.mockRejectedValueOnce(Object.assign(new Error('Blockchain unavailable'), { status: 503 }));
    await expect(createCredential('issuer', input, PDF, 'a.pdf')).rejects.toMatchObject({ status: 503 });
    expect(prismaMock.credential.create).not.toHaveBeenCalled();
  });
});

describe('verifying', () => {
  it('records real comparison results on-chain (match)', async () => {
    prismaMock.credential.findUnique.mockResolvedValue(credRow());
    chainMock.getOnChainCredential.mockResolvedValue({ documentHash: sha(PDF), revoked: false, trustScore: 800, ipfsCid: 'bafy', isDuplicate: false });
    const res = await verifyCredential('CRED-1', { file: PDF });
    expect(res.verified).toBe(true);
    expect(chainMock.recordVerification).toHaveBeenCalledWith('abcd-1', true, true);
    expect((res as any).checks).toMatchObject({ anchor: 'live', documentChecked: true, documentMatched: true, auditLogged: true });
  });

  it('flags a tampered document and records documentMatched=false', async () => {
    prismaMock.credential.findUnique.mockResolvedValue(credRow());
    chainMock.getOnChainCredential.mockResolvedValue({ documentHash: sha(PDF), revoked: false, trustScore: 800, ipfsCid: 'bafy', isDuplicate: false });
    const res = await verifyCredential('CRED-1', { file: Buffer.from('%PDF-1.4 forged') });
    expect(res.verified).toBe(false);
    expect(chainMock.recordVerification).toHaveBeenCalledWith('abcd-1', true, false);
  });

  it('flags a database record whose hash differs from the on-chain hash', async () => {
    prismaMock.credential.findUnique.mockResolvedValue(credRow({ hash: sha('tampered-db-row') }));
    chainMock.getOnChainCredential.mockResolvedValue({ documentHash: sha(PDF), revoked: false, trustScore: 800, ipfsCid: 'bafy', isDuplicate: false });
    const res = await verifyCredential('CRED-1');
    expect(res.verified).toBe(false);
    expect(chainMock.recordVerification).toHaveBeenCalledWith('abcd-1', false, false);
  });

  it('treats an on-chain revocation as invalid even if the database says VERIFIED', async () => {
    prismaMock.credential.findUnique.mockResolvedValue(credRow());
    chainMock.getOnChainCredential.mockResolvedValue({ documentHash: sha(PDF), revoked: true, trustScore: 0, ipfsCid: 'bafy', isDuplicate: false });
    const res = await verifyCredential('CRED-1');
    expect(res.verified).toBe(false);
    expect(chainMock.recordVerification).not.toHaveBeenCalled();
  });

  it('propagates chain failures instead of silently reporting "valid"', async () => {
    prismaMock.credential.findUnique.mockResolvedValue(credRow());
    chainMock.getOnChainCredential.mockRejectedValue(Object.assign(new Error('Blockchain unavailable'), { status: 503 }));
    await expect(verifyCredential('CRED-1')).rejects.toMatchObject({ status: 503 });
  });

  it('reports an audit-log failure instead of hiding it', async () => {
    prismaMock.credential.findUnique.mockResolvedValue(credRow());
    chainMock.getOnChainCredential.mockResolvedValue({ documentHash: sha(PDF), revoked: false, trustScore: 800, ipfsCid: 'bafy', isDuplicate: false });
    chainMock.recordVerification.mockRejectedValue(new Error('rpc down'));
    const res = await verifyCredential('CRED-1');
    expect((res as any).checks.auditLogged).toBe(false);
  });

  it('is explicit when nothing is anchored (simulated) and writes no audit entry', async () => {
    prismaMock.credential.findUnique.mockResolvedValue(credRow({ onChainId: null }));
    const res = await verifyCredential('CRED-1');
    expect((res as any).checks.anchor).toBe('simulated');
    expect(chainMock.recordVerification).not.toHaveBeenCalled();
  });

  it('never leaks the student email or wallet in the public response', async () => {
    prismaMock.credential.findUnique.mockResolvedValue(credRow());
    chainMock.getOnChainCredential.mockResolvedValue({ documentHash: sha(PDF), revoked: false, trustScore: 800, ipfsCid: 'bafy', isDuplicate: false });
    const res = await verifyCredential('CRED-1');
    expect((res.student as any).email).toBe('');
    expect((res.student as any).wallet).toBe('');
  });
});

describe('revoking', () => {
  it('does not mark the credential revoked in the database if the chain call fails', async () => {
    prismaMock.credential.findUnique.mockResolvedValue(credRow());
    chainMock.revokeOnChain.mockRejectedValue(Object.assign(new Error('On-chain revocation failed'), { status: 502 }));
    await expect(revokeCredential('CRED-1', 'admin')).rejects.toMatchObject({ status: 502 });
    expect(prismaMock.credential.update).not.toHaveBeenCalled();
  });
});
