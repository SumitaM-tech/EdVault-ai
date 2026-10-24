// Re-export real API — mock layer removed for MVP
export {
  login,
  fetchDashboardSummary,
  fetchStudentProfile,
  fetchCredentials,
  fetchVerificationResult,
  fetchFraudInsights,
  fetchCredentialDetails,
  issueCredential,
  revokeCredential,
  fetchLedgerCredentials,
  setToken,
  clearToken,
  getStoredUser,
} from '@/lib/api';
