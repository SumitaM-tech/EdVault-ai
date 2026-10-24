import type { Credential, Student } from '@/types';
import * as mockData from '@/data/mock-data';

const DEFAULT_API_URL = import.meta.env.DEV ? '/api' : 'http://localhost:5000';
export const API_URL = import.meta.env.VITE_API_URL || DEFAULT_API_URL;

let fallbackActive = false;

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) { super(message); this.name = 'ApiError'; this.status = status; }
}

export function consumeFallbackFlag() { const v = fallbackActive; fallbackActive = false; return v; }
function getToken() { return localStorage.getItem('edvault_token'); }
export function setToken(t: string) { localStorage.setItem('edvault_token', t); }
export function clearToken() { localStorage.removeItem('edvault_token'); localStorage.removeItem('edvault_user'); }
export function getStoredUser() { const r = localStorage.getItem('edvault_user'); return r ? JSON.parse(r) : null; }
export function setStoredUser(u: unknown) { localStorage.setItem('edvault_user', JSON.stringify(u)); }
function isNetworkError(e: unknown) { return !(e instanceof ApiError); }

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const isFormData = options.body instanceof FormData;
  const headers: Record<string, string> = { ...(options.headers as Record<string, string>) };
  if (!isFormData) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    if (res.status === 401) clearToken();
    throw new ApiError(body.error || `Request failed (${res.status})`, res.status);
  }
  return res.json();
}

async function requestWithFallback<T>(path: string, options: RequestInit, fallback: () => T): Promise<T> {
  try { return await request<T>(path, options); }
  catch (error) {
    if (!isNetworkError(error)) throw error;
    if (await checkApiHealth()) throw error;
    console.warn(`[EdVault] fallback for ${path}`);
    fallbackActive = true;
    return fallback();
  }
}

export interface LoginResponse {
  token: string;
  user: { id: string; email: string; name: string; role: string; institution?: string; degree?: string; wallet?: string; year?: string; avatar?: string; studentId?: string };
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const result = await request<LoginResponse>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
  setToken(result.token);
  setStoredUser(result.user);
  return result;
}

export async function fetchDashboardSummary() {
  return requestWithFallback('/dashboard/summary', {}, () => ({ stats: mockData.stats, logs: mockData.logs }));
}

export async function fetchStudentProfile(_id?: string): Promise<Student> {
  return requestWithFallback('/students/me', {}, () => mockData.mainStudent);
}

export async function fetchCredentials() {
  return requestWithFallback('/credentials', {}, () => mockData.mainStudent.credentials);
}

function mockVerificationResult(credentialId: string) {
  const student = mockData.students.find(s => s.credentials.some(c => c.id === credentialId));
  const credential = student?.credentials.find(c => c.id === credentialId);
  const verified = !!credential;
  return { verified, student: student ?? null, credential: credential ?? null, blockchainTx: credential?.blockchainTx ?? '', status: verified ? 'Verified' as const : 'Flagged' as const };
}

/** Accepts a bare id, a verification URL (…/verify/CRED-XXXX) or a legacy edvault:// payload. */
export function extractCredentialId(input: string): string {
  const v = input.trim();
  const m = v.match(/(?:\/verify\/|edvault:\/\/credential\/)([A-Za-z0-9_-]+)/);
  return m ? m[1] : v;
}

export interface VerificationChecks {
  anchor: 'live' | 'simulated';
  signatureValid?: boolean | null;
  hashMatched: boolean;
  documentChecked: boolean;
  documentMatched: boolean;
  revoked: boolean;
  auditLogged: boolean;
  auditTx: string | null;
  trustScore: number | null;
}

export interface VerificationResult {
  verified: boolean;
  student: Student | null;
  credential: Credential | null;
  blockchainTx: string;
  status: 'Verified' | 'Flagged';
  simulated?: boolean;
  checks?: VerificationChecks | null;
}

export async function fetchVerificationResult(
  input: { credentialId?: string; qr?: string },
  file?: File
): Promise<VerificationResult> {
  const id = extractCredentialId(input.credentialId ?? input.qr ?? '');
  if (!id) return { verified: false, student: null, credential: null, blockchainTx: '', status: 'Flagged' };
  if (file) {
    const fd = new FormData();
    fd.append('file', file);
    return request<VerificationResult>(`/verify/${encodeURIComponent(id)}`, { method: 'POST', body: fd });
  }
  return requestWithFallback<VerificationResult>(`/verify/${encodeURIComponent(id)}`, {}, () => mockVerificationResult(id) as VerificationResult);
}

export async function fetchAuditLog(credentialId: string) {
  return request<{ source: 'blockchain' | 'database'; entries: Array<{ verifier: string; timestamp: string; hashMatched: boolean; documentMatched: boolean; trustScore: number | null }> }>(
    `/credentials/${encodeURIComponent(credentialId)}/audit-log`
  );
}

export async function fetchFraudInsights() {
  return requestWithFallback('/fraud/insights', {}, () => ({
    fraud: mockData.fraud,
    dashboardCards: [
      { label: 'Risk Score', value: mockData.fraud.riskScore, details: 'Lower than the weekly average' },
      { label: 'Suspicious Uploads', value: mockData.fraud.suspiciousUploads, details: 'Across active institutions' },
      { label: 'Duplicate Records', value: mockData.fraud.duplicateRecords, details: 'Auto-quarantined for review' },
      { label: 'Metadata Alerts', value: mockData.fraud.metadataAlerts, details: 'High-confidence anomalies' },
    ],
  }));
}

export async function fetchCredentialDetails(id: string) {
  return requestWithFallback(`/credentials/${encodeURIComponent(id)}`, {}, () => {
    const student = mockData.students.find(s => s.credentials.some(c => c.id === id));
    const credential = student?.credentials.find(c => c.id === id);
    return { credential, timeline: mockData.timeline, student: student ?? mockData.mainStudent };
  });
}

export interface IssueResult {
  credential: Credential;
  student: Student;
  blockchain: { mock: boolean; txHash: string; blockNumber: number };
  ipfs: { cid: string; mock: boolean };
  ai: unknown;
  /** Present only when a new student account was created. Shown once to the issuer. */
  studentAccount?: { email: string; temporaryPassword: string };
}

export async function issueCredential(
  formData: { studentName: string; studentId: string; institution: string; degree: string; department: string; cgpa: string; gradDate: string; studentEmail?: string },
  pdfFile?: File
) {
  if (pdfFile) {
    const fd = new FormData();
    Object.entries(formData).forEach(([k, v]) => v && fd.append(k, v));
    fd.append('pdf', pdfFile);
    return request<IssueResult>('/credentials', { method: 'POST', body: fd });
  }
  return request<IssueResult>('/credentials', { method: 'POST', body: JSON.stringify(formData) });
}

export async function revokeCredential(id: string) {
  return request(`/credentials/${encodeURIComponent(id)}/revoke`, { method: 'POST' });
}

export async function fetchLedgerCredentials() {
  return requestWithFallback('/credentials', {}, () =>
    mockData.students.flatMap(s => s.credentials.map(c => ({ ...c, studentName: s.name, blockNumber: 15420142 })))
  );
}

// ── NEW: Student Search ───────────────────────────────────────────────────────

export async function searchStudents(q: string) {
  return requestWithFallback(`/students/search?q=${encodeURIComponent(q)}`, {}, () => []);
}

// ── NEW: AI endpoints ─────────────────────────────────────────────────────────

export async function fetchAISummary(): Promise<{ summary: string }> {
  return requestWithFallback('/ai/summary', {}, () => ({ summary: 'AI summary unavailable in demo mode.' }));
}

export async function ocrDocument(file: File): Promise<{ text: string }> {
  const fd = new FormData();
  fd.append('file', file);
  return request('/ai/ocr', { method: 'POST', body: fd });
}

export async function chatWithAI(message: string, context?: { credentialId?: string; institution?: string; status?: string }): Promise<{ reply: string }> {
  return requestWithFallback(
    '/ai/chat',
    { method: 'POST', body: JSON.stringify({ message, ...context }) },
    () => ({ reply: 'AI chat unavailable — add GROQ_API_KEY to backend/.env' })
  );
}

export async function fetchComplianceReport(): Promise<{ report: string }> {
  return request('/ai/compliance-report', {});
}

// ── NEW: Share + Email ────────────────────────────────────────────────────────

export async function shareCredential(id: string, email?: string): Promise<{ shareLink: string }> {
  return request(`/credentials/${encodeURIComponent(id)}/share`, {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export async function sendEmailManual(to: string, credentialId: string): Promise<{ success: boolean; message: string }> {
  return request('/email/send', {
    method: 'POST',
    body: JSON.stringify({ to, credentialId }),
  });
}

// ── NEW: Access Log ───────────────────────────────────────────────────────────

export async function fetchAccessLog() {
  return requestWithFallback('/access-log', {}, () => []);
}

// ── Admin user management (ADMIN only) ────────────────────────────────────────

export type AppRole = 'ADMIN' | 'FACULTY' | 'RECRUITER' | 'STUDENT';
export interface AdminUser { id: string; email: string; name: string; role: AppRole; institution: string | null; createdAt: string }

export async function fetchUsers() { return request<AdminUser[]>('/admin/users'); }
export async function createUser(input: { email: string; name: string; role: AppRole; institution?: string }) {
  return request<{ user: AdminUser; temporaryPassword: string }>('/admin/users', { method: 'POST', body: JSON.stringify(input) });
}
export async function changeUserRole(id: string, role: AppRole) {
  return request<AdminUser>(`/admin/users/${encodeURIComponent(id)}/role`, { method: 'PATCH', body: JSON.stringify({ role }) });
}

// ── Decentralized identity (STUDENT) ──────────────────────────────────────────

export async function fetchMyDid() {
  return request<{ did: string; didDocument: unknown }>('/students/me/did');
}

// ── Utilities ─────────────────────────────────────────────────────────────────

export async function checkApiHealth(): Promise<boolean> {
  try { const res = await fetch(`${API_URL}/health`, { signal: AbortSignal.timeout(3000) }); return res.ok; }
  catch { return false; }
}

export function isAuthError(error: unknown) { return error instanceof ApiError && error.status === 401; }
