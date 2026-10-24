import { describe, it, expect } from 'vitest';
import { ethers } from 'ethers';

process.env.DEPLOYER_PRIVATE_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
const { signCredential, checkSignature, issuerAddress } = await import('../src/services/signature.service.js');

describe('issuer signature', () => {
  const hash = 'a'.repeat(64);
  it('signs and verifies against the issuer address', async () => {
    const sig = await signCredential('CRED-1', hash);
    expect(sig!.signer).toBe(issuerAddress());
    expect(checkSignature('CRED-1', hash, sig!.signature, issuerAddress())).toBe(true);
  });
  it('fails when the hash or id is tampered with', async () => {
    const sig = await signCredential('CRED-1', hash);
    expect(checkSignature('CRED-1', 'b'.repeat(64), sig!.signature, issuerAddress())).toBe(false);
    expect(checkSignature('CRED-2', hash, sig!.signature, issuerAddress())).toBe(false);
  });
  it('fails when signed by a different key', async () => {
    const forged = await ethers.Wallet.createRandom().signMessage(`edvault:CRED-1:${hash}`);
    expect(checkSignature('CRED-1', hash, forged, issuerAddress())).toBe(false);
  });
  it('returns null for unsigned credentials', () => {
    expect(checkSignature('CRED-1', hash, null, issuerAddress())).toBeNull();
  });
});
