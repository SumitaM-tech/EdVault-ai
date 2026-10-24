import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { authMiddleware, requireRoles, type AuthRequest } from '../middleware/auth.js';
import { buildDidDocument, didFromAddress, parseDid } from './../services/did.service.js';
import { issuerAddress, checkSignature } from '../services/signature.service.js';

const router = Router();

/** Public: resolve a did:ethr identifier to its DID document. */
router.get('/did/:did', (req, res) => {
  const parsed = parseDid(decodeURIComponent(req.params.did));
  if (!parsed) return res.status(400).json({ error: 'Expected did:ethr:<chainId>:<0x address>' });
  res.json({ didDocument: buildDidDocument(parsed.address, parsed.chainId) });
});

/** Student: my DID and DID document (derived from my wallet). */
router.get('/students/me/did', authMiddleware, requireRoles('STUDENT'), async (req: AuthRequest, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user!.userId }, select: { wallet: true } });
    if (!user?.wallet) return res.status(404).json({ error: 'No wallet linked to this account.' });
    res.json({ did: didFromAddress(user.wallet), didDocument: buildDidDocument(user.wallet) });
  } catch (err) { next(err); }
});

/** Public: the issuer signature of a credential and whether it verifies. */
router.get('/credentials/:id/signature', async (req, res, next) => {
  try {
    const c = await prisma.credential.findUnique({
      where: { id: req.params.id },
      select: { id: true, hash: true, issuerSignature: true, signatureProof: true },
    });
    if (!c) return res.status(404).json({ error: 'Credential not found' });
    const expected = issuerAddress();
    res.json({
      credentialId: c.id,
      signed: !!c.issuerSignature,
      signature: c.issuerSignature,
      signer: c.signatureProof,
      algorithm: 'ECDSA-secp256k1',
      valid: checkSignature(c.id, c.hash, c.issuerSignature, expected),
    });
  } catch (err) { next(err); }
});

export default router;
