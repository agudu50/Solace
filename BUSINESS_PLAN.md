# Solace: Business Plan & Financial Model
## Transition to a Credit-Based Prepaid Subscription Model

**Document Version:** 2.0.0  
**Effective Date:** October 2026  
**Platform:** Solace — Autonomous Smart Contract Security Auditor for Stellar & Soroban  
**Network Status:** Stellar Protocol 22 (Testnet Live, Mainnet Prepared)  
**Smart Contract ID:** `CAC2TVMF5TZ3CH3FSORD267USQJTRKX6HFE3YBWSLMYHIDNMDV6PNPN2`  
**Protocol Treasury:** `GABQOWDBI5MX6QYKP4JLB3PWJKVI7IXTQCNESBVSUK3SUUR2S3AEKAJX`

---

## 1. Executive Summary & Strategic Evolution

### 1.1 The Previous Business Model
Previously, Solace operated on a pay-per-audit model charging **1.0 XLM** per audit invocation. While this micro-fee model demonstrated the technical viability of on-chain treasury routing on Stellar, it presented commercial and operational bottlenecks:
1. **Wallet Signature Friction:** Requiring a dedicated Freighter browser wallet approval and transaction broadcast for *every single audit run* introduced excessive user friction during iterative development.
2. **Economic Misalignment with Contract Development:** Smart contract engineering is inherently iterative. A developer does not audit a contract once; they run multiple passes across syntax modifications, vulnerability remediation, and test deployments.
3. **Treasury Inefficiency:** Individual 1.0 XLM micro-transactions incurred recurring transaction network overhead relative to the fee collected.

### 1.2 The New Model: Prepaid Audit-Credit Bundles
Solace is transitioning to an **upfront, credit-based prepaid bundle model**. Under this model, developers purchase a package of audit credits upfront in XLM. Each successful payment grants a verified, immutable allocation of audit credits that:
- **Never Expire:** Credits do not expire after 30 days, calendar months, or periods of inactivity. Users consume credits strictly at their own pace.
- **Accumulate Seamlessly:** Purchasing subsequent packages increments the user's existing available balance without overwriting or forfeiting unused credits.
- **Eliminate Per-Audit Signing Friction:** Once credits are purchased and inscribed in the smart contract, audits run with single-click ease, deducting credits automatically through verified cryptographic ledger records.
- **Provide Guaranteed Ledger Provenance:** Every credit grant and credit consumption is tracked on-chain via the `solace_core` contract on Stellar.

---

## 2. Pricing Structure & Package Architecture

### 2.1 Baseline Packages

| Package Tier | Upfront Price (XLM) | Stroops ($10^{-7}$ XLM) | Included Audits | Effective Price / Audit | Target Audience |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **Starter** | **30 XLM** | 300,000,000 | **3 audits** | 10.0 XLM | Hackathon builders, solo developers, single-contract pilots |
| **Growth** | **60 XLM** | 600,000,000 | **6 audits** | 10.0 XLM | Multi-function DeFi protocols, lending pools, token vaults |
| **Professional** | **90 XLM** | 900,000,000 | **9 audits** | 10.0 XLM | Ecosystem DAOs, commercial protocols, continuous security teams |

### 2.2 Effective Unit Economics & Tier Value Proposition

- **Uniform Unit Pricing (10 XLM per Audit):**  
  At an illustrative XLM price of **$0.10 USD / XLM**, the effective price per audit is **$1.00 USD**. This represents an order-of-magnitude cost reduction compared to traditional manual audit firms ($5,000 – $50,000 per engagement) and centralized SaaS scanners ($50 – $200 / month), while providing specialized Soroban Protocol 22 static analysis and cryptographic ledger proof.
- **Value Differentiation:**
  - **Starter (30 XLM):** Low barrier to entry for developers testing Solace before committing larger capital. Provides sufficient credits for an initial audit, fix pass, and pre-deployment verification.
  - **Growth (60 XLM):** Matches the standard Soroban protocol development cycle (initial architecture check, auth invariant test, storage rent TTL validation, remediation re-scan, staging check, final production release seal).
  - **Professional (90 XLM):** Designed for teams deploying multi-contract architectures (e.g., Factory + Pool + Token + Governance) requiring ongoing multi-pass verification.

---

## 3. Cost Analysis & Gross Margin Breakdown

### 3.1 Direct Audit Costs (Cost of Goods Sold - COGS)

For each smart contract audit executed through Solace, direct infrastructure and API costs are incurrred:

| Expense Component | Resource Usage / Frequency | Unit Cost Assumption | Cost per Audit (USD) |
| :--- | :--- | :--- | :---: |
| **AI Model Inference (Gemini Flash / Multi-Model)** | ~2,500 input tokens (Rust AST + context), ~1,200 output tokens (structured JSON findings + syntax fixes) | Input: $0.075 / 1M tokens<br>Output: $0.30 / 1M tokens | **$0.00055** |
| **Deterministic AST Rule Engine** | Rust AST semantic traversal on node compute | Compute latency < 400ms | **$0.00020** |
| **Stellar Ledger Inscription** | Soroban `solace_core` invocation | Base fee: 100 stroops (0.00001 XLM)<br>Footprint rent renewal: ~0.02 XLM | **$0.00200** |
| **Soroban RPC State Queries** | Horizon & Soroban RPC endpoint bandwidth | 2 RPC reads per audit | **$0.00010** |
| **Server Bandwidth & Compute** | Node.js Express worker on cloud cluster | 50ms average CPU time | **$0.00015** |
| **Total Direct Cost per Audit** | — | — | **$0.00300** |

### 3.2 Gross Margin Calculation

- **Revenue per Audit (at 10 XLM / $0.10 USD):** **$1.00 USD**
- **Direct Cost per Audit (COGS):** **~$0.003 USD**
- **Gross Profit per Audit:** **$0.997 USD**
- **Gross Margin:** **99.7%**

*Conservative Buffer Assumption:* Even if Stellar storage rent fluctuates or complex contracts require extended 8,000-token LLM context windows bringing COGS to $0.02 USD per audit, the gross margin remains above **98.0%**.

### 3.3 Fixed Operational Costs (Monthly)

| Expense Item | Provider / Service | Monthly Cost (USD) | Annual Cost (USD) |
| :--- | :--- | :---: | :---: |
| **API Application Server** | Render / DigitalOcean (Dedicated Node.js container) | $25.00 | $300.00 |
| **Web Frontend Hosting** | Netlify / Vercel Pro | $20.00 | $240.00 |
| **Stellar Horizon & Soroban RPC** | Dedicated RPC Node / QuickNode / Blockdaemon backup | $50.00 | $600.00 |
| **Domain, SSL & Security Headers** | Cloudflare Pro + Domain Registration | $25.00 | $300.00 |
| **Continuous Integration / Bot Workers** | GitHub Actions & Cloud Run runners | $30.00 | $360.00 |
| **Total Fixed Operating Expenses (OpEx)** | — | **$150.00 / mo** | **$1,800.00 / yr** |

---

## 4. Financial Projections & Deferred Revenue Accounting

### 4.1 Accounting for Non-Expiring Audit Credits (ASC 606 / IFRS 15)
Because Solace credits **never expire**, upfront token payments cannot be recognized immediately as 100% earned revenue on the cash receipt date. Instead:
- **Cash Inflow:** Recorded upon confirmed on-chain transaction receipt.
- **Deferred Revenue (Contract Liability):** The unconsumed portion of purchased credits remains on the platform's balance sheet as an outstanding service obligation.
- **Recognized Revenue:** Revenue is recognized progressively as the user executes eligible audits (1 credit = 10 XLM recognized).
- **Breakage Policy:** In accordance with standard financial principles, historical non-redemption (breakage) will be analyzed after 18–24 months of production data to recognize unredeemed balances where the likelihood of customer exercise becomes remote.

### 4.2 12-Month Projections (Conservative Adoption Model)

*Assumptions:*
- Average Package Mix: 50% Starter (30 XLM), 35% Growth (60 XLM), 15% Professional (90 XLM).
- Average revenue per bundle sale: **49.5 XLM** (~$4.95 USD).
- Average credit consumption rate: ~60% consumed within the first 60 days of purchase; ~40% held as unexpired deferred balance.

| Month | New Customers | Bundles Sold | Total Credits Sold | Cash Inflow (XLM) | Cash Inflow (USD @ $0.10) | Credits Consumed | Recognized Revenue (USD) | Outstanding Deferred Liability (Credits) | Cumulative Net Cash Flow |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **M1** | 15 | 18 | 89 | 891 XLM | $89.10 | 45 | $45.00 | 44 | -$60.90 |
| **M2** | 28 | 35 | 173 | 1,732 XLM | $173.20 | 110 | $110.00 | 107 | -$37.70 |
| **M3** | 45 | 60 | 297 | 2,970 XLM | $297.00 | 210 | $210.00 | 194 | +$109.30 |
| **M4** | 70 | 95 | 470 | 4,702 XLM | $470.20 | 360 | $360.00 | 304 | +$429.50 |
| **M5** | 105 | 145 | 717 | 7,177 XLM | $717.70 | 560 | $560.00 | 461 | +$997.20 |
| **M6** | 150 | 210 | 1,039 | 10,395 XLM | $1,039.50 | 840 | $840.00 | 660 | +$1,886.70 |
| **M7** | 200 | 285 | 1,410 | 14,107 XLM | $1,410.70 | 1,180 | $1,180.00 | 890 | +$3,147.40 |
| **M8** | 260 | 375 | 1,856 | 18,562 XLM | $1,856.20 | 1,580 | $1,580.00 | 1,166 | +$4,853.60 |
| **M9** | 330 | 480 | 2,376 | 23,760 XLM | $2,376.00 | 2,050 | $2,050.00 | 1,492 | +$7,079.60 |
| **M10** | 410 | 600 | 2,970 | 29,700 XLM | $2,970.00 | 2,600 | $2,600.00 | 1,862 | +$9,899.60 |
| **M11** | 500 | 740 | 3,663 | 36,630 XLM | $3,663.00 | 3,250 | $3,250.00 | 2,275 | +$13,412.60 |
| **M12** | 600 | 900 | 4,455 | 44,550 XLM | $4,455.00 | 4,000 | $4,000.00 | 2,730 | +$17,717.60 |
| **Total**| **2,713** | **3,943** | **19,517** | **195,176 XLM** | **$19,517.60** | **16,785** | **$16,785.00** | **2,730** | **+$17,717.60** |

*Key Financial Takeaways:*
- **Break-Even Point:** Achieved in Month 3 with ~60 bundle purchases per month covering the $150/month fixed OpEx.
- **Year 1 Net Operating Profit:** Over **$17,700 USD** generated after all server, RPC, AI inference, and storage rent costs.
- **Unexpired Obligation Management:** 2,730 unexpired credits remain on the ledger at year-end. With direct delivery costs of ~$0.003/credit, fulfilling these 2,730 credits requires only **$8.19 USD** in future COGS, demonstrating zero liquidity risk from long-term unexpired balances.

---

## 5. Target Customers & Value Proposition

### 5.1 Primary Customer Segments
1. **Stellar & Soroban Ecosystem Developers:**
   - *Pain Point:* Solo builders and hackathon teams cannot afford traditional manual smart contract audits ($5,000–$50,000) and cannot wait 3–6 weeks for report delivery.
   - *Solace Solution:* Instant, continuous AST audits with syntax remediation for 10 XLM (~$1.00 USD).
2. **DeFi Protocol Founders (Lending Vaults, DEXs, AMMs):**
   - *Pain Point:* Risk of critical authorization flaws (missing `require_auth()`) and persistent storage eviction under Stellar Protocol 22.
   - *Solace Solution:* Deterministic invariant testing and automated TTL threshold verification before capital is locked.
3. **Launchpads, Accelerators & Grants (Stellar Community Fund):**
   - *Pain Point:* Grant evaluators need objective, tamper-proof proof that applicant projects maintain sound code security.
   - *Solace Solution:* Public on-chain verification explorer querying the `solace_core` contract directly.

### 5.2 Customer Acquisition Strategy (GTM)
- **Stellar Community Fund (SCF) & Hackathon Integration:** Position Solace as the recommended pre-submission audit check for all SCF applicants.
- **GitHub Action Bot Distribution:** Offer free CI checks for public open-source Soroban repos, driving developers to purchase credit bundles for private repo scans and ledger seals.
- **Developer Documentation & Tutorials:** Publish standard security guides for Soroban SDK v22 covering TTL rent renewal and authorization patterns.

---

## 6. Retention Strategy & Customer Lifetime Value (LTV)

1. **Non-Expiring Trust Dividend:** Developers retain full trust in the platform knowing their investment is never confiscated by monthly expirations. This promotes early, larger bundle purchases (e.g., Growth or Professional).
2. **Automated Low-Balance Prompts:** The platform proactively alerts developers when their balance reaches 1 credit, allowing seamless 1-click package replenishment without interrupting active build cycles.
3. **Persistent On-Chain Security History:** Developers build an on-chain provenance track record on the Stellar ledger with each audit. Transitioning to another tool would fragment their audit trail.

---

## 7. Risk Management & Mitigations

| Identified Risk | Severity | Mitigation Strategy |
| :--- | :---: | :--- |
| **XLM Token Price Volatility** | Medium | Periodic governance adjustment of package XLM thresholds if XLM deviates by >50%, while preserving existing user credits intact. |
| **Large Spike in Deferred Credit Consumption** | Low | Because COGS per audit is negligible ($0.003), even a 10,000-audit single-day spike would cost under $30 in compute, posing no financial strain. |
| **LLM Provider Outages / Latency** | Medium | Dual-pass multi-model fallback pipeline in `aiAuditor.js` seamlessly switching between Gemini Flash models with deterministic AST rule verification. |
| **Replay & Double-Spend Attempts** | High | Smart contract enforces transaction idempotency, caller authentication (`user.require_auth()`), and internal nonce/hash tracking in persistent storage. |

---

## 8. Migration & Backward Compatibility Strategy

To ensure fairness and compliance with existing users:
1. **Preserve All Historic Records:** Existing audit records anchored under the 1.0 XLM micro-fee model remain permanently in persistent storage on Stellar (`CAC2TV...NPN2`).
2. **Legacy Audit Compatibility:** The `solace_core` contract preserves the legacy `record_audit` and `pay_audit_fee` endpoints to prevent breaking changes for existing SDK integrations.
3. **No Retroactive Charges:** Users who audited contracts under the previous model will never be charged retroactively.
4. **Idempotency Guarantee:** Historical payment transaction hashes cannot be re-submitted to claim credit bundles. Every package purchase requires a newly signed, cryptographically verified payment transaction.

---

## 9. Future Pricing & Expansion Roadmap

- **Phase 1 (Current):** 30, 60, and 90 XLM Prepaid Audit Bundles live on Testnet and Mainnet.
- **Phase 2 (Q1 2027):** Automated GitHub Actions CI/CD bot consuming prepaid credits on every pull request push.
- **Phase 3 (Q2 2027):** Team & Organization Credit Pools, allowing multi-developer teams to share a unified prepaid credit balance across multiple Freighter wallets.
- **Phase 4 (Q3 2027):** Certified Auditor Multi-Sig Sign-Offs: Premium tier allowing human security researchers to review and co-sign Solace automated findings on the Stellar ledger.
