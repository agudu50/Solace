# Solace Platform - Administrator Provisioning & Governance Guide

This document details the authorized procedures for provisioning administrators, managing elevated role permissions, and governing administrative access on the **Solace Soroban Security Auditing Platform**.

---

## 1. Zero Trust & Security Principles

1. **No Email/Password Authentication Anywhere**:
   - There are no passwords, reset links, email tokens, or alternate authentication pathways.
   - All access requires cryptographic wallet signature verification (Ed25519) on Stellar Testnet (Protocol 22).

2. **No Public "Become Admin" Endpoints**:
   - Administrative roles can **never** be requested, purchased, or toggled from the frontend.
   - Connecting a wallet to the platform always registers the user with a sandboxed `'user'` role by default.

3. **Server-Side Role Authorization**:
   - Every protected API endpoint (`/api/admin/*`) independently checks the cryptographically verified session token in the database against the user's role on the backend.
   - Frontend route gating is strictly a user-experience layer; access control is 100% enforced server-side.

4. **Immutable Administrative Audit Trail**:
   - Every role change, account status toggle, and audit credit adjustment is written to the `audit_logs` table with the acting operator's wallet, timestamp, and metadata.

---

## 2. Currently Provisioned Administrators

The following Stellar wallet addresses are provisioned with elevated administrative roles on Solace:

| Wallet Address | Role | Status | Notes |
| :--- | :--- | :--- | :--- |
| `GBWSB2OVP5JIWGJND5C46TAIM7AQH5YJ56576CGOPG3AXAFNHO7FDYPI` | `super_admin` | `active` | Initial Platform Bootstrap & Protocol Deployer Keypair |
| `GABQOWDBI5MX6QYKP4JLB3PWJKVI7IXTQCNESBVSUK3SUUR2S3AEKAJX` | `admin` | `active` | Operator Administrator Wallet |
| `GD5NJEVHQMLEDB25UP4C5JSOXCQWHILTE3XQY2EMM657Y3GDDKLHYH7X` | `admin` | `active` | Operator Administrator Wallet |

---

## 3. Provisioning a New Administrator

To grant administrative privileges to a new or existing Stellar wallet, run the secure provisioning CLI script in the backend server environment.

### Syntax:
```bash
# Navigate to the server directory
cd server

# Provision a wallet as standard administrator
npm run provision-admin -- <STELLAR_WALLET_ADDRESS>

# Provision a wallet with a specific role (admin or super_admin)
node src/scripts/provisionAdmin.js <STELLAR_WALLET_ADDRESS> --role super_admin
```

### Example:
```bash
node src/scripts/provisionAdmin.js GABQOWDBI5MX6QYKP4JLB3PWJKVI7IXTQCNESBVSUK3SUUR2S3AEKAJX --role admin
```

### Provisioning Behavior:
- **Input Validation**: Verifies that the string is a valid 56-character Stellar public key starting with `G`.
- **Idempotent**: If the wallet already exists, its role is safely elevated without duplicate user records or resetting other account attributes.
- **Audit Logged**: An audit entry `PROVISION_ADMIN_WALLET` is automatically appended to the immutable audit trail.

---

## 4. Administrator Authentication Flow

1. Navigate to the dedicated **Administrator Gate**:
   ```
   http://localhost:3000/admin/login
   ```
2. Click **Authenticate Admin Wallet**.
3. The platform requests an authentication challenge from `POST /api/auth/challenge` containing a unique 256-bit cryptographic nonce, application domain, recipient wallet address, and 5-minute expiration.
4. The Freighter wallet popup appears asking the operator to sign the challenge text (non-custodial, zero private key exposure).
5. The frontend submits the signed challenge to `POST /api/auth/verify`.
6. The backend verifies:
   - Challenge ID exists and is unconsumed (`used = false`).
   - Challenge has not expired (`now < expires_at`).
   - Intended domain matches the server configuration.
   - Ed25519 cryptographic signature verifies against the submitted wallet public key.
   - User account exists and possesses role `'admin'` or `'super_admin'`.
7. An HTTP-only secure cookie and verified JWT session token are issued.
8. The operator is automatically redirected to the **Protected Administrative Dashboard** (`/admin`).

---

## 5. Revoking Administrator Privileges

If an administrator wallet is compromised or no longer authorized:

### Option A: Via the Admin Dashboard (`/admin`)
1. Log into `/admin` with an active `super_admin` wallet.
2. Under **Registered User Management**, locate the wallet address.
3. Select **Demote to User** or **Suspend Account**.
4. The user's role is updated in the database, and any active sessions are invalidated immediately.

### Option B: Via Direct Database / Script
Run the provisioning script with the target role updated or downgrade the user in PostgreSQL:
```sql
UPDATE users 
SET role = 'user', updated_at = NOW() 
WHERE wallet_address = '<COMPROMISED_WALLET>';
```
