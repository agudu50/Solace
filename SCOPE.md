Project and one liner:
"Solace: AI-powered smart contract security auditing and bug detection platform for Stellar & Soroban."

Problem and users:
Developers building Soroban smart contracts face severe risks from bugs, missing authentication checks, storage rent/TTL mismanagement, and unhandled panics (.unwrap()). Today, security auditing is manual, slow, and expensive, leaving protocols vulnerable before and after deployment. Solace solves this for Rust and Soroban developers.

Where it stands now:
Fully functional MVP built and deployed during Stellar 14:

- Smart Contract (contract/): Written in Rust using Soroban SDK 28, compiled, and live on Stellar Testnet (Contract ID: `CAC2TVMF5TZ3CH3FSORD267USQJTRKX6HFE3YBWSLMYHIDNMDV6PNPN2`). Stores and verifies immutable audit reports with persistent storage rent longevity and 1.0 XLM fee logic.
- Backend Server (server/): Express API powered by adaptive Gemini AI engine (with multi-model fallback across Gemini Flash models) performing pre-deployment code analysis and real-time Soroban RPC contract telemetry. Configured for cloud hosting on Render.
- Client App (client/): Next.js 14 TypeScript dashboard featuring Freighter wallet integration with cryptographic signature verification, live on-chain anchoring, and real-time post-deployment storage TTL monitoring. Configured for cloud hosting on Netlify.
- Security Treasury: Active treasury keypair (`GABQOW...KAJX`) receiving micro-fees for sustainable ledger state renewal.

Deliverables (What we will ship in 30 days):

1. Mainnet Deployment: Deploy the solace_core smart contract to Stellar Mainnet.
2. Automated GitHub Action Bot: A CI/CD plugin that automatically runs a Solace security check on every pull request containing Rust smart contract changes.
3. Enhanced Post-Deployment Monitor: Real-time ledger tracking for storage TTL expiration warnings and upgrade-path security alerts.
4. Open Source Tooling: Publish public developer SDK bindings for Solace integration.

Stellar components:

- Soroban Smart Contracts (Persistent storage, contract invocation, custom structs)
- Stellar SDK (TypeScript & Rust)
- Freighter Wallet (Secure user authorization and signing)
- Stellar Testnet / Mainnet

Success criteria (How to check at Day 30):

- Live deployed Mainnet contract ID for Solace.
- Public GitHub Action package published and testable in external repos.
- Live URL for the Solace dashboard processing automated PR checks.
- At least 5 external pilot smart contracts successfully audited and anchored.

Team and roles:

- Anthony Gudu (Full-Stack Engineer & Co-founder): Smart contract architecture, backend AI integration, and frontend UX.
- Team Members (3-5 builders): Testing, documentation, and pilot developer outreach (committed to 15-20 hours/week).

Risks:

- Risk: RPC rate limits or testnet congestion during live demos.
- Mitigation: Recorded backup video and local fallback environment ready for Demo Day.

Award size requested:
$3,000 in XLM (First-tier Instaward scope matching 30-day deliverables[cite: 2, 5]).

Milestones, week by week:

- Week 1: Set up mainnet contract deployment scripts, refine Gemini AI prompt rules for edge-case Soroban vulnerabilities.
- Week 2: Build and test the GitHub Action CI/CD bot integration for pull requests.
- Week 3: Onboard pilot developers, run live post-deployment checks, and fix bugs.
- Week 4: Finalize documentation, deploy to mainnet, record demo video, and publish final report against success criteria[cite: 5].
