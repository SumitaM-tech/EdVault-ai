export type Role = 'Student' | 'Faculty' | 'Admin' | 'Recruiter';

export type CredentialStatus = 'Verified' | 'Pending' | 'Revoked';

export type VerificationStatus = 'Verified' | 'Pending' | 'Flagged';

export interface Credential {
  id: string;
  title: string;
  institution: string;
  issuedAt: string;
  status: CredentialStatus;
  hash: string;
  cid: string;
  blockchainTx: string;
  qrPayload: string;
}

export interface Student {
  id: string;
  name: string;
  role: Role;
  institution: string;
  degree: string;
  email: string;
  wallet: string;
  year: string;
  avatar: string;
  credentials: Credential[];
}

export interface VerificationLog {
  id: string;
  requester: string;
  credentialId: string;
  outcome: VerificationStatus;
  createdAt: string;
  method: 'Credential ID' | 'QR';
}

export interface FraudInsight {
  label: string;
  value: number;
  details: string;
}

export interface TimelineEvent {
  title: string;
  description: string;
  timestamp: string;
  tone: 'success' | 'warning' | 'neutral';
}
