# Solace 30-Day Execution & Progress Plan 📋

> **One-Liner**: Solace is an AI-powered smart contract security auditing and bug detection platform for Stellar & Soroban.  
> **Target Scope**: 30-Day Stellar Community Fund (SCF) Instaward ($3,000 in XLM).  
> **Current Status**: **MVP Completed** (Entering Week 1 of 30-Day Milestone Plan).

---

## 📊 High-Level Roadmap & Milestones

| Milestone | Focus Area | Status | Target Date |
| :--- | :--- | :---: | :--- |
| **Phase 0** | **Core Architecture & MVP Setup** | ✅ Completed | Day 0 |
| **Week 1** | **Mainnet Deployment Scripts & Prompt Hardening** | 🟡 In Progress | Days 1 – 7 |
| **Week 2** | **Automated GitHub Action CI/CD Bot** | ⚪ Planned | Days 8 – 14 |
| **Week 3** | **Live Monitor & Pilot Developer Onboarding** | ⚪ Planned | Days 15 – 21 |
| **Week 4** | **Mainnet Launch, SDK Release & Demo Video** | ⚪ Planned | Days 22 – 30 |

---

## 🏁 Phase 0: Baseline Architecture (Completed)

All foundational layers have been designed, built, and verified:

- [x] **Smart Contract ([`contract/`](contract/src/lib.rs))**:
  - Implemented in Rust with `soroban-sdk = "28.0.0"`.
  - Core data structure `AuditReport` (`contract_hash`, `risk_score`, `is_secure`, `audit_type`, `auditor`).
  - Implements persistent storage for contract state rent longevity.
  - Implemented `record_audit` with `auditor.require_auth()` authorization check.
  - Implemented `get_audit` for on-chain query by contract hash.
  - Successfully compiled & optimized for `wasm32v1-none` via `stellar contract build` (1,950 bytes).
- [x] **AI Audit Backend ([`server/`](server/src/index.js))**:
  - Express.js API on port `5000` with endpoints `GET /api/health` and `POST /api/audit`.
  - Integrated official `@google/genai` SDK with adaptive multi-model fallback across Gemini Flash models.
  - Supports both **PRE_DEPLOYMENT** and **POST_DEPLOYMENT** audit operational modes.
  - Generates ready-to-execute `stellar contract invoke` payloads.
  - Command-line audit runner ([`runAudit.js`](server/src/scripts/runAudit.js)).
- [x] **Frontend Web Studio ([`client/`](client/app/page.tsx))**:
  - Next.js 14 App Router with **100% TypeScript** (`.tsx` and `.ts`).
  - Tailwind CSS custom token design system with accent variable `var(--e-global-color-accent)` set to `#C80552`.
  - Freighter wallet integration via `@stellar/freighter-api` ([`solaceService.ts`](client/utils/solaceService.ts)).
  - Interactive multi-page routing:
    - **Audit Studio** (`/`): Code input, sample loader, real-time vulnerability badges, wallet connection, and on-chain anchor trigger.
    - **Verified Reports** (`/reports`): On-chain report search and provenance explorer.
    - **Live Monitor** (`/monitor`): Real-time contract telemetry, storage TTL tracking, and security invariants.

---

## 🗓️ 30-Day Milestone Execution Checklist

### 🟡 Week 1: Mainnet Readiness & Gemini AI Prompt Hardening (Days 1–7)

- [ ] **Mainnet Scripting & Network Configuration**:
  - [ ] Create automated deployment scripts for Stellar Mainnet & Testnet (`scripts/deploy.sh` and `scripts/deploy.ps1`).
  - [ ] Implement automatic WASM optimization (`stellar contract optimize`) step in pipeline.
  - [ ] Configure keypair and network passphrase management for mainnet auditors.
- [ ] **Gemini AI Rule Engine Refinement**:
  - [ ] Add specific prompt rules for Soroban instance storage vs. persistent storage rent exhaustion.
  - [ ] Add checks for `env.storage().instance().extend_ttl()` and persistent TTL renewal.
  - [ ] Add strict detection for `auth_context`, custom authorization tree validation, and reentrancy through cross-contract calls.
  - [ ] Expand JSON output schema to return code line numbers for detected vulnerabilities.
- [ ] **Contract Unit & Integration Tests**:
  - [ ] Write Soroban test cases using `soroban-sdk::testutils` in `contract/src/test.rs`.
  - [ ] Test authorization failures and duplicate audit prevention.

---

### ⚪ Week 2: Automated GitHub Action Bot (CI/CD) (Days 8–14)

- [ ] **GitHub Action Core Engine**:
  - [ ] Create `.github/actions/solace-audit/action.yml` for automated CI/CD checks.
  - [ ] Build a lightweight runner script that parses git diffs for `.rs` files.
  - [ ] Send contract diffs to Solace API for automated PR analysis.
- [ ] **Pull Request Comment Bot**:
  - [ ] Format audit summary into a clean markdown comment posted directly to the pull request.
  - [ ] Highlight detected vulnerabilities with severity tags (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`).
  - [ ] Provide configurable blocking rule: fail CI build if `riskScore > 60` or if any `CRITICAL` vulnerability is detected.
- [ ] **Marketplace Packaging**:
  - [ ] Prepare action documentation, icons, and test repository demonstration.

---

### ⚪ Week 3: Live Post-Deployment Monitor & Pilot Onboarding (Days 15–21)

- [ ] **Live Telemetry & RPC Polling**:
  - [ ] Connect `client/app/monitor/page.tsx` to live Stellar RPC (`SorobanRpc.Server.getLedgerEntries`).
  - [ ] Implement real-time TTL calculation: warn when a contract's persistent storage has fewer than 10,000 ledgers remaining.
  - [ ] Detect contract upgrade events and bytecode hash changes.
- [ ] **Pilot Developer Outreach & Testing**:
  - [ ] Identify and reach out to 5 active Soroban developer teams building on Stellar.
  - [ ] Audit 5 real-world smart contracts through Solace.
  - [ ] Anchor the audit reports to the testnet/mainnet `SolaceContract` ledger.
  - [ ] Collect user feedback on vulnerability detection accuracy and UI experience.

---

### ⚪ Week 4: Mainnet Launch, Open Source SDK & Final Deliverables (Days 22–30)

- [ ] **Mainnet Contract Deployment**:
  - [ ] Deploy `solace_core` to Stellar Mainnet.
  - [ ] Record and verify the live Mainnet Contract ID.
  - [ ] Initialize admin keys and verify ledger persistent state rent.
- [ ] **Open Source Developer SDK**:
  - [ ] Package `@solace/sdk` (or exportable TypeScript client) for programmatic audit triggers and ledger verification.
  - [ ] Publish SDK usage examples in `examples/`.
- [ ] **Demo Video & Grant Report**:
  - [ ] Record a 3–5 minute high-quality video showcasing:
    - Pre-deployment audit in Web Studio.
    - Automated GitHub Action bot analyzing a PR.
    - Freighter wallet anchoring the audit proof to the Soroban ledger.
    - Live contract storage TTL monitoring.
  - [ ] Publish the Day 30 Final Report matching all success criteria from `SCOPE.md`.

---

## 🎯 Success Criteria Matrix (Day 30 Verification)

| Success Criteria (from SCOPE.md) | Verification Method | Status |
| :--- | :--- | :---: |
| **1. Live Deployed Mainnet Contract** | Verified Mainnet Contract ID on Stellar Expert | ⚪ In Progress |
| **2. Public GitHub Action Package** | Action testable on external open-source Soroban repos | ⚪ In Progress |
| **3. Live Web Dashboard** | Hosted dashboard running audits and displaying PR checks | 🟡 Functional locally |
| **4. 5 External Pilot Smart Contracts** | 5 real contracts audited with hashes anchored on-chain | ⚪ In Progress |

---

## 📝 Recent Progress & Changelog

### 2026-10-14 / 2026-10-15
- ✅ Created `solace_core` Soroban smart contract with `record_audit` and `get_audit` in Rust.
- ✅ Built Node.js Express backend with Gemini auditing engine via `@google/genai`.
- ✅ Configured and verified user's Google AI Studio API key with multi-model fallback resiliency.
- ✅ Validated end-to-end security audits across both CLI runner (`npm run audit`) and live Express API (`POST /api/audit`).
- ✅ Restructured codebase into clean monorepo architecture: `contract/`, `server/`, `client/`.
- ✅ Built Next.js 14 App Router frontend with custom `#C80552` accent theme.
- ✅ Migrated frontend to 100% strict TypeScript (`.tsx` and `.ts`).
- ✅ Integrated Freighter browser wallet (`@stellar/freighter-api`) for on-chain anchoring.
- ✅ Added multi-page navigation for Audit Studio (`/`), Verified Reports (`/reports`), and Live Monitor (`/monitor`).
- ✅ Deployed `solace_core` to Stellar Testnet (Contract ID: [`CBXV73FFYM45PJQYUB2VTGU2WUQL4JUSL6OG3SEWSGXW4WJH5YSNQKDQ`](https://stellar.expert/explorer/testnet/contract/CBXV73FFYM45PJQYUB2VTGU2WUQL4JUSL6OG3SEWSGXW4WJH5YSNQKDQ)).
- ✅ Built backend `sorobanService.js` connecting Express directly to the Stellar Soroban RPC.
- ✅ Implemented and verified live REST endpoints for on-chain audits (`GET /api/contract/info`, `GET /api/contract/audit/:hash`, `POST /api/contract/record`).
- ✅ Outlined 30-Day Instaward Scope ([`SCOPE.md`](SCOPE.md)) and initialized Progress Tracker ([`PLAN.md`](PLAN.md)).
