import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { ethers } from 'ethers';
import { env, generateMockTx } from '../config/env.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const ABI = [
  'function issueCredential(tuple(address student, string documentHash, string ipfsCid, address institution, uint256 initialTrustScore) p) returns (uint256)',
  'function revokeCredential(uint256 credentialId, string reason)',
  'function verifyCredential(uint256 credentialId) view returns (bool valid, bool revoked, uint256 trustScore)',
  'function getCredential(uint256 credentialId) view returns (string documentHash, string ipfsCid, address issuer, address student, address institution, uint256 issuedAt, bool revoked, uint256 trustScore, bool isDuplicate)',
  'function recordVerification(uint256 credentialId, bool hashMatched, bool documentMatched)',
  'function getVerificationHistory(uint256 credentialId) view returns (tuple(address verifier, uint256 credentialId, uint256 timestamp, bool hashMatched, bool documentMatched, uint256 trustScore)[])',
  'function getVerificationCount(uint256 credentialId) view returns (uint256)',
  'function registerInstitution(string name, address institutionWallet)',
  'function verifyInstitution(address institutionAddress)',
  'function getInstitution(address addr) view returns (string name, bool verified, bool active, uint256 count)',
  'function credentialCount() view returns (uint256)',
  'event CredentialIssued(uint256 indexed credentialId, address indexed issuer, address indexed student, string documentHash, uint256 trustScore)',
  'event CredentialRevoked(uint256 indexed credentialId, string reason)',
];

/**
 * live        - contract configured and reachable. All calls hit the chain; errors propagate.
 * mock        - nothing configured and ALLOW_MOCK_SERVICES=true. Clearly labelled simulation.
 * unavailable - chain IS configured but unreachable. Calls fail with 503 (no silent fallback).
 * disabled    - nothing configured and mocks not allowed. Calls fail with 503.
 */
export type ChainMode = 'live' | 'mock' | 'unavailable' | 'disabled';

export interface OnChainCredential {
  documentHash: string;
  ipfsCid: string;
  revoked: boolean;
  trustScore: number;
  isDuplicate: boolean;
}

export interface AuditEntry {
  verifier: string;
  timestamp: string;
  hashMatched: boolean;
  documentMatched: boolean;
  trustScore: number;
}

function httpError(message: string, status: number) {
  return Object.assign(new Error(message), { status });
}

/** Stored ids look like `<txprefix>-<n>`; the contract only needs the numeric part. */
export function toNumericId(onChainId: string): bigint {
  const part = onChainId.includes('-') ? onChainId.split('-').pop()! : onChainId;
  if (!/^\d+$/.test(part)) throw httpError(`Invalid on-chain id: ${onChainId}`, 500);
  return BigInt(part);
}

class BlockchainService {
  private provider: ethers.JsonRpcProvider | null = null;
  private wallet: ethers.Wallet | null = null;
  private contract: ethers.Contract | null = null;
  private mode: ChainMode = 'disabled';
  private lastError: string | null = null;
  // Serialises transactions from the single backend wallet so nonces never collide.
  private txQueue: Promise<unknown> = Promise.resolve();

  private enqueue<T>(job: () => Promise<T>): Promise<T> {
    const run = this.txQueue.then(job, job);
    this.txQueue = run.catch(() => undefined);
    return run;
  }

  private configured(): boolean {
    return !!env.DEPLOYER_PRIVATE_KEY && !!(env.CONTRACT_ADDRESS || this.loadDeployedAddress());
  }

  async init(): Promise<ChainMode> {
    if (!this.configured()) {
      this.mode = env.ALLOW_MOCK_SERVICES ? 'mock' : 'disabled';
      console.warn(
        this.mode === 'mock'
          ? '[blockchain] SIMULATED mode: no contract configured. Run scripts\\start-chain.ps1 for a real local chain.'
          : '[blockchain] not configured and ALLOW_MOCK_SERVICES=false: issuing and verifying will fail.'
      );
      return this.mode;
    }
    try {
      this.provider = new ethers.JsonRpcProvider(env.RPC_URL, undefined, { staticNetwork: true, cacheTimeout: -1 });
      await this.provider.getNetwork();
      this.wallet = new ethers.Wallet(env.DEPLOYER_PRIVATE_KEY!, this.provider);
      const address = env.CONTRACT_ADDRESS || this.loadDeployedAddress()!;
      const code = await this.provider.getCode(address);
      if (code === '0x') throw new Error(`no contract deployed at ${address} (did the local chain restart? re-run scripts\\start-chain.ps1)`);
      this.contract = new ethers.Contract(address, ABI, this.wallet);
      await this.ensureIssuerRegistered();
      this.mode = 'live';
      this.lastError = null;
      console.log(`[blockchain] LIVE: contract ${address}`);
    } catch (err) {
      this.mode = 'unavailable';
      this.lastError = (err as Error).message;
      this.contract = null;
      console.error(`[blockchain] configured but unavailable: ${this.lastError}`);
    }
    return this.mode;
  }

  /** Re-tries connecting if the chain was down; throws a 503 if it still is. */
  private async ready(): Promise<void> {
    if (this.mode === 'unavailable') await this.init();
    if (this.mode === 'unavailable') throw httpError(`Blockchain unavailable: ${this.lastError}`, 503);
    if (this.mode === 'disabled') throw httpError('Blockchain is not configured (see backend/.env.example).', 503);
  }

  private async ensureIssuerRegistered() {
    if (!this.contract || !this.wallet) return;
    const addr = this.wallet.address;
    const [, verified, active] = await this.contract.getInstitution(addr);
    if (!active) {
      await (await this.contract.registerInstitution('EdVault University', addr)).wait();
      await (await this.contract.verifyInstitution(addr)).wait();
      console.log('[blockchain] institution registered and verified');
    } else if (!verified) {
      await (await this.contract.verifyInstitution(addr)).wait();
    }
  }

  getMode(): ChainMode { return this.mode; }
  isLive() { return this.mode === 'live'; }
  isAvailable() { return this.mode === 'live'; }
  getStatus() { return { mode: this.mode, error: this.lastError }; }

  private loadDeployedAddress(): string | null {
    const paths = [
      join(__dirname, '../../deployments/localhost.json'),
      join(__dirname, '../../../deployments/localhost.json'),
    ];
    for (const p of paths) {
      if (existsSync(p)) {
        try { return JSON.parse(readFileSync(p, 'utf-8')).CredentialRegistry ?? null; } catch { /* ignore */ }
      }
    }
    return null;
  }

  async issueOnChain(studentWallet: string, documentHash: string, ipfsCid: string) {
    await this.ready();
    if (this.mode === 'mock') {
      return {
        onChainId: `mock-${documentHash.slice(0, 16)}-${Date.now()}`,
        txHash: generateMockTx(),
        blockNumber: 0,
        mock: true,
      };
    }
    const params = { student: studentWallet, documentHash, ipfsCid, institution: this.wallet!.address, initialTrustScore: 750 };
    let receipt;
    try {
      receipt = await this.enqueue(async () => {
        const tx = await this.contract!.issueCredential(params);
        return tx.wait();
      });
    } catch (err) {
      const msg = (err as { reason?: string; shortMessage?: string; message: string });
      const reason = msg.reason ?? msg.shortMessage ?? msg.message;
      if (/Hash already registered/i.test(reason)) throw httpError('This document hash is already anchored on-chain.', 409);
      throw httpError(`Blockchain issuance failed: ${reason}`, 502);
    }
    let chainId = '';
    for (const log of receipt.logs) {
      try {
        const parsed = this.contract!.interface.parseLog(log);
        if (parsed?.name === 'CredentialIssued') { chainId = parsed.args[0].toString(); break; }
      } catch { /* not our event */ }
    }
    if (!chainId) throw httpError('Blockchain issuance failed: CredentialIssued event not found', 502);
    return { onChainId: `${receipt.hash.slice(2, 18)}-${chainId}`, txHash: receipt.hash as string, blockNumber: receipt.blockNumber as number, mock: false };
  }

  async revokeOnChain(onChainId: string, reason = 'Revoked by issuer') {
    await this.ready();
    if (this.mode === 'mock') return { txHash: generateMockTx(), mock: true };
    try {
      const receipt = await this.enqueue(async () => {
        const tx = await this.contract!.revokeCredential(toNumericId(onChainId), reason);
        return tx.wait();
      });
      return { txHash: receipt.hash as string, mock: false };
    } catch (err) {
      throw httpError(`On-chain revocation failed: ${(err as Error).message}`, 502);
    }
  }

  /** Reads the anchored record. Returns null in simulated mode (nothing real to read). */
  async getOnChainCredential(onChainId: string): Promise<OnChainCredential | null> {
    await this.ready();
    if (this.mode === 'mock') return null;
    try {
      const r = await this.contract!.getCredential(toNumericId(onChainId));
      return {
        documentHash: r.documentHash, ipfsCid: r.ipfsCid, revoked: r.revoked,
        trustScore: Number(r.trustScore), isDuplicate: r.isDuplicate,
      };
    } catch (err) {
      throw httpError(`On-chain lookup failed: ${(err as Error).message}`, 502);
    }
  }

  /** Appends to the on-chain audit log. Returns the tx hash, or null in simulated mode. */
  async recordVerification(onChainId: string, hashMatched: boolean, documentMatched: boolean): Promise<string | null> {
    await this.ready();
    if (this.mode === 'mock') return null;
    try {
      const receipt = await this.enqueue(async () => {
        const tx = await this.contract!.recordVerification(toNumericId(onChainId), hashMatched, documentMatched);
        return tx.wait();
      });
      return receipt.hash as string;
    } catch (err) {
      throw httpError(`Audit log write failed: ${(err as Error).message}`, 502);
    }
  }

  async getVerificationHistory(onChainId: string): Promise<AuditEntry[] | null> {
    await this.ready();
    if (this.mode === 'mock') return null;
    try {
      const rows = await this.contract!.getVerificationHistory(toNumericId(onChainId));
      return rows.map((r: any) => ({
        verifier: r.verifier,
        timestamp: new Date(Number(r.timestamp) * 1000).toISOString(),
        hashMatched: r.hashMatched,
        documentMatched: r.documentMatched,
        trustScore: Number(r.trustScore),
      }));
    } catch (err) {
      throw httpError(`On-chain history lookup failed: ${(err as Error).message}`, 502);
    }
  }
}

export const blockchainService = new BlockchainService();
