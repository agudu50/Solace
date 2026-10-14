# Solace 🛡️

**AI-Powered Smart Contract Security Auditing & Bug Detection for Stellar & Soroban**

Solace is an automated smart contract security platform engineered specifically for the **Stellar** and **Soroban** ecosystem. Combining Google's **Gemini 3.8 Flash** model with on-chain Soroban smart contracts, Solace enables developers to audit code for critical vulnerabilities, enforce authorization rules, and record immutable audit proofs directly onto the Stellar ledger.

---

## 🌟 Key Features

- **Dual-Mode AI Auditing**:
  - **PRE-DEPLOYMENT**: Static source code analysis targeting authorization checks, unsafe unwrapping, reentrancy, and integer overflow.
  - **POST-DEPLOYMENT**: Live inspection of contract instance/persistent storage, rent TTL, upgrade vectors, and monitoring telemetry.
- **On-Chain Audit Provenance**: Every audit report can be signed and recorded persistently on the Stellar ledger via the [`SolaceContract`](contract/src/lib.rs) smart contract.
- **Soroban Vulnerability Detection**:
  - Missing or improper `require_auth()` authorization checks.
  - Unsafe `.unwrap()` calls leading to transaction panics.
  - Instance vs. Persistent storage mismanagement & TTL rent expiration.
  - Administrative access control defects and reentrancy vectors.
- **Interactive Multi-Page Web Studio**:
  - **Audit Studio**: Code editor with sample loader and real-time vulnerability breakdown.
  - **Verified Reports**: Search and verify on-chain audit reports by contract SHA-256 hash.
  - **Live Monitor**: Post-deployment telemetry, storage rent TTL tracking, and security invariants.
- **Custom Design System**: Powered by Tailwind CSS with a custom accent token system (`var(--e-global-color-accent)` set to `#C80552`).
- **Developer CLI**: Run command-line audits directly on `.rs` files and generate ready-to-execute `stellar contract invoke` payloads.

---

## 🏗️ Repository Architecture

```text
Solace/
├── contract/                  # Soroban Smart Contract (Rust)
│   ├── Cargo.toml             # Soroban SDK 28.0.0 dependencies & release profile
│   └── src/
│       └── lib.rs             # SolaceContract: record_audit & get_audit
├── server/                    # Express.js Backend & Gemini AI Engine
│   ├── src/
│   │   ├── controllers/       # Request validation & Soroban payload formatting
│   │   ├── routes/            # REST endpoints (/api/audit, /api/health)
│   │   ├── services/          # Gemini 3.8 Flash integration via @google/genai
│   │   ├── scripts/           # Terminal audit runner (runAudit.js)
│   │   └── index.js           # Server entry point (port 5000)
│   ├── .env.example           # Environment template for keys and RPC
│   └── package.json
├── client/                    # Next.js 14 Frontend (App Router + Tailwind)
│   ├── app/
│   │   ├── monitor/           # Live contract monitoring page
│   │   ├── reports/           # Verified on-chain ledger reports page
│   │   ├── globals.css        # Custom CSS variables & Tailwind imports
│   │   ├── layout.js          # Root layout with persistent Navbar & Footer
│   │   └── page.js            # Main Audit Studio page
│   ├── components/            # Modular UI components (audit/ & layout/)
│   ├── lib/                   # API client & sample contract constants
│   ├── package.json
│   └── tailwind.config.js
├── .vscode/                   # IDE lint settings (CSS unknown at-rules ignored)
├── .gitignore
└── package.json               # Monorepo workspace runner scripts
```

---

## 🚀 Quickstart

### Prerequisites

- [Node.js](https://nodejs.org/) (v18.x or v20.x recommended)
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
Analyzes a smart contract code snippet using Gemini 3.8 Flash.

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
  "contractHash": "ec6a4eb00b6281f6f765ff3d94bf187d153dd42a78627164dbf837e83023defe",
  "auditType": "PRE_DEPLOYMENT",
  "report": {
    "riskScore": 15,
    "isSecure": true,
    "summary": "Contract implements proper authorization checks and safe arithmetic...",
    "vulnerabilities": [],
    "postDeploymentRecommendations": [
      "Set up state archival monitors to renew persistent storage TTL."
    ]
  },
  "onChainPayload": {
    "functionName": "record_audit",
    "cliCommand": "stellar contract invoke --id ... -- record_audit ..."
  }
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
