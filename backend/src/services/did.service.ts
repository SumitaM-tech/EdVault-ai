import { ethers } from 'ethers';
import { env } from '../config/env.js';

/** did:ethr:<chainId>:<address>  (W3C DID Core / ERC-1056 style, resolved locally). */
export function didFromAddress(address: string, chainId: number = env.CHAIN_ID): string {
  return `did:ethr:${chainId}:${ethers.getAddress(address.toLowerCase())}`;
}

export function parseDid(did: string): { chainId: number; address: string } | null {
  const m = /^did:ethr:(\d+):(0x[0-9a-fA-F]{40})$/.exec(did);
  if (!m) return null;
  try { return { chainId: Number(m[1]), address: ethers.getAddress(m[2].toLowerCase()) }; } catch { return null; }
}

export function buildDidDocument(address: string, chainId: number = env.CHAIN_ID) {
  const did = didFromAddress(address, chainId);
  const addr = ethers.getAddress(address.toLowerCase());
  return {
    '@context': ['https://www.w3.org/ns/did/v1', 'https://w3id.org/security/suites/secp256k1recovery-2020/v2'],
    id: did,
    verificationMethod: [{
      id: `${did}#controller`,
      type: 'EcdsaSecp256k1RecoveryMethod2020',
      controller: did,
      blockchainAccountId: `eip155:${chainId}:${addr}`,
    }],
    authentication: [`${did}#controller`],
    assertionMethod: [`${did}#controller`],
  };
}
