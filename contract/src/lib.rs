#![no_std]
use soroban_sdk::{
    contract, contractevent, contractimpl, contracttype, token, Address, Env, String,
};

#[contractevent]
#[derive(Clone, Debug, PartialEq)]
pub struct FeePaidEvent {
    pub user: Address,
    pub contract_hash: String,
    pub amount: i128,
}

#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub struct AuditReport {
    pub contract_hash: String,
    pub risk_score: u32,
    pub is_secure: bool,
    pub audit_type: String, // "PRE_DEPLOYMENT" or "POST_DEPLOYMENT"
    pub auditor: Address,
}

#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub struct FeePayment {
    pub user: Address,
    pub contract_hash: String,
    pub amount: i128,
    pub timestamp: u64,
}

#[contracttype]
pub enum DataKey {
    Audit(String),       // Maps contract_hash -> AuditReport
    FeePaid(String),     // Maps contract_hash -> FeePayment
    Admin,               // Address of contract admin
    Treasury,            // Address receiving the audit fees
    FeeToken,            // Token address (e.g. Native XLM SAC)
    AuditFee,            // Fee amount in stroops (i128)
    TotalFeesCollected,  // Total fees collected (i128)
    TotalAuditsPaid,     // Count of paid audits (u32)
    Initialized,         // Bool flag
}

#[contract]
pub struct SolaceContract;

#[contractimpl]
impl SolaceContract {
    /// Initialize the contract with admin, treasury recipient, payment token, and audit fee amount.
    pub fn initialize(
        env: Env,
        admin: Address,
        treasury: Address,
        fee_token: Address,
        audit_fee: i128,
    ) {
        if env.storage().instance().has(&DataKey::Initialized) {
            panic!("Contract is already initialized.");
        }
        if audit_fee < 0 {
            panic!("Audit fee cannot be negative.");
        }

        admin.require_auth();

        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::Treasury, &treasury);
        env.storage().instance().set(&DataKey::FeeToken, &fee_token);
        env.storage().instance().set(&DataKey::AuditFee, &audit_fee);
        env.storage().instance().set(&DataKey::TotalFeesCollected, &0i128);
        env.storage().instance().set(&DataKey::TotalAuditsPaid, &0u32);
        env.storage().instance().set(&DataKey::Initialized, &true);
    }

    /// Charge audit fee from the caller's wallet to the treasury.
    /// Requires authorization from `user`.
    pub fn pay_audit_fee(env: Env, user: Address, contract_hash: String) -> i128 {
        // Enforce user wallet signature / authorization
        user.require_auth();

        // Check if already paid for this contract hash
        let fee_key = DataKey::FeePaid(contract_hash.clone());
        if env.storage().persistent().has(&fee_key) {
            panic!("Audit fee already paid for this contract hash.");
        }

        let fee_amount: i128 = env
            .storage()
            .instance()
            .get(&DataKey::AuditFee)
            .unwrap_or(10_000_000i128); // Default 1 XLM (10,000,000 stroops) if uninitialized

        if fee_amount > 0 {
            let treasury: Address = env
                .storage()
                .instance()
                .get(&DataKey::Treasury)
                .unwrap_or_else(|| panic!("Treasury address not configured."));

            let fee_token: Address = env
                .storage()
                .instance()
                .get(&DataKey::FeeToken)
                .unwrap_or_else(|| panic!("Fee token address not configured."));

            // Transfer fee from user wallet to treasury using Soroban Token Client
            let token_client = token::Client::new(&env, &fee_token);
            token_client.transfer(&user, &treasury, &fee_amount);
        }

        // Record payment in persistent storage
        let timestamp = env.ledger().timestamp();
        let payment = FeePayment {
            user: user.clone(),
            contract_hash: contract_hash.clone(),
            amount: fee_amount,
            timestamp,
        };
        env.storage().persistent().set(&fee_key, &payment);

        // Update statistics
        let total_collected: i128 = env
            .storage()
            .instance()
            .get(&DataKey::TotalFeesCollected)
            .unwrap_or(0i128);
        let total_audits: u32 = env
            .storage()
            .instance()
            .get(&DataKey::TotalAuditsPaid)
            .unwrap_or(0u32);

        env.storage().instance().set(
            &DataKey::TotalFeesCollected,
            &(total_collected + fee_amount),
        );
        env.storage()
            .instance()
            .set(&DataKey::TotalAuditsPaid, &(total_audits + 1));

        // Emit fee paid event
        FeePaidEvent {
            user,
            contract_hash,
            amount: fee_amount,
        }
        .publish(&env);

        fee_amount
    }

    /// Check if the audit fee has been paid for a given contract hash.
    pub fn is_fee_paid(env: Env, contract_hash: String) -> bool {
        env.storage()
            .persistent()
            .has(&DataKey::FeePaid(contract_hash))
    }

    /// Retrieve the fee payment details for a contract hash.
    pub fn get_fee_payment(env: Env, contract_hash: String) -> FeePayment {
        let key = DataKey::FeePaid(contract_hash);
        env.storage()
            .persistent()
            .get(&key)
            .unwrap_or_else(|| panic!("Fee payment record not found."))
    }

    /// Retrieve current audit fee configured on the contract.
    pub fn get_audit_fee(env: Env) -> i128 {
        env.storage()
            .instance()
            .get(&DataKey::AuditFee)
            .unwrap_or(10_000_000i128)
    }

    /// Retrieve treasury address.
    pub fn get_treasury(env: Env) -> Address {
        env.storage()
            .instance()
            .get(&DataKey::Treasury)
            .unwrap_or_else(|| panic!("Treasury not configured."))
    }

    /// Retrieve fee token address.
    pub fn get_fee_token(env: Env) -> Address {
        env.storage()
            .instance()
            .get(&DataKey::FeeToken)
            .unwrap_or_else(|| panic!("Fee token not configured."))
    }

    /// Retrieve total fees collected and total paid audits.
    pub fn get_fee_stats(env: Env) -> (i128, u32) {
        let total_collected: i128 = env
            .storage()
            .instance()
            .get(&DataKey::TotalFeesCollected)
            .unwrap_or(0i128);
        let total_audits: u32 = env
            .storage()
            .instance()
            .get(&DataKey::TotalAuditsPaid)
            .unwrap_or(0u32);
        (total_collected, total_audits)
    }

    /// Admin setter: Update the audit fee amount.
    pub fn set_audit_fee(env: Env, admin: Address, new_fee: i128) {
        admin.require_auth();
        let current_admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .unwrap_or_else(|| panic!("Admin not configured."));

        if admin != current_admin {
            panic!("Unauthorized: Caller is not the contract admin.");
        }
        if new_fee < 0 {
            panic!("Audit fee cannot be negative.");
        }

        env.storage().instance().set(&DataKey::AuditFee, &new_fee);
    }

    /// Admin setter: Update treasury address.
    pub fn set_treasury(env: Env, admin: Address, new_treasury: Address) {
        admin.require_auth();
        let current_admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .unwrap_or_else(|| panic!("Admin not configured."));

        if admin != current_admin {
            panic!("Unauthorized: Caller is not the contract admin.");
        }

        env.storage()
            .instance()
            .set(&DataKey::Treasury, &new_treasury);
    }

    /// Admin setter: Update fee token contract address.
    pub fn set_fee_token(env: Env, admin: Address, new_fee_token: Address) {
        admin.require_auth();
        let current_admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .unwrap_or_else(|| panic!("Admin not configured."));

        if admin != current_admin {
            panic!("Unauthorized: Caller is not the contract admin.");
        }

        env.storage()
            .instance()
            .set(&DataKey::FeeToken, &new_fee_token);
    }

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

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::{
        testutils::Address as _,
        token, Env, String,
    };

    #[test]
    fn test_audit_fee_payment_and_record() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register(SolaceContract, ());
        let client = SolaceContractClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        let treasury = Address::generate(&env);
        let user = Address::generate(&env);
        let auditor = Address::generate(&env);

        let token_admin = Address::generate(&env);
        let token_id = env.register_stellar_asset_contract_v2(token_admin.clone());
        let token_client = token::Client::new(&env, &token_id.address());
        let token_admin_client = token::StellarAssetClient::new(&env, &token_id.address());

        token_admin_client.mint(&user, &100_000_000);

        let fee: i128 = 10_000_000; // 1 XLM
        client.initialize(&admin, &treasury, &token_id.address(), &fee);

        assert_eq!(client.get_audit_fee(), fee);
        assert_eq!(client.get_treasury(), treasury);
        assert_eq!(client.get_fee_token(), token_id.address());

        let contract_hash = String::from_str(&env, "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");

        assert_eq!(client.is_fee_paid(&contract_hash), false);

        // Pay audit fee
        let paid = client.pay_audit_fee(&user, &contract_hash);
        assert_eq!(paid, fee);
        assert_eq!(client.is_fee_paid(&contract_hash), true);

        // Check balances: treasury should have received the fee, user deducted
        assert_eq!(token_client.balance(&treasury), fee);
        assert_eq!(token_client.balance(&user), 90_000_000);

        // Check payment info
        let payment = client.get_fee_payment(&contract_hash);
        assert_eq!(payment.user, user);
        assert_eq!(payment.amount, fee);

        // Check stats
        let stats = client.get_fee_stats();
        assert_eq!(stats.0, fee);
        assert_eq!(stats.1, 1);

        // Record audit
        let audit_type = String::from_str(&env, "PRE_DEPLOYMENT");
        client.record_audit(&auditor, &contract_hash, &92, &true, &audit_type);

        let report = client.get_audit(&contract_hash);
        assert_eq!(report.risk_score, 92);
        assert_eq!(report.is_secure, true);
    }
}
