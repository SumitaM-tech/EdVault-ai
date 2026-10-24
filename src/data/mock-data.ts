import { Credential, FraudInsight, Student, TimelineEvent, VerificationLog } from '../types';

function generateId() {
  return Math.random().toString(36).substring(2, 15);
}

function generateHash() {
  return '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
}

function generateCID() {
  return 'Qm' + Array.from({ length: 44 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
}

const firstNames = ['Alex', 'Jordan', 'Casey', 'Taylor', 'Morgan', 'Riley', 'Quinn', 'Skyler', 'Avery', 'Parker'];
const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];
const degrees = ['B.Sc. Computer Science', 'M.Sc. Data Science', 'B.A. Digital Arts', 'MBA Business Analytics', 'B.Eng. Robotics'];
const institutions = ['EdVault University', 'Global Tech Institute', 'Metropolitan Academy', 'Cyber State College'];

export const students: Student[] = Array.from({ length: 50 }, (_, i) => {
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  const name = `${firstName} ${lastName}`;
  const degree = degrees[Math.floor(Math.random() * degrees.length)];
  const institution = institutions[Math.floor(Math.random() * institutions.length)];
  
  const credentials: Credential[] = Array.from({ length: Math.floor(Math.random() * 3) + 1 }, () => ({
    id: 'CRED-' + generateId().toUpperCase(),
    title: degree,
    institution: institution,
    issuedAt: new Date(2023, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString(),
    status: 'Verified',
    hash: generateHash(),
    cid: generateCID(),
    blockchainTx: generateHash(),
    qrPayload: `edvault://verify/${generateId()}`
  }));

  return {
    id: 'STU-' + generateId().toUpperCase(),
    name,
    role: 'Student',
    institution,
    degree,
    email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.edu`,
    wallet: generateHash().substring(0, 42),
    year: '2024',
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
    credentials
  };
});

export const logs: VerificationLog[] = Array.from({ length: 20 }, () => ({
  id: generateId(),
  requester: ['Google', 'Meta', 'Amazon', 'Microsoft', 'OpenAI'][Math.floor(Math.random() * 5)],
  credentialId: students[Math.floor(Math.random() * students.length)].credentials[0].id,
  outcome: (['Verified', 'Verified', 'Verified', 'Flagged'] as const)[Math.floor(Math.random() * 4)],
  createdAt: new Date(Date.now() - Math.random() * 1000000000).toISOString(),
  method: (['Credential ID', 'QR'] as const)[Math.floor(Math.random() * 2)]
}));

export const fraud = {
  riskScore: 12,
  suspiciousUploads: 4,
  duplicateRecords: 2,
  metadataAlerts: 6,
  trend: [10, 15, 8, 22, 12, 18, 14],
  alerts: Array.from({ length: 10 }, (_, i) => ({
    title: ['Credential Mismatch', 'Unusual IP Access', 'Multiple Hash Variations', 'Expired Signature'][Math.floor(Math.random() * 4)],
    message: `Detected anomaly in block ${12450000 + i * 123}. Verification integrity check failed.`,
    severity: (['high', 'medium', 'low'] as const)[Math.floor(Math.random() * 3)]
  }))
};

export const stats = {
  totalStudents: 50,
  credentialsIssued: 112,
  verificationRequests: 842,
  fraudAlerts: 10
};

export const mainStudent = students[0];

export const timeline: TimelineEvent[] = [
  {
    title: 'Credential Issued',
    description: 'Degree completion verified by Registrar Office.',
    timestamp: '2024-05-15T10:00:00Z',
    tone: 'success'
  },
  {
    title: 'Stored on IPFS',
    description: 'Encrypted document fragment distributed across nodes.',
    timestamp: '2024-05-15T10:05:00Z',
    tone: 'success'
  },
  {
    title: 'Recorded on Blockchain',
    description: 'Hash anchoring confirmed in block #15,420,122.',
    timestamp: '2024-05-15T10:12:00Z',
    tone: 'success'
  },
  {
    title: 'Verified by Recruiter',
    description: 'Verified by Tech Global Talent Acquisition Team.',
    timestamp: '2024-06-01T14:30:00Z',
    tone: 'neutral'
  }
];
