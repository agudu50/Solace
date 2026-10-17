# Solace 🛡️

**AI-Powered Smart Contract Security Auditing & Bug Detection for Stellar & Soroban**

Solace is an automated smart contract security platform engineered specifically for the **Stellar** and **Soroban** ecosystem. Combining Google's adaptive **Gemini AI Engine** (featuring multi-model fallback across high-performance Gemini Flash models) with on-chain Soroban smart contracts, Solace enables developers to audit code for critical vulnerabilities, enforce authorization rules, and record immutable audit proofs directly onto the Stellar ledger.

---

## 🌟 Key Features

- **Dual-Mode AI Auditing**:
  - **PRE-DEPLOYMENT**: Static source code AST analysis targeting authorization checks, unsafe unwrapping, reentrancy, integer overflow, and admin multi-sig vectors.
  - **POST-DEPLOYMENT**: Live inspection of contract instance/persistent storage, storage rent TTL, upgrade vectors, host panic shields, and monitoring telemetry.
- **Adaptive Multi-Model Resiliency**:
  - Automatically queries active Gemini models (`gemini-3.5-flash-lite`, `gemini-3.5-flash`, etc.) with exponential backoff and candidate fallback to ensure 99.9% uptime.
- **Freighter Wallet & On-Chain Anchoring**:
  - Connect browser extension wallet via `@stellar/freighter-api` with cryptographic session signature verification (`signMessage`).
  - Sign and anchor verified audit records onto the Stellar Soroban ledger with one click.
- **On-Chain Audit Fee & Protocol Treasury**:
  - 1.0 XLM micro-fee charged to the requesting auditor, transferred directly to the protocol treasury address (`GABQOW...KAJX`) with cryptographic transaction hash memo verification.
- **Live Post-Deployment Contract Monitor (`/monitor`)**:
  - Real-time storage rent TTL calculation ($\text{liveUntil} - \text{latestLedger}$).
  - State eviction warning system: Optimal (> 20,000 ledgers), Warning (5,000–20,000), Critical (< 5,000).
  - Soroban Protocol 22 consensus status, RPC node health, and latency tracking.
  - 5-second auto-polling stream with instant local caching and sub-second responses.
- **Interactive Multi-Page Web Studio (100% TypeScript)**:
  - **Dashboard & Audit Studio** (`/`): Code editor with sample contract loader, vulnerability breakdown, and on-chain anchoring.
  - **Verified Reports** (`/reports`): Search and verify on-chain audit reports by contract SHA-256 hash.
  - **Live Monitor** (`/monitor`): Real-time contract telemetry and storage TTL monitoring.
- **Custom Design System**:
  - Modern, gradient-free flat UI with brand accent token `#C80552` (`var(--e-global-color-accent)`).
  - Dark/Light mode support with synchronized navigation across desktop and mobile.

---

## 🏆 Built during Stellar 14 (5 – 17 October 2026)

*Solace is a brand new project conceived, designed, and built from scratch during the Stellar 14 Build Days.*

### What was built during Stellar 14:
- **Rust Soroban Smart Contract ([`contract/`](contract/src/lib.rs))**:
  - Implemented `record_audit`, `get_audit`, and `get_audit_fee` with persistent storage rent management.
  - Compiled to WebAssembly (`solace_core.wasm`, 1,950 bytes optimized) and deployed to **Stellar Testnet**.
- **Backend AI Engine & Soroban Service ([`server/`](server/src/index.js))**:
  - Integrated Google's adaptive Gemini AI engine via `@google/genai` with automatic candidate model fallback.
  - Built `@stellar/stellar-sdk` Soroban service for programmatic transaction signing, ledger querying, and telemetry metrics.
  - Cloud-ready deployment configuration with [`render.yaml`](render.yaml).
- **Frontend Web Studio ([`client/`](client/app/page.tsx))**:
  - Next.js 14 App Router in 100% strict TypeScript.
  - Custom responsive design system with compact mobile bottom dock and desktop pill navigation.
  - Freighter wallet integration with session challenge popup verification.
  - Cloud-ready deployment configuration with [`netlify.toml`](netlify.toml).

### 🌐 Network & Deployed Contract Information
- **Network**: Stellar Testnet (`https://soroban-testnet.stellar.org`)
- **Protocol**: Soroban Protocol 22
- **Contract ID**: [`CAC2TVMF5TZ3CH3FSORD267USQJTRKX6HFE3YBWSLMYHIDNMDV6PNPN2`](https://stellar.expert/explorer/testnet/contract/CAC2TVMF5TZ3CH3FSORD267USQJTRKX6HFE3YBWSLMYHIDNMDV6PNPN2)
- **Auditor Signer Address**: [`GBWSB2OVP5JIWGJND5C46TAIM7AQH5YJ56576CGOPG3AXAFNHO7FDYPI`](https://stellar.expert/explorer/testnet/account/GBWSB2OVP5JIWGJND5C46TAIM7AQH5YJ56576CGOPG3AXAFNHO7FDYPI)
- **Treasury Wallet Address**: [`GABQOWDBI5MX6QYKP4JLB3PWJKVI7IXTQCNESBVSUK3SUUR2S3AEKAJX`](https://stellar.expert/explorer/testnet/account/GABQOWDBI5MX6QYKP4JLB3PWJKVI7IXTQCNESBVSUK3SUUR2S3AEKAJX)
- **Wasm Hash**: `32ebebd07326cd5d0fa0ef77d7e268e06e3c68d3e43028dddc67245813957bbd`

---

## 🏗️ Repository Architecture

```text
Solace/
├── contract/                  # Soroban Smart Contract (Rust)
│   ├── Cargo.toml             # Soroban SDK 28.0.0 dependencies & release profile
│   └── src/
│       └── lib.rs             # SolaceContract: record_audit, get_audit, get_audit_fee
├── server/                    # Express.js Backend & Gemini AI Engine
│   ├── src/
│   │   ├── controllers/       # Request validation & Soroban payload formatting
│   │   ├── routes/            # REST endpoints (/api/audit, /api/contract/...)
│   │   ├── services/          # Gemini AI Engine & Soroban RPC Telemetry Service
│   │   ├── scripts/           # Terminal audit runner (runAudit.js)
│   │   └── index.js           # Server entry point (port 5000)
│   ├── .env.example           # Environment template for keys and RPC
│   └── package.json
├── client/                    # Next.js 14 Frontend (App Router + TypeScript + Tailwind)
│   ├── app/
│   │   ├── audit/             # Dedicated Audit Studio workspace
│   │   ├── monitor/           # Live contract post-deployment monitoring
│   │   ├── reports/           # Verified on-chain ledger reports explorer
│   │   ├── globals.css        # CSS variables & Tailwind tokens
│   │   ├── layout.tsx         # Root layout with persistent Navbar & SidebarDock
│   │   └── page.tsx           # Security Dashboard canvas
│   ├── components/            # Modular UI components (100% TSX)
│   │   ├── auth/              # WalletGate & auditor authentication
│   │   ├── layout/            # Navbar, SidebarDock, and Modals
│   │   └── audit/             # AuditReportView, ContractInput, Invariants
│   ├── context/
│   │   └── WalletContext.tsx  # Global Freighter wallet state provider
│   ├── utils/
│   │   └── solaceService.ts   # Freighter wallet & Soroban invocation service
│   ├── package.json
│   ├── tailwind.config.js
│   └── tsconfig.json          # TypeScript strict configuration
├── netlify.toml               # Client Netlify cloud deployment configuration
├── render.yaml                # Backend Render cloud deployment configuration
├── PITCH.md                   # 3-Minute Demo Pitch & presentation script
├── PLAN.md                    # 30-Day Instaward milestone execution roadmap
├── SCOPE.md                   # Formal Stellar Community Fund grant scope
├── .gitignore
└── package.json               # Monorepo workspace runner scripts
```

---

## 🚀 Quickstart

### Prerequisites

- [Node.js](https://nodejs.org/) (v18.x or v20.x recommended)
- [Freighter Wallet](https://www.freighter.app/) extension installed in your browser
- [Rust](https://www.rust-lang.org/) with `wasm32-unknown-unknown` target:
  ```bash
  rustup target add wasm32-unknown-unknown
  ```
- [Stellar CLI](https://developers.stellar.org/docs/tools/developer-tools/cli/stellar-cli) (optional, for contract builds and deployments)
- A **Google Gemini API Key** from [Google AI Studio](https://aistudio.google.com/)

---

### 1. Configure the Server

Navigate into `server/` and create your `.env` file:

```bash
cd server
cp .env.example .env
```

Edit `server/.env` and insert your Gemini API Key:

```env
PORT=5000
GEMINI_API_KEY=your_gemini_api_key_here

# Stellar Network & Soroban Configuration
STELLAR_RPC_URL=https://soroban-testnet.stellar.org
STELLAR_NETWORK_PASSPHRASE="Test SDF Network ; September 2015"
SOLACE_CONTRACT_ID=C...
AUDITOR_SECRET_KEY=S...
```

---

### 2. Start the Backend Server

```bash
# From server/ directory
npm run dev

# Or from the project root
npm run server:dev
```

The API will start at **http://localhost:5000**. Verify with:
```bash
curl http://localhost:5000/api/health
```

---

### 3. Start the Next.js Frontend

```bash
# In a new terminal, from client/ directory
npm run dev

# Or from the project root
npm run client:dev
```

Open **http://localhost:3000** in your browser to access the Solace Web Studio.

---

### 4. Run CLI Audits (Terminal Mode)

You can audit any Soroban Rust smart contract file directly from the terminal without opening the browser:

```bash
# Audit the default contract (contract/src/lib.rs)
npm run audit

# Audit in post-deployment inspection mode
npm run audit -- --post-deployment

# Audit a specific external contract file
npm run audit -- path/to/my_contract.rs
```

---

## 🔐 Freighter Wallet & On-Chain Service

Client-side blockchain interactions are encapsulated in [`client/utils/solaceService.ts`](client/utils/solaceService.ts):

- **`connectWallet()`**: Verifies the Freighter extension is active and requests access to the user's Stellar public key.
- **`recordAuditOnChain()`**: Constructs and simulates Soroban contract invocation for `record_audit` using `@stellar/stellar-sdk` and `nativeToScVal`.

---

## 📜 Smart Contract Reference

The on-chain contract is located at [`contract/src/lib.rs`](contract/src/lib.rs).

### Data Schema

```rust
#[contracttype]
pub struct AuditReport {
    pub contract_hash: String,
    pub risk_score: u32,
    pub is_secure: bool,
    pub audit_type: String, // "PRE_DEPLOYMENT" or "POST_DEPLOYMENT"
    pub auditor: Address,
}
```

### Public Methods

| Method | Parameters | Description |
| :--- | :--- | :--- |
| `record_audit` | `auditor: Address, contract_hash: String, risk_score: u32, is_secure: bool, audit_type: String` | Authenticates auditor via `auditor.require_auth()` and persists report to storage. |
| `get_audit` | `contract_hash: String` | Retrieves the stored `AuditReport` for a given contract hash. |

### Building the Contract

```bash
cd contract
stellar contract build
```

*(Or build directly using Cargo)*:
```bash
cargo build --target wasm32-unknown-unknown --release
```

---

## 📡 API Reference

### `GET /api/health`
Health check endpoint reporting service availability and model status.

### `POST /api/audit`
Analyzes a smart contract code snippet using the adaptive Gemini AI Security Engine.

**Request Body**:
```json
{
  "codeSnippet": "// Rust Soroban contract code...",
  "isPostDeployment": false
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "riskScore": 15,
    "isSecure": true,
    "summary": "Contract implements proper authorization checks and safe arithmetic...",
    "vulnerabilities": [],
    "postDeploymentRecommendations": [
      "Set up state archival monitors to renew persistent storage TTL."
    ]
  },
  "contractHash": "ec6a4eb00b6281f6f765ff3d94bf187d153dd42a78627164dbf837e83023defe",
  "auditType": "PRE_DEPLOYMENT",
  "onChainPayload": {
    "functionName": "record_audit",
    "cliCommand": "stellar contract invoke --id ... -- record_audit ..."
  }
}
```

### `GET /api/contract/info`
Returns active Soroban smart contract metadata, RPC connectivity, network status, and explorer URLs.

### `GET /api/contract/audit/:contractHash`
Reads an immutable audit report directly from the live Soroban persistent ledger storage for a given contract SHA-256 hash.

### `GET /api/contract/telemetry/:contractId?network=testnet`
Fetches real-time contract footprint telemetry, current ledger sequence, `liveUntilLedgerSeq`, remaining TTL blocks, storage rent status, and RPC health metrics.

### `GET /api/contract/fee`
Returns the on-chain audit fee (1.0 XLM default) and protocol treasury destination address (`TREASURY_ADDRESS`).

### `POST /api/contract/record`
Anchors a verified audit report onto the Soroban smart contract using the authorized auditor keypair.

**Request Body**:
```json
{
  "contractHash": "ec6a4eb00b6281f6f765ff3d94bf187d153dd42a78627164dbf837e83023defe",
  "riskScore": 15,
  "isSecure": true,
  "auditType": "PRE_DEPLOYMENT",
  "auditor": "GBWSB2OVP5JIWGJND5C46TAIM7AQH5YJ56576CGOPG3AXAFNHO7FDYPI"
}
```

---

## 🎨 Theme Customization

Solace uses CSS variables to drive the accent theme throughout the frontend. To update the accent color, modify `--e-global-color-accent` in [`client/app/globals.css`](client/app/globals.css):

```css
:root {
  --e-global-color-accent: #C80552; /* Change to any HEX or HSL value */
}
```
All buttons, borders, badges, links, and selections across the entire interface will update immediately.

---

## 🛡️ License

This project is licensed under the MIT License.
