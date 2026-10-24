# EdVault AI: Blockchain Credential Verification

Full-stack platform for issuing, verifying and revoking academic credentials.
A credential's document is pinned to **IPFS**, its **SHA-256 hash and CID are anchored on-chain** (Solidity / Hardhat),
and every verification is written to an **on-chain audit log**. Four roles: Student, Faculty, Admin, Recruiter.

**Stack:** React 18 + TypeScript + Vite + Tailwind · Node.js + Express 5 · PostgreSQL + Prisma · Solidity 0.8.24 + Hardhat + ethers v6 · Pinata (IPFS)

## How it works

| Step | What happens |
|------|--------------|
| Issue | Staff upload a PDF (or, without one, the credential metadata JSON is used). The **exact bytes** are hashed (SHA-256), pinned to IPFS, and `hash + CID` is anchored by `CredentialRegistry.issueCredential`. The same document cannot be issued twice (rejected in the DB and by the contract). |
| QR code | Each credential gets a standards-compliant QR code encoding `http://<frontend>/verify/<id>`. Scanning it opens the public verification page, which verifies immediately. |
| Verify | The backend reads the anchored record from the chain and **compares**: DB hash vs on-chain hash, and (optionally) the SHA-256 of a PDF the verifier uploads vs the anchored hash. Revocation is read from the chain. |
| Audit log | Each verification of a non-revoked credential appends `{verifier, timestamp, hashMatched, documentMatched, trustScore}` to the contract (`getVerificationHistory`). Staff can read it at `GET /credentials/:id/audit-log`. |
| Revoke | Revoked on-chain first. If the chain call fails, the database is **not** changed. |

### Live vs simulated services
`GET http://localhost:5000/health` reports the mode of each backing service.

* **Blockchain:** `live` when `scripts\start-chain.ps1` has deployed the contract. With nothing configured and `ALLOW_MOCK_SERVICES=true` it runs `mock` (tx hashes start with `0xmock`; the UI says "simulated"). If a chain **is** configured but unreachable, requests fail with **503**; there is never a silent fallback.
* **IPFS:** `live` when `PINATA_JWT` (or `PINATA_API_KEY` + `PINATA_SECRET_KEY`) is set; otherwise `mock` (CIDs start with `mock-`). Failed uploads return **502**.
* Set `ALLOW_MOCK_SERVICES=false` to make unconfigured services reject requests instead.

## Windows setup (about 10 minutes)

**Prerequisites**
1. [Node.js 20 LTS](https://nodejs.org) (18 or 22 also work)
2. [PostgreSQL 14+ for Windows](https://www.postgresql.org/download/windows/) (remember the `postgres` password you choose)
3. Open **PowerShell** in the project folder.

**One-time setup**
```powershell
powershell -ExecutionPolicy Bypass -File scripts\create-db.ps1   # creates role + database "edvault"
powershell -ExecutionPolicy Bypass -File scripts\setup.ps1       # .env, npm install, prisma, migrations, demo data
```

**Run everything** (local chain + contract, API, web app in separate windows)
```powershell
powershell -ExecutionPolicy Bypass -File scripts\dev.ps1
```
Open **http://localhost:5173**. Use `-NoChain` to run with the simulated blockchain instead.

**Demo accounts** (password `password123`): `admin@edvault.edu`, `faculty@edvault.edu`, `student@edvault.edu`, `recruiter@edvault.edu`.
The seeded sample credential is `CRED-DEMO0001`. It is a demo record that is *not* anchored on the local chain, so it verifies as "simulated anchor". Credentials you issue are anchored for real.

When an admin issues a credential for a new student, a **random one-time password** is shown once on the issue screen (there is no default password).

### Optional integrations (`backend\.env`)
`PINATA_JWT` (real IPFS pinning), `GROQ_API_KEY` (AI fraud analysis / chat), `RESEND_API_KEY` (email alerts).

## Tests
```powershell
powershell -ExecutionPolicy Bypass -File scripts\test.ps1
```
Runs: Hardhat contract tests (15) · backend tests (90+: auth/role enforcement, hashing, verification logic, no-silent-fallback behaviour) · backend type-check · frontend tests (10: real QR, scan-to-verify page) · frontend type-check + production build.
CI (`.github\workflows\ci.yml`) runs the same on GitHub Actions.

## Access control (four roles)
| Capability | Admin | Faculty | Recruiter | Student |
|---|:-:|:-:|:-:|:-:|
| Verify a credential (public page / QR) | yes | yes | yes | yes |
| Issue credentials, OCR, send email, dashboard | yes | yes | no | no |
| Revoke a credential | any | only ones they issued | no | no |
| Search students | yes | yes | yes | no |
| Access log, fraud insights, compliance report, AI Sentinel | yes | no | no | no |
| Manage users and roles (Users & Roles tab) | yes | no | no | no |
| Own passport, share links, AI summary, own DID | no | no | no | yes |

Enforced server-side in `backend\src\config\permissions.ts` + `requireRoles(...)`, and mirrored in the UI. `backend\tests\rbac.test.ts` checks every role against every protected route.

## API summary
| Route | Access |
|-------|--------|
| `POST /auth/login` | public (rate-limited) |
| `GET/POST /verify/:id` (POST accepts an optional PDF `file`) | public (rate-limited), returns no email/wallet |
| `GET /credentials`, `GET /credentials/:id` | signed in; students see only their own, recruiters cannot list |
| `GET /credentials/:id/signature` | public: issuer ECDSA signature and whether it verifies |
| `GET /did/:did` | public: resolves `did:ethr:<chainId>:<address>` to a DID document |
| `GET /students/me/did` | Student |
| `GET /students/search` | Admin, Faculty, Recruiter |
| `POST /credentials`, `POST /credentials/:id/revoke` | Admin, Faculty (Faculty revoke: own credentials only) |
| `GET /credentials/:id/audit-log`, `/dashboard/summary` | Admin, Faculty |
| `/access-log`, `/fraud/insights`, `/ai/compliance-report` | Admin |
| `GET/POST /admin/users`, `PATCH /admin/users/:id/role` | Admin |
| `POST /ai/chat`, `GET /ai/summary` | signed in |

## Real blockchain on Sepolia (optional, recommended for a resume)
1. Create a **throwaway** MetaMask wallet, get free Sepolia test ETH from a faucet, and get a Sepolia RPC URL (Infura / Alchemy).
2. In `backend\.env` set `SEPOLIA_RPC_URL=...` and `DEPLOYER_PRIVATE_KEY=0x...` (your throwaway key, not the Hardhat one).
3. Run `powershell -ExecutionPolicy Bypass -File scripts\deploy-sepolia.ps1`, then restart the backend. `GET /health` should say `live`, and every credential's transaction hash is viewable on sepolia.etherscan.io.

## Digital signatures and DIDs
Each credential is signed at issue time with the issuer key (ECDSA secp256k1) over `edvault:<id>:<sha256>`. Verification recovers the signer and compares it with the issuer address, so a tampered record is flagged. Students get a `did:ethr` identifier derived from their wallet. In production (`NODE_ENV=production`) a credential with only a *simulated* anchor is never reported as verified.

## Project layout
```
backend/contracts/CredentialRegistry.sol   smart contract
backend/test/                              Hardhat contract tests
backend/tests/                             backend tests (Vitest, no DB needed)
backend/src/services/                      blockchain, ipfs, credential, auth, ai, email
backend/prisma/                            schema, baseline migration, seed
src/                                       React app (pages, components, lib/api.ts)
scripts/                                   Windows PowerShell scripts
```

## Troubleshooting
* **"running scripts is disabled"**: always launch scripts with `powershell -ExecutionPolicy Bypass -File ...` as shown.
* **`Invalid environment configuration`**: run `scripts\setup.ps1` (creates `backend\.env`).
* **Cannot reach PostgreSQL**: check the service is running and `DATABASE_URL` in `backend\.env`; run `scripts\create-db.ps1`.
* **"no contract deployed at ..." / 503 Blockchain unavailable**: the local chain was restarted (it forgets everything). Run `scripts\start-chain.ps1`, then restart the API window.
* **Port already in use** (5000, 5173 or 8545): close the old window, or `Get-NetTCPConnection -LocalPort 5000 | Select OwningProcess`.
* **Hardhat prints "Node.js version not supported"**: use Node 20 LTS.

## Notes
* The old experimental `enhanced.routes.ts` module (unmounted, with an insecure encryption design) was removed; DID and signatures are now implemented in `signature.service.ts`, `did.service.ts` and `identity.routes.ts`.
* Student wallets are derived addresses, not self-custodied keys; connecting a real wallet (MetaMask) is not implemented.
* The local Hardhat key in `.env.example` is publicly known. Use it only for the local chain.
