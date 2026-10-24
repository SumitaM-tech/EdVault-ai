import { ethers } from 'ethers';
import { env } from '../config/env.js';

/**
 * Issuer digital signature (ECDSA / secp256k1, the same curve Ethereum uses).
 * The issuer signs "edvault:<credentialId>:<sha256>"; anyone can recover the signer
 * address from the signature and compare it with the issuer wallet.
 */
export function signingMessage(credentialId: string, hash: string): string {
  return `edvault:${credentialId}:${hash}`;
}

export function issuerAddress(): string | null {
  return env.DEPLOYER_PRIVATE_KEY ? new ethers.Wallet(env.DEPLOYER_PRIVATE_KEY).address : null;
}

export async function signCredential(credentialId: string, hash: string) {
  if (!env.DEPLOYER_PRIVATE_KEY) return null;
  const wallet = new ethers.Wallet(env.DEPLOYER_PRIVATE_KEY);
  const signature = await wallet.signMessage(signingMessage(credentialId, hash));
  return { signature, signer: wallet.address, algorithm: 'ECDSA-secp256k1' as const };
}

export function recoverSigner(credentialId: string, hash: string, signature: string): string | null {
  try {
    return ethers.verifyMessage(signingMessage(credentialId, hash), signature);
  } catch {
    return null;
  }
}

/** true = valid, false = invalid/forged, null = credential was issued without a signature. */
export function checkSignature(
  credentialId: string, hash: string, signature?: string | null, expectedSigner?: string | null,
): boolean | null {
  if (!signature) return null;
  const signer = recoverSigner(credentialId, hash, signature);
  if (!signer) return false;
  return expectedSigner ? signer.toLowerCase() === expectedSigner.toLowerCase() : true;
}
