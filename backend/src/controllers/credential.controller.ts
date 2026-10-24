import { Response, NextFunction } from 'express';
import { createCredentialSchema } from '../validators/auth.validator.js';
import {
  createCredential,
  getCredentialById,
  verifyCredential,
  getAuditLog,
  revokeCredential,
  listCredentials,
  getDashboardSummary,
  getFraudInsights,
  searchByStudentName,
  getStudentAISummary,
  ocrCredentialFromBuffer,
  createShareLink,
} from '../services/credential.service.js';
import { getUserById } from '../services/auth.service.js';
import { verificationAssistant, generateComplianceReport } from '../services/groq.service.js';
import { sendCredentialEmail, sendVerificationAlert } from '../services/email.service.js';
import type { AuthRequest } from '../middleware/auth.js';

function paramId(v: string | string[]) { return Array.isArray(v) ? v[0] : v; }

// ── Existing (unchanged) ─────────────────────────────────────────────────────

export async function issueCredential(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const input = createCredentialSchema.parse(req.body);
    const file = (req as any).file as Express.Multer.File | undefined;
    const result = await createCredential(req.user!.userId, input, file?.buffer, file?.originalname);
    res.status(201).json(result);
  } catch (err) { next(err); }
}

export async function getCredential(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const result = await getCredentialById(paramId(req.params.id), req.user);
    if (!result) return res.status(404).json({ error: 'Credential not found' });
    res.json(result);
  } catch (err) { next(err); }
}

/** Public verification. POST may include an optional PDF (`file`) to compare against the anchored hash. */
export async function verify(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const file = (req as any).file as Express.Multer.File | undefined;
    res.json(await verifyCredential(paramId(req.params.id), {
      requester: req.user?.email ?? 'Public Verifier',
      file: file?.buffer,
      ipAddress: req.ip,
      method: typeof req.query.method === 'string' && req.query.method === 'QR' ? 'QR' : undefined,
    }));
  } catch (err) { next(err); }
}

export async function credentialAuditLog(req: AuthRequest, res: Response, next: NextFunction) {
  try { res.json(await getAuditLog(paramId(req.params.id))); } catch (err) { next(err); }
}

export async function revoke(req: AuthRequest, res: Response, next: NextFunction) {
  try { res.json(await revokeCredential(paramId(req.params.id), req.user!.userId, req.user!.role)); }
  catch (err) { next(err); }
}

export async function listAll(req: AuthRequest, res: Response, next: NextFunction) {
  try { res.json(await listCredentials(req.user!)); } catch (err) { next(err); }
}

export async function dashboard(_req: AuthRequest, res: Response, next: NextFunction) {
  try { res.json(await getDashboardSummary()); } catch (err) { next(err); }
}

export async function fraudInsights(_req: AuthRequest, res: Response, next: NextFunction) {
  try { res.json(await getFraudInsights()); } catch (err) { next(err); }
}

export async function me(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const student = await getUserById(req.user!.userId);
    if (!student) return res.status(404).json({ error: 'User not found' });
    res.json(student);
  } catch (err) { next(err); }
}

// ── New endpoints ─────────────────────────────────────────────────────────────

/** Student search by name */
export async function searchStudents(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const q = String(req.query.q || '');
    res.json(q ? await searchByStudentName(q) : []);
  } catch (err) { next(err); }
}

/** AI academic summary for logged-in student */
export async function aiSummary(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const summary = await getStudentAISummary(req.user!.userId);
    res.json({ summary });
  } catch (err) { next(err); }
}

/** OCR: extract text from uploaded image/PDF */
export async function ocrDocument(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const file = (req as any).file as Express.Multer.File | undefined;
    if (!file) return res.status(400).json({ error: 'File required' });
    const text = await ocrCredentialFromBuffer(file.buffer, file.mimetype);
    res.json({ text });
  } catch (err) { next(err); }
}

/** AI verification chatbot */
export async function aiChat(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { message, credentialId, institution, status } = req.body ?? {};
    if (typeof message !== 'string' || !message.trim()) return res.status(400).json({ error: 'message required' });
    if (message.length > 2000) return res.status(400).json({ error: 'message too long' });
    const reply = await verificationAssistant(message, { credentialId, institution, status });
    res.json({ reply });
  } catch (err) { next(err); }
}

/** Generate AI compliance report */
export async function complianceReport(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { stats } = await getDashboardSummary();
    const riskScore = stats.verificationRequests > 0
      ? Math.round((stats.fraudAlerts / stats.verificationRequests) * 100)
      : 0;
    const report = await generateComplianceReport({
      totalCredentials: stats.credentialsIssued,
      fraudAlerts: stats.fraudAlerts,
      riskScore,
      institutionName: 'EdVault University',
    });
    res.json({ report });
  } catch (err) { next(err); }
}

/** Share credential link + optional email */
export async function shareCredential(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const credentialId = paramId(req.params.id);
    const { email } = req.body ?? {};
    const shareLink = await createShareLink(credentialId, req.user!);
    if (email) {
      sendCredentialEmail(email, credentialId, shareLink).catch(() => {});
    }
    res.json({ shareLink });
  } catch (err) { next(err); }
}

/** Admin: send credential email manually */
export async function sendEmail(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { to, credentialId, shareLink } = req.body ?? {};
    if (!to || !credentialId) return res.status(400).json({ error: 'to and credentialId required' });
    const link = shareLink || await createShareLink(credentialId, req.user!);
    await sendCredentialEmail(to, credentialId, link);
    res.json({ success: true, message: `Email sent to ${to}` });
  } catch (err) { next(err); }
}

/** Access log: who verified what */
export async function accessLog(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { prisma } = await import('../lib/prisma.js');
    const logs = await prisma.verificationLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { credential: { select: { id: true, title: true, institution: true } } },
    });
    res.json(logs.map(l => ({
      id: l.id,
      credentialId: l.credentialId,
      credentialTitle: l.credential?.title,
      outcome: l.outcome,
      method: l.method,
      ipAddress: l.ipAddress,
      createdAt: l.createdAt.toISOString(),
    })));
  } catch (err) { next(err); }
}
