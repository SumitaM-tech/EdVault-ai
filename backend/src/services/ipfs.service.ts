import axios from 'axios';
import FormData from 'form-data';
import { env, sha256Hex, generateMockCid, isMockCid } from '../config/env.js';
import { prisma } from '../lib/prisma.js';

export interface IPFSUploadResponse {
  cid: string;
  hash: string;
  size: number;
  mock: boolean;
}

export type IPFSMode = 'live' | 'mock' | 'disabled';

function httpError(message: string, status: number) {
  return Object.assign(new Error(message), { status });
}

const MIME: Record<string, string> = {
  pdf: 'application/pdf', json: 'application/json', png: 'image/png',
  jpg: 'image/jpeg', jpeg: 'image/jpeg', txt: 'text/plain',
};

/**
 * Single IPFS implementation (Pinata).
 *  - live:     Pinata credentials configured. Failures are surfaced, never faked.
 *  - mock:     no credentials and ALLOW_MOCK_SERVICES=true. CIDs are prefixed `mock-`.
 *  - disabled: no credentials and mocks not allowed. Uploads are rejected.
 */
export class IPFSService {
  get mode(): IPFSMode {
    if (env.PINATA_JWT || (env.PINATA_API_KEY && env.PINATA_SECRET_KEY)) return 'live';
    return env.ALLOW_MOCK_SERVICES ? 'mock' : 'disabled';
  }

  private authHeaders(): Record<string, string> {
    if (env.PINATA_JWT) return { Authorization: `Bearer ${env.PINATA_JWT}` };
    return { pinata_api_key: env.PINATA_API_KEY!, pinata_secret_api_key: env.PINATA_SECRET_KEY! };
  }

  calculateHash(buffer: Buffer) {
    return { sha256: sha256Hex(buffer) };
  }

  async uploadDocument(buffer: Buffer, fileName: string, credentialId?: string): Promise<IPFSUploadResponse> {
    const hash = sha256Hex(buffer);
    const mode = this.mode;
    if (mode === 'disabled') {
      throw httpError('IPFS storage is not configured. Set PINATA_JWT (or PINATA_API_KEY/PINATA_SECRET_KEY) in backend/.env.', 503);
    }
    if (mode === 'mock') {
      return { cid: generateMockCid(hash), hash, size: buffer.length, mock: true };
    }

    let cid: string;
    try {
      const form = new FormData();
      const ext = fileName.split('.').pop()?.toLowerCase() ?? '';
      form.append('file', buffer, { filename: fileName, contentType: MIME[ext] ?? 'application/octet-stream' });
      form.append('pinataMetadata', JSON.stringify({ name: fileName }));
      const res = await axios.post('https://api.pinata.cloud/pinning/pinFileToIPFS', form, {
        headers: { ...form.getHeaders(), ...this.authHeaders() },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        timeout: 30000,
      });
      cid = res.data.IpfsHash;
    } catch (err) {
      const detail = axios.isAxiosError(err) ? (err.response?.data?.error?.details ?? err.message) : (err as Error).message;
      throw httpError(`IPFS upload failed: ${detail}`, 502);
    }

    if (credentialId) {
      await prisma.iPFSDocument.upsert({
        where: { cid },
        update: { credentialId },
        create: { cid, fileName, fileSize: buffer.length, mimeType: MIME[fileName.split('.').pop()?.toLowerCase() ?? ''] ?? 'application/octet-stream', hash, credentialId },
      });
    }
    return { cid, hash, size: buffer.length, mock: false };
  }

  getGatewayUrl(cid: string): string {
    return `${env.IPFS_GATEWAY.replace(/\/?$/, '/')}${cid}`;
  }

  async downloadDocument(cid: string): Promise<Buffer> {
    if (isMockCid(cid)) throw httpError('This credential uses a simulated CID; there is no document to download.', 404);
    try {
      const res = await axios.get(this.getGatewayUrl(cid), { responseType: 'arraybuffer', timeout: 30000 });
      return Buffer.from(res.data);
    } catch (err) {
      throw httpError(`Failed to download document from IPFS: ${(err as Error).message}`, 502);
    }
  }

  async verifyDocumentIntegrity(cid: string, expectedHash: string): Promise<boolean> {
    const doc = await this.downloadDocument(cid);
    return sha256Hex(doc) === expectedHash;
  }
}

export const ipfsService = new IPFSService();
export default IPFSService;
