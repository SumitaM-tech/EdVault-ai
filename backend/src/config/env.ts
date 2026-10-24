import 'dotenv/config';
import { createHash, randomBytes } from 'crypto';
import { z } from 'zod';

const bool = z
  .enum(['true', 'false', '1', '0'])
  .transform((v) => v === 'true' || v === '1');

const envSchema = z.object({
  PORT:                 z.coerce.number().default(5000),
  NODE_ENV:             z.enum(['development', 'production', 'test']).default('development'),
  CORS_ORIGIN:          z.string().default('http://localhost:5173'),
  FRONTEND_URL:         z.string().default('http://localhost:5173'),
  DATABASE_URL:         z.string().default('postgresql://edvault:edvault@localhost:5432/edvault?schema=public'),
  JWT_SECRET:           z.string().min(16, 'JWT_SECRET must be at least 16 characters'),
  JWT_EXPIRES_IN:       z.string().default('7d'),

  // Blockchain
  RPC_URL:              z.string().default('http://127.0.0.1:8545'),
  CHAIN_ID:             z.coerce.number().default(31337),
  CONTRACT_ADDRESS:     z.string().optional(),
  DEPLOYER_PRIVATE_KEY: z.string().optional(),

  // IPFS (Pinata). Use PINATA_JWT, or the API key + secret pair.
  IPFS_GATEWAY:         z.string().default('https://gateway.pinata.cloud/ipfs/'),
  PINATA_JWT:           z.string().optional(),
  PINATA_API_KEY:       z.string().optional(),
  PINATA_SECRET_KEY:    z.string().optional(),

  // When true, a service with NO credentials configured runs in an explicit,
  // clearly-labelled simulated mode. A configured service that fails never
  // falls back to a simulation; the request fails instead.
  ALLOW_MOCK_SERVICES:  bool.default('true'),

  GROQ_API_KEY:         z.string().optional(),
  RESEND_API_KEY:       z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  const lines = parsed.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`).join('\n');
  throw new Error(
    `Invalid environment configuration:\n${lines}\n` +
      'Run scripts\\setup.ps1 from the project root to create backend\\.env automatically.'
  );
}
export const env = parsed.data;

if (env.NODE_ENV === 'production' && /change-me|secret|password/i.test(env.JWT_SECRET)) {
  throw new Error('JWT_SECRET looks like a placeholder. Set a long random value in production.');
}

/** SHA-256 (hex) of raw bytes or a string. */
export function sha256Hex(data: Buffer | string): string {
  return createHash('sha256').update(data).digest('hex');
}
/** Kept for backwards compatibility with older callers. */
export function generateDocumentHash(payload: string): string {
  return sha256Hex(payload);
}
/** Placeholder CID for simulated IPFS mode. The prefix makes it obviously not a real CID. */
export function generateMockCid(hash: string): string {
  return `mock-${hash.slice(0, 46)}`;
}
export function isMockCid(cid: string): boolean {
  return cid.startsWith('mock-');
}
export function generateCredentialId(): string {
  return `CRED-${randomBytes(6).toString('hex').toUpperCase()}`;
}
/** QR codes encode a real, scannable https/http URL to the public verification page. */
export function generateQrPayload(credentialId: string): string {
  return `${env.FRONTEND_URL.replace(/\/$/, '')}/verify/${credentialId}`;
}
export function generateMockTx(): string {
  return `0xmock${randomBytes(29).toString('hex')}`;
}
export function generateTemporaryPassword(): string {
  return randomBytes(9).toString('base64url');
}
