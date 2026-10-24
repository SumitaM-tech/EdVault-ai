import axios from 'axios';

const RESEND_URL = 'https://api.resend.com/emails';
function key() { return process.env.RESEND_API_KEY || ''; }

// From address — Resend requires a verified domain in production
// For testing, use onboarding@resend.dev (works without domain verification)
function from() {
  return key().startsWith('re_') ? 'EdVault AI <onboarding@resend.dev>' : 'EdVault AI <noreply@edvault.ai>';
}

async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  if (!key()) {
    console.warn('⚠️  RESEND_API_KEY not set — email skipped');
    return;
  }
  try {
    const res = await axios.post(
      RESEND_URL,
      { from: from(), to, subject, html },
      { headers: { Authorization: `Bearer ${key()}`, 'Content-Type': 'application/json' }, timeout: 10000 }
    );
    console.log(`✅ Email sent to ${to}:`, res.data.id);
  } catch (err: any) {
    console.error('❌ Email send failed:', err?.response?.data || err.message);
    // Don't throw — email is non-critical
  }
}

export async function sendCredentialEmail(to: string, credentialId: string, shareLink: string): Promise<void> {
  await sendEmail(
    to,
    `Your Verified Credential — ${credentialId}`,
    `<!DOCTYPE html>
<html>
<body style="font-family:sans-serif;background:#050505;color:#e2e8f0;padding:40px;margin:0">
  <div style="max-width:560px;margin:0 auto">
    <div style="background:linear-gradient(135deg,#0891b2,#7c3aed);padding:2px;border-radius:16px">
      <div style="background:#0a0a0a;border-radius:14px;padding:40px">
        <h1 style="color:#06b6d4;margin:0 0 4px;font-size:28px">EdVault AI</h1>
        <p style="color:#64748b;margin:0 0 32px;font-size:13px">Blockchain-Verified Academic Credentials</p>
        <h2 style="color:#fff;margin:0 0 12px;font-size:20px">Your credential is ready to share</h2>
        <p style="color:#94a3b8;line-height:1.7;margin:0 0 20px">
          Credential <strong style="color:#06b6d4;font-family:monospace;font-size:14px">${credentialId}</strong> 
          has been issued and anchored on the blockchain.
        </p>
        <div style="background:#ffffff08;border:1px solid #ffffff15;border-radius:12px;padding:20px;margin:0 0 24px">
          <p style="margin:0 0 8px;font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:1px">Verification Link</p>
          <a href="${shareLink}" style="color:#06b6d4;word-break:break-all;font-size:13px;text-decoration:none">${shareLink}</a>
        </div>
        <a href="${shareLink}" 
           style="display:inline-block;background:linear-gradient(135deg,#0891b2,#7c3aed);color:#fff;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:bold;font-size:15px">
          View Credential →
        </a>
        <div style="margin-top:32px;padding-top:24px;border-top:1px solid #ffffff10">
          <p style="color:#334155;font-size:11px;margin:0">
            This credential is cryptographically signed and tamper-proof.<br>
            Powered by EdVault AI · Blockchain-Verified Records
          </p>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`
  );
}

export async function sendVerificationAlert(to: string, credentialId: string, verifierName: string): Promise<void> {
  await sendEmail(
    to,
    `Your credential was verified — ${credentialId}`,
    `<!DOCTYPE html>
<html>
<body style="font-family:sans-serif;background:#050505;color:#e2e8f0;padding:40px;margin:0">
  <div style="max-width:480px;margin:0 auto;background:#0a0a0a;border:1px solid #ffffff10;border-radius:16px;padding:32px">
    <div style="width:48px;height:48px;background:#10b981;border-radius:12px;display:flex;align-items:center;justify-content:center;margin-bottom:20px">
      <span style="color:white;font-size:24px">✓</span>
    </div>
    <h2 style="color:#10b981;margin:0 0 12px">Credential Verified</h2>
    <p style="color:#94a3b8;line-height:1.7;margin:0 0 16px">
      Your credential <strong style="color:#06b6d4;font-family:monospace">${credentialId}</strong> 
      was verified by <strong style="color:#fff">${verifierName}</strong>.
    </p>
    <p style="color:#475569;font-size:12px;margin:0;border-top:1px solid #ffffff10;padding-top:16px">
      Powered by EdVault AI · Blockchain-Verified Records
    </p>
  </div>
</body>
</html>`
  );
}

export async function sendBulkCredentialEmails(
  recipients: Array<{ to: string; credentialId: string; shareLink: string }>
): Promise<{ sent: number; failed: number }> {
  let sent = 0, failed = 0;
  for (const r of recipients) {
    try {
      await sendCredentialEmail(r.to, r.credentialId, r.shareLink);
      sent++;
      await new Promise(res => setTimeout(res, 200)); // Rate limit
    } catch { failed++; }
  }
  return { sent, failed };
}
