import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

const fetchVerificationResult = vi.fn();
vi.mock('@/lib/api', async () => {
  const actual = await vi.importActual<typeof import('@/lib/api')>('@/lib/api');
  return { ...actual, fetchVerificationResult: (...a: unknown[]) => fetchVerificationResult(...a), searchStudents: vi.fn().mockResolvedValue([]) };
});
vi.mock('@/components/common/toast', () => ({ useToast: () => ({ notify: vi.fn() }) }));

import { RecruiterVerificationPage } from './recruiter-verification-page';

const credential = {
  id: 'CRED-1', title: 'B.Sc. CS', institution: 'EdVault University', issuedAt: '2024-05-15T00:00:00.000Z',
  status: 'Verified', hash: 'a'.repeat(64), cid: 'bafy', blockchainTx: '0x' + 'b'.repeat(64), qrPayload: 'http://x/verify/CRED-1',
};
const student = { id: 's1', name: 'Aarav Mehta', role: 'Student', institution: 'EdVault University', degree: 'B.Sc. CS', email: '', wallet: '', year: '2024', avatar: '', credentials: [credential] };

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/verify" element={<RecruiterVerificationPage />} />
        <Route path="/verify/:id" element={<RecruiterVerificationPage />} />
      </Routes>
    </MemoryRouter>
  );

beforeEach(() => fetchVerificationResult.mockReset());

describe('RecruiterVerificationPage', () => {
  it('verifies automatically when opened from a scanned QR link', async () => {
    fetchVerificationResult.mockResolvedValue({
      verified: true, student, credential, blockchainTx: credential.blockchainTx, status: 'Verified',
      checks: { anchor: 'live', hashMatched: true, documentChecked: false, documentMatched: true, revoked: false, auditLogged: true, auditTx: '0x1', trustScore: 800 },
    });
    renderAt('/verify/CRED-1');
    expect(await screen.findByText(/VERIFIED/)).toBeInTheDocument();
    expect(fetchVerificationResult).toHaveBeenCalledWith({ credentialId: 'CRED-1' }, undefined);
    expect(screen.getByText(/On-chain hash match/)).toBeInTheDocument();
    expect(screen.getByText(/Audit entry written on-chain/)).toBeInTheDocument();
    expect(screen.queryByText(/Zero-Knowledge/i)).not.toBeInTheDocument();
  });

  it('labels a simulated anchor instead of implying a live chain', async () => {
    fetchVerificationResult.mockResolvedValue({
      verified: true, student, credential, blockchainTx: credential.blockchainTx, status: 'Verified',
      checks: { anchor: 'simulated', hashMatched: true, documentChecked: false, documentMatched: true, revoked: false, auditLogged: false, auditTx: null, trustScore: null },
    });
    renderAt('/verify/CRED-1');
    expect(await screen.findByText('Simulated anchor')).toBeInTheDocument();
  });

  it('explains why a failed check failed (document mismatch)', async () => {
    fetchVerificationResult.mockResolvedValue({
      verified: false, student, credential, blockchainTx: '', status: 'Flagged',
      checks: { anchor: 'live', hashMatched: true, documentChecked: true, documentMatched: false, revoked: false, auditLogged: true, auditTx: '0x1', trustScore: 700 },
    });
    renderAt('/verify/CRED-1');
    expect(await screen.findByText('Verification failed')).toBeInTheDocument();
    expect(screen.getByText(/does not match the issued document/)).toBeInTheDocument();
  });

  it('shows "Not found" for an unknown id', async () => {
    fetchVerificationResult.mockResolvedValue({ verified: false, student: null, credential: null, blockchainTx: '', status: 'Flagged', checks: null });
    renderAt('/verify/CRED-NOPE');
    expect(await screen.findByText('Not Found')).toBeInTheDocument();
  });

  it('the manual form accepts a pasted verification URL', async () => {
    fetchVerificationResult.mockResolvedValue({ verified: false, student: null, credential: null, blockchainTx: '', status: 'Flagged', checks: null });
    renderAt('/verify');
    await userEvent.type(screen.getByPlaceholderText(/Enter Credential ID/), 'http://localhost:5173/verify/CRED-77');
    await userEvent.click(screen.getByRole('button', { name: /Verify Now/ }));
    await waitFor(() => expect(fetchVerificationResult).toHaveBeenCalledWith({ credentialId: 'CRED-77' }, undefined));
  });
});
