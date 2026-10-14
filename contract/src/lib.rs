#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, String};

#[contracttype]
#[derive(Clone)]
pub struct AuditReport {
    pub contract_hash: String,
    pub risk_score: u32,
    pub is_secure: bool,
    pub audit_type: String, // "PRE_DEPLOYMENT" or "POST_DEPLOYMENT"
    pub auditor: Address,
}

#[contracttype]
pub enum DataKey {
    Audit(String), // Maps contract_hash -> AuditReport
}

#[contract]
pub struct SolaceContract;

#[contractimpl]
impl SolaceContract {
    /// Record an AI audit report (Pre or Post deployment) on the Stellar ledger.
    /// Requires authorization from the designated auditor address.
    pub fn record_audit(
        env: Env,
        auditor: Address,
        contract_hash: String,
        risk_score: u32,
        is_secure: bool,
        audit_type: String,
    ) {
        // Ensure the caller actually signed/authorized this transaction
        auditor.require_auth();

        let report = AuditReport {
            contract_hash: contract_hash.clone(),
            risk_score,
            is_secure,
            audit_type,
            auditor,
        };

        // Store the report using persistent storage (crucial for Soroban state management & rent)
        env.storage().persistent().set(&DataKey::Audit(contract_hash), &report);
    }

    /// Retrieve an audit report by its contract hash
    pub fn get_audit(env: Env, contract_hash: String) -> AuditReport {
        let key = DataKey::Audit(contract_hash);
        env.storage()
            .persistent()
            .get(&key)
            .unwrap_or_else(|| panic!("Audit report not found for this contract hash."))
    }
}
