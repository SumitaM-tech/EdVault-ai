# Changes in this version

| # | Problem | Fix |
|---|---------|-----|
| 1 | QR code was a fake pattern; payload was `edvault://…` | Real QR via `qrcode.react` encoding `http://<frontend>/verify/<id>`; new `/verify/:id` route verifies on open. Decode-tested. |
| 2 | Audit log: hard-coded `true,true`, errors swallowed, UI read Postgres, ABI missing history | Real hash/document comparisons are recorded; `getVerificationHistory` in ABI; `GET /credentials/:id/audit-log` reads the chain; audit failures are reported (`auditLogged:false`), not hidden. |
| 3 | Contract: unguarded `recordVerification`; `_max(x-100,0)` underflow reverts | `recordVerification` is `onlyOwner` and records the on-chain post-update score; saturating `_sub`; `issueCredential` requires a 64-char hash and `institution == msg.sender`. 15 Hardhat tests. |
| 4 | Anchored hash was of metadata JSON, not the PDF | The exact bytes pinned to IPFS (the PDF, else the metadata JSON) are the bytes hashed and anchored; verifiers can upload a PDF to compare. |
| 5 | Silent mock fallbacks; two IPFS implementations | One `IPFSService`. Explicit `live`/`mock`/`disabled` modes (`/health`, `0xmock…` / `mock-…` markers, UI labels). Configured-but-failing services return 502/503. Revoke is chain-first. Chain writes are serialised (nonce fix). |
| 6 | No tests; CI only built | 15 contract + 41 backend + 10 frontend tests; CI runs all of them. |
| 7 | `student123` default password; open routes | Random one-time password shown once to the issuer; `/credentials`, `/credentials/:id`, `/students/search`, `/ai/chat`, `/documents/:cid` require auth with role scoping; public verify is rate-limited and returns no email/wallet. |

Also fixed so the project actually builds and runs:
* 18 backend and several frontend TypeScript errors; `dist/index.js` path; `.env` was loaded after config validation (crash on start); port mismatch (3000 vs 5000).
* Prisma migration covered 4 of 15 tables: replaced with a baseline generated from the schema and validated on PostgreSQL 16.
* Seed script crashed on a relation field and used a wrong on-chain id; now idempotent.
* Wallet sign-in: server-issued one-time challenges, expiring JWT, no auto-created users.
* Removed Linux/Podman files (Makefile, Containerfiles); added Windows PowerShell scripts.
