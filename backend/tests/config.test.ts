import { describe, it, expect, vi, beforeEach } from 'vitest';

beforeEach(() => vi.resetModules());

describe('QR payload', () => {
  it('is a real, scannable http(s) URL to the public verification page', async () => {
    const { generateQrPayload } = await import('../src/config/env.js');
    const url = generateQrPayload('CRED-ABC');
    expect(url).toBe('http://localhost:5173/verify/CRED-ABC');
    expect(() => new URL(url)).not.toThrow();
    expect(url.startsWith('edvault://')).toBe(false);
  });
});

describe('simulation labelling', () => {
  it('mock CIDs are visibly not real CIDs', async () => {
    const { generateMockCid, isMockCid } = await import('../src/config/env.js');
    const cid = generateMockCid('a'.repeat(64));
    expect(isMockCid(cid)).toBe(true);
    expect(cid.startsWith('bafy')).toBe(false);
  });

  it('IPFS runs in explicit mock mode with no credentials and mocks allowed', async () => {
    const { ipfsService } = await import('../src/services/ipfs.service.js');
    expect(ipfsService.mode).toBe('mock');
    const r = await ipfsService.uploadDocument(Buffer.from('x'), 'x.json');
    expect(r.mock).toBe(true);
  });

  it('IPFS refuses to fake an upload when mocks are disallowed', async () => {
    vi.stubEnv('ALLOW_MOCK_SERVICES', 'false');
    const { ipfsService } = await import('../src/services/ipfs.service.js');
    expect(ipfsService.mode).toBe('disabled');
    await expect(ipfsService.uploadDocument(Buffer.from('x'), 'x.json')).rejects.toMatchObject({ status: 503 });
    vi.unstubAllEnvs();
  });

  it('blockchain refuses to fake an issuance when mocks are disallowed', async () => {
    vi.stubEnv('ALLOW_MOCK_SERVICES', 'false');
    const { blockchainService } = await import('../src/services/blockchain.service.js');
    await blockchainService.init();
    await expect(blockchainService.issueOnChain('0x1', 'a'.repeat(64), 'cid')).rejects.toMatchObject({ status: 503 });
    vi.unstubAllEnvs();
  });

  it('blockchain reports mock mode explicitly when nothing is configured', async () => {
    const { blockchainService } = await import('../src/services/blockchain.service.js');
    await blockchainService.init();
    expect(blockchainService.getMode()).toBe('mock');
    const r = await blockchainService.issueOnChain('0x1', 'a'.repeat(64), 'cid');
    expect(r.mock).toBe(true);
    expect(r.txHash.startsWith('0xmock')).toBe(true);
  });

  it('parses compound on-chain ids and rejects garbage', async () => {
    const { toNumericId } = await import('../src/services/blockchain.service.js');
    expect(toNumericId('abcdef-12')).toBe(12n);
    expect(toNumericId('7')).toBe(7n);
    expect(() => toNumericId('mock-xyz-abc')).toThrow();
  });
});

describe('environment validation', () => {
  it('rejects a short JWT secret with a helpful message', async () => {
    vi.stubEnv('JWT_SECRET', 'short');
    await expect(import('../src/config/env.js')).rejects.toThrow(/JWT_SECRET/);
    vi.unstubAllEnvs();
  });
});
