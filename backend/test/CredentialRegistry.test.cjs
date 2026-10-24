const assert = require('node:assert/strict');
const hre = require('hardhat');

const HASH_A = 'a'.repeat(64);
const HASH_B = 'b'.repeat(64);
const CID = 'bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi';

async function expectRevert(promise, fragment) {
  try {
    await promise;
  } catch (err) {
    const msg = String(err.shortMessage || err.message || err);
    assert.ok(msg.includes(fragment), `expected revert containing "${fragment}", got: ${msg}`);
    return;
  }
  assert.fail(`expected revert containing "${fragment}" but call succeeded`);
}

describe('CredentialRegistry', function () {
  let registry, owner, issuer, student, stranger;

  const params = (hash = HASH_A, institution = null) => ({
    student: student.address,
    documentHash: hash,
    ipfsCid: CID,
    institution: institution ?? owner.address,
    initialTrustScore: 750,
  });

  beforeEach(async function () {
    [owner, issuer, student, stranger] = await hre.ethers.getSigners();
    const Factory = await hre.ethers.getContractFactory('CredentialRegistry');
    registry = await Factory.deploy();
    await registry.waitForDeployment();
    // the owner doubles as the backend issuer wallet, as in production
    await (await registry.registerInstitution('EdVault University', owner.address)).wait();
    await (await registry.verifyInstitution(owner.address)).wait();
  });

  it('issues a credential and anchors the hash and CID on-chain', async function () {
    await (await registry.issueCredential(params())).wait();
    assert.equal(await registry.credentialCount(), 1n);
    const c = await registry.getCredential(1);
    assert.equal(c.documentHash, HASH_A);
    assert.equal(c.ipfsCid, CID);
    assert.equal(c.student, student.address);
    assert.equal(c.revoked, false);
    assert.equal(c.trustScore, 750n);
    assert.equal(await registry.hashToId(HASH_A), 1n);
  });

  it('rejects a duplicate document hash', async function () {
    await (await registry.issueCredential(params())).wait();
    await expectRevert(registry.issueCredential(params()), 'Hash already registered');
  });

  it('rejects malformed hashes and mismatched institutions', async function () {
    await expectRevert(registry.issueCredential(params('abc')), 'Hash must be 64 hex chars');
    await expectRevert(registry.issueCredential(params(HASH_B, issuer.address)), 'Institution must be the issuer');
  });

  it('only a verified issuer can issue', async function () {
    await assert.rejects(registry.connect(stranger).issueCredential(params(HASH_B, stranger.address)));
    assert.equal(await registry.credentialCount(), 0n);
  });

  it('only the owner can register or verify institutions', async function () {
    await expectRevert(registry.connect(stranger).registerInstitution('Evil U', stranger.address), 'Not authorized');
    await expectRevert(registry.connect(stranger).verifyInstitution(owner.address), 'Not authorized');
  });

  it('revokes a credential and zeroes its trust score', async function () {
    await (await registry.issueCredential(params())).wait();
    await (await registry.revokeCredential(1, 'fraud')).wait();
    const [valid, revoked, score] = await registry.verifyCredential(1);
    assert.equal(valid, true);
    assert.equal(revoked, true);
    assert.equal(score, 0n);
    await expectRevert(registry.revokeCredential(1, 'again'), 'Already revoked');
  });

  it('only the owner can revoke', async function () {
    await (await registry.issueCredential(params())).wait();
    await expectRevert(registry.connect(stranger).revokeCredential(1, 'nope'), 'Not authorized');
  });

  it('rejects an invalid credential id', async function () {
    await expectRevert(registry.verifyCredential(99), 'Invalid credential ID');
  });

  describe('verification audit log', function () {
    beforeEach(async function () {
      await (await registry.issueCredential(params())).wait();
    });

    it('records a matching verification and raises the trust score', async function () {
      await (await registry.recordVerification(1, true, true)).wait();
      const history = await registry.getVerificationHistory(1);
      assert.equal(history.length, 1);
      assert.equal(history[0].verifier, owner.address);
      assert.equal(history[0].hashMatched, true);
      assert.equal(history[0].documentMatched, true);
      assert.equal(history[0].trustScore, 800n);
      assert.equal(await registry.getVerificationCount(1), 1n);
    });

    it('caps the trust score at 1000', async function () {
      for (let i = 0; i < 8; i++) await (await registry.recordVerification(1, true, true)).wait();
      const [, , score] = await registry.verifyCredential(1);
      assert.equal(score, 1000n);
    });

    it('lowers the trust score on a mismatch and emits a fraud alert', async function () {
      await expect_event(registry.recordVerification(1, true, false), registry, 'FraudAlertTriggered');
      const [, , score] = await registry.verifyCredential(1);
      assert.equal(score, 650n);
    });

    it('does not underflow when the trust score is below the penalty', async function () {
      // 750 -> 650 -> 550 -> ... -> 0 : every step must succeed, never revert
      for (let i = 0; i < 9; i++) await (await registry.recordVerification(1, false, false)).wait();
      const [, , score] = await registry.verifyCredential(1);
      assert.equal(score, 0n);
    });

    it('markAsDuplicate does not underflow on a low trust score', async function () {
      await (await registry.issueCredential({ ...params(HASH_B), initialTrustScore: 100 })).wait();
      await (await registry.markAsDuplicate(1, 2)).wait();
      const c2 = await registry.getCredential(2);
      assert.equal(c2.trustScore, 0n);
      assert.equal(c2.isDuplicate, true);
    });

    it('rejects verification records from anyone but the owner', async function () {
      await expectRevert(registry.connect(stranger).recordVerification(1, true, true), 'Not authorized');
      assert.equal(await registry.getVerificationCount(1), 0n);
    });

    it('cannot record a verification for a revoked credential', async function () {
      await (await registry.revokeCredential(1, 'fraud')).wait();
      await expectRevert(registry.recordVerification(1, true, true), 'Credential revoked');
    });
  });
});

async function expect_event(txPromise, contract, eventName) {
  const tx = await txPromise;
  const receipt = await tx.wait();
  const found = receipt.logs.some((l) => {
    try { return contract.interface.parseLog(l)?.name === eventName; } catch { return false; }
  });
  assert.ok(found, `expected event ${eventName}`);
}
