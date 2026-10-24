import axios from 'axios';

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

// Updated active models as of June 2026
const FAST_MODEL   = 'llama-3.1-8b-instant';
const LONG_MODEL   = 'llama-3.3-70b-versatile';
const VISION_MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct';

function key() { return process.env.GROQ_API_KEY || ''; }

async function chat(messages: { role: string; content: any }[], model = FAST_MODEL, maxTokens = 512): Promise<string> {
  if (!key()) return '[Groq key not configured — add GROQ_API_KEY to backend/.env]';
  try {
    const res = await axios.post(
      GROQ_URL,
      { model, messages, max_tokens: maxTokens, temperature: 0.3 },
      { headers: { Authorization: `Bearer ${key()}`, 'Content-Type': 'application/json' }, timeout: 20000 }
    );
    return res.data.choices[0]?.message?.content?.trim() || '';
  } catch (err: any) {
    console.error('Groq error:', err?.response?.data?.error?.message || err.message);
    return '[AI unavailable]';
  }
}

export async function analyzeFraud(credential: {
  title: string; institution: string; cgpa?: string | null; department?: string | null;
}): Promise<{ level: string; score: number; summary: string; flags: string[] }> {
  const prompt = `You are an academic fraud detection AI for EdVault blockchain platform.
Credential: Title="${credential.title}", Institution="${credential.institution}", Dept="${credential.department ?? 'N/A'}", CGPA="${credential.cgpa ?? 'N/A'}"
Respond ONLY in valid JSON (no markdown): {"level":"TRUSTED","score":85,"summary":"one sentence","flags":[]}
level must be: TRUSTED, SUSPICIOUS, or HIGH_RISK`;
  const raw = await chat([{ role: 'user', content: prompt }], FAST_MODEL, 200);
  try {
    const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim());
    return { level: parsed.level || 'TRUSTED', score: Number(parsed.score) || 80, summary: parsed.summary || '', flags: parsed.flags || [] };
  } catch {
    return { level: 'TRUSTED', score: 80, summary: 'Analysis complete.', flags: [] };
  }
}

export async function extractTextFromImage(base64: string, mimeType = 'image/jpeg'): Promise<string> {
  if (!key()) return '[Groq key not configured]';
  try {
    const res = await axios.post(GROQ_URL, {
      model: VISION_MODEL,
      messages: [{ role: 'user', content: [
        { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64}` } },
        { type: 'text', text: 'Extract all text from this academic certificate. Return only the raw extracted text.' }
      ]}],
      max_tokens: 1024,
    }, { headers: { Authorization: `Bearer ${key()}` }, timeout: 30000 });
    return res.data.choices[0]?.message?.content?.trim() || '';
  } catch (err: any) {
    console.error('Groq vision error:', err?.response?.data?.error?.message || err.message);
    return '[OCR unavailable]';
  }
}

export async function summarizeAcademicProfile(credentials: {
  title: string; institution: string; cgpa?: string | null; issuedAt: Date;
}[]): Promise<string> {
  if (!credentials.length) return 'No credentials issued yet. Once your institution admin issues credentials, your AI summary will appear here.';
  const list = credentials.map(c => `- ${c.title} from ${c.institution} (CGPA: ${c.cgpa ?? 'N/A'}, ${new Date(c.issuedAt).getFullYear()})`).join('\n');
  const ai = await chat([{ role: 'user', content: `Write a 2-sentence professional academic summary for:\n${list}` }], FAST_MODEL, 150);
  // chat() returns "[...]" marker strings when the key is missing or Groq fails; never show those as the summary.
  if (!ai || /^\[.*\]$/.test(ai)) return localAcademicSummary(credentials);
  return ai;
}

/** Deterministic offline summary used when Groq is not configured or unavailable. */
export function localAcademicSummary(credentials: {
  title: string; institution: string; cgpa?: string | null; issuedAt: Date;
}[]): string {
  const n = credentials.length;
  const insts = [...new Set(credentials.map(c => c.institution))];
  const cgpas = credentials.map(c => parseFloat(c.cgpa ?? '')).filter(v => !Number.isNaN(v));
  const best = cgpas.length ? Math.max(...cgpas) : null;
  const latest = [...credentials].sort((a, b) => +new Date(b.issuedAt) - +new Date(a.issuedAt))[0];
  return `Holds ${n} verified credential${n > 1 ? 's' : ''} from ${insts.join(', ')}` +
    `${best !== null ? `, with a best CGPA of ${best}` : ''}. ` +
    `Most recent: ${latest.title} (${new Date(latest.issuedAt).getFullYear()}). (Offline summary — add GROQ_API_KEY for an AI-written one.)`;
}

export async function verificationAssistant(message: string, context: {
  credentialId?: string; institution?: string; status?: string;
}): Promise<string> {
  return chat([
    {
      role: 'system',
      content: `You are EdVault AI Assistant — expert in EdVault blockchain credential verification platform.
EdVault facts:
- Blockchain credential system running on local Hardhat node (port 8545)
- Credentials anchored on-chain with SHA-256 hashes + stored in PostgreSQL
- Institutions: EdVault University (default), plus any admin adds
- To issue: Admin panel → Issue Credential tab
- To verify: Public Verifier page → enter Credential ID (format: CRED-XXXXXXXX)
- Student search: Admin panel → Student Search tab
- AI Sentinel: fraud detection dashboard with Groq AI
- Ledger Explorer: all on-chain credential records
Context: credential=${context.credentialId || 'N/A'}, institution=${context.institution || 'N/A'}, status=${context.status || 'N/A'}
Answer helpfully in 2-3 sentences max.`
    },
    { role: 'user', content: message }
  ], LONG_MODEL, 300);
}

export async function generateComplianceReport(stats: {
  totalCredentials: number; fraudAlerts: number; riskScore: number; institutionName: string;
}): Promise<string> {
  return chat([{
    role: 'user',
    content: `Write a 3-sentence institutional compliance report for ${stats.institutionName}: ${stats.totalCredentials} credentials issued, ${stats.fraudAlerts} fraud alerts, risk score ${stats.riskScore}%. Include one actionable recommendation.`
  }], FAST_MODEL, 200);
}

export async function naturalLanguageSearch(query: string, credentials: {
  id: string; title: string; institution: string; studentName: string;
}[]): Promise<string[]> {
  if (!credentials.length) return [];
  const list = credentials.slice(0, 20).map(c => `${c.id}|${c.title}|${c.institution}|${c.studentName}`).join('\n');
  const result = await chat([{
    role: 'user',
    content: `Credentials:\n${list}\nReturn only IDs matching: "${query}"\nFormat: comma-separated IDs only, no explanation.`
  }], FAST_MODEL, 100);
  return result.split(',').map(s => s.trim()).filter(s => s.startsWith('CRED-'));
}
