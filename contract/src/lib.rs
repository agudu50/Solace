#![no_std]
use soroban_sdk::{
    contract, contractevent, contractimpl, contracttype, token, Address, Env, String,
};

// ============================================================================
// Events
// ============================================================================

#[contractevent]
#[derive(Clone, Debug, PartialEq)]
pub struct FeePaidEvent {
    pub user: Address,
    pub contract_hash: String,
    pub amount: i128,
}

#[contractevent]
#[derive(Clone, Debug, PartialEq)]
pub struct CreditsPurchasedEvent {
    pub user: Address,
    pub package_id: u32,
    pub amount: i128,
    pub credits_granted: u32,
    pub total_available: u32,
}

#[contractevent]
#[derive(Clone, Debug, PartialEq)]
pub struct CreditConsumedEvent {
    pub user: Address,
    pub contract_hash: String,
    pub remaining_credits: u32,
}

// ============================================================================
// Data Types
// ============================================================================

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

/// User credit balance ledger record.
/// Credits do not expire; new purchases accumulate onto existing available credits.
#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub struct UserCreditBalance {
    pub available_credits: u32,
    pub total_purchased: u32,
    pub total_consumed: u32,
    pub last_purchase_timestamp: u64,
}

/// On-chain receipt for a purchased package bundle.
#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub struct CreditPurchaseRecord {
    pub user: Address,
    pub package_id: u32,
    pub amount_stroops: i128,
    pub credits_granted: u32,
    pub timestamp: u64,
}

/// On-chain receipt linking an audited contract hash to the consumed credit.
#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub struct CreditConsumptionRecord {
    pub user: Address,
    pub contract_hash: String,
    pub timestamp: u64,
}

// ============================================================================
// Storage DataKeys
// ============================================================================

#[contracttype]
pub enum DataKey {
    Audit(String),                // Maps contract_hash -> AuditReport
    FeePaid(String),              // Legacy Maps contract_hash -> FeePayment
    Admin,                        // Address of contract admin
    Treasury,                     // Address receiving the audit & package fees
    FeeToken,                     // Token address (e.g. Native XLM SAC)
    AuditFee,                     // Legacy per-audit fee amount in stroops (i128)
    TotalFeesCollected,           // Total fees collected in stroops (i128)
    TotalAuditsPaid,              // Legacy count of paid audits (u32)
    Initialized,                  // Bool flag
    UserCredits(Address),         // Maps user Address -> UserCreditBalance
    CreditPurchase(Address, u32), // Maps (user, purchase_index) -> CreditPurchaseRecord
    CreditPurchaseCount(Address), // Total number of purchases made by user (u32)
    CreditAudit(String),          // Maps contract_hash -> CreditConsumptionRecord
    TotalCreditsGranted,          // Global count of all credits purchased (u32)
    TotalCreditsConsumed,         // Global count of all credits redeemed (u32)
}

// ============================================================================
// Package Constants (in 10,000,000 stroops per 1 XLM)
// ============================================================================
// Package 1 (Starter):      30 XLM -> 3 audits (10 XLM/audit)
// Package 2 (Growth):       60 XLM -> 6 audits (10 XLM/audit)
// Package 3 (Professional): 90 XLM -> 9 audits (10 XLM/audit)
const STARTER_PRICE_STROOPS: i128 = 300_000_000;
const STARTER_CREDITS: u32 = 3;

const GROWTH_PRICE_STROOPS: i128 = 600_000_000;
const GROWTH_CREDITS: u32 = 6;

const PRO_PRICE_STROOPS: i128 = 900_000_000;
const PRO_CREDITS: u32 = 9;

// ============================================================================
// Contract Implementation
// ============================================================================

#[contract]
pub struct SolaceContract;

#[contractimpl]
impl SolaceContract {
    /// Initialize the contract with admin, treasury recipient, payment token, and default audit fee amount.
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
        env.storage().instance().set(&DataKey::TotalCreditsGranted, &0u32);
        env.storage().instance().set(&DataKey::TotalCreditsConsumed, &0u32);
        env.storage().instance().set(&DataKey::Initialized, &true);
    }

    // ========================================================================
    // Credit-Based Subscription Packages (30, 60, 90 XLM)
    // ========================================================================

    /// Retrieve package price (in stroops) and included audit credits.
    /// package_id: 1 (Starter - 30 XLM / 3 audits), 2 (Growth - 60 XLM / 6 audits), 3 (Professional - 90 XLM / 9 audits).
    pub fn get_package_info(_env: Env, package_id: u32) -> (i128, u32) {
        match package_id {
            1 => (STARTER_PRICE_STROOPS, STARTER_CREDITS),
            2 => (GROWTH_PRICE_STROOPS, GROWTH_CREDITS),
            3 => (PRO_PRICE_STROOPS, PRO_CREDITS),
            _ => panic!("Invalid package ID. Valid packages: 1 (Starter), 2 (Growth), 3 (Professional)."),
        }
    }

    /// Purchase a prepaid audit credit bundle upfront.
    /// package_id:
    /// - 1: Starter      (30 XLM -> 3 audits)
    /// - 2: Growth       (60 XLM -> 6 audits)
    /// - 3: Professional (90 XLM -> 9 audits)
    ///
    /// Credits NEVER expire and accumulate with any previously purchased unused credits.
    pub fn purchase_credits(env: Env, user: Address, package_id: u32) -> u32 {
        // Enforce user wallet signature / authorization
        user.require_auth();

        let (price_stroops, credits_granted) = match package_id {
            1 => (STARTER_PRICE_STROOPS, STARTER_CREDITS),
            2 => (GROWTH_PRICE_STROOPS, GROWTH_CREDITS),
            3 => (PRO_PRICE_STROOPS, PRO_CREDITS),
            _ => panic!("Invalid package ID. Must be 1 (Starter: 30 XLM), 2 (Growth: 60 XLM), or 3 (Professional: 90 XLM)."),
        };

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

        // Transfer XLM tokens from user's wallet to treasury using Soroban Token Client
        let token_client = token::Client::new(&env, &fee_token);
        token_client.transfer(&user, &treasury, &price_stroops);

        // Fetch existing credit balance or initialize zero balance
        let user_key = DataKey::UserCredits(user.clone());
        let mut balance: UserCreditBalance = env
            .storage()
            .persistent()
            .get(&user_key)
            .unwrap_or(UserCreditBalance {
                available_credits: 0,
                total_purchased: 0,
                total_consumed: 0,
                last_purchase_timestamp: 0,
            });

        // Add purchased credits onto existing available balance (accumulative, non-expiring)
        balance.available_credits += credits_granted;
        balance.total_purchased += credits_granted;
        balance.last_purchase_timestamp = env.ledger().timestamp();
        env.storage().persistent().set(&user_key, &balance);

        // Record individual purchase in user's on-chain purchase history
        let count_key = DataKey::CreditPurchaseCount(user.clone());
        let purchase_index: u32 = env.storage().persistent().get(&count_key).unwrap_or(0u32);
        let record = CreditPurchaseRecord {
            user: user.clone(),
            package_id,
            amount_stroops: price_stroops,
            credits_granted,
            timestamp: env.ledger().timestamp(),
        };
        env.storage().persistent().set(&DataKey::CreditPurchase(user.clone(), purchase_index), &record);
        env.storage().persistent().set(&count_key, &(purchase_index + 1));

        // Update global protocol statistics
        let total_collected: i128 = env
            .storage()
            .instance()
            .get(&DataKey::TotalFeesCollected)
            .unwrap_or(0i128);
        env.storage()
            .instance()
            .set(&DataKey::TotalFeesCollected, &(total_collected + price_stroops));

        let total_granted: u32 = env
            .storage()
            .instance()
            .get(&DataKey::TotalCreditsGranted)
            .unwrap_or(0u32);
        env.storage()
            .instance()
            .set(&DataKey::TotalCreditsGranted, &(total_granted + credits_granted));

        // Emit on-chain event
        CreditsPurchasedEvent {
            user,
            package_id,
            amount: price_stroops,
            credits_granted,
            total_available: balance.available_credits,
        }
        .publish(&env);

        balance.available_credits
    }

    /// Consume exactly 1 audit credit to initiate an on-chain smart contract security audit.
    /// Deducts 1 credit from the user's available balance and links it to `contract_hash`.
    /// Idempotent: If this contract hash was already debited for this user, it will not deduct again.
    pub fn consume_credit(env: Env, user: Address, contract_hash: String) -> u32 {
        user.require_auth();

        // Check if this contract was already credited/audited
        let audit_credit_key = DataKey::CreditAudit(contract_hash.clone());
        if env.storage().persistent().has(&audit_credit_key) {
            let balance = Self::get_user_credits(env, user);
            return balance.available_credits;
        }

        let user_key = DataKey::UserCredits(user.clone());
        let mut balance: UserCreditBalance = env
            .storage()
            .persistent()
            .get(&user_key)
            .unwrap_or(UserCreditBalance {
                available_credits: 0,
                total_purchased: 0,
                total_consumed: 0,
                last_purchase_timestamp: 0,
            });

        if balance.available_credits == 0 {
            panic!("Insufficient audit credits. Please purchase a prepaid credit bundle.");
        }

        balance.available_credits -= 1;
        balance.total_consumed += 1;
        env.storage().persistent().set(&user_key, &balance);

        // Record consumption linkage
        let record = CreditConsumptionRecord {
            user: user.clone(),
            contract_hash: contract_hash.clone(),
            timestamp: env.ledger().timestamp(),
        };
        env.storage().persistent().set(&audit_credit_key, &record);

        // Also record legacy FeePaid key so backward-compatible queries succeed
        let legacy_payment = FeePayment {
            user: user.clone(),
            contract_hash: contract_hash.clone(),
            amount: 0,
            timestamp: env.ledger().timestamp(),
        };
        env.storage().persistent().set(&DataKey::FeePaid(contract_hash.clone()), &legacy_payment);

        // Update global stats
        let total_consumed: u32 = env
            .storage()
            .instance()
            .get(&DataKey::TotalCreditsConsumed)
            .unwrap_or(0u32);
        env.storage()
            .instance()
            .set(&DataKey::TotalCreditsConsumed, &(total_consumed + 1));

        // Emit consumption event
        CreditConsumedEvent {
            user,
            contract_hash,
            remaining_credits: balance.available_credits,
        }
        .publish(&env);

        balance.available_credits
    }

    /// Retrieve the authoritative credit balance for a given wallet address.
    pub fn get_user_credits(env: Env, user: Address) -> UserCreditBalance {
        env.storage()
            .persistent()
            .get(&DataKey::UserCredits(user))
            .unwrap_or(UserCreditBalance {
                available_credits: 0,
                total_purchased: 0,
                total_consumed: 0,
                last_purchase_timestamp: 0,
            })
    }

    /// Check if a user has at least one credit available to audit.
    pub fn has_credits(env: Env, user: Address) -> bool {
        let balance = Self::get_user_credits(env, user);
        balance.available_credits > 0
    }

    /// Retrieve total purchases count for a user.
    pub fn get_user_purchase_count(env: Env, user: Address) -> u32 {
        env.storage()
            .persistent()
            .get(&DataKey::CreditPurchaseCount(user))
            .unwrap_or(0u32)
    }

    /// Retrieve a specific purchase record by index.
    pub fn get_user_purchase(env: Env, user: Address, index: u32) -> CreditPurchaseRecord {
        env.storage()
            .persistent()
            .get(&DataKey::CreditPurchase(user, index))
            .unwrap_or_else(|| panic!("Credit purchase record not found."))
    }

    /// Retrieve global protocol stats: (total_fees_collected, total_credits_granted, total_credits_consumed).
    pub fn get_credit_stats(env: Env) -> (i128, u32, u32) {
        let total_collected: i128 = env
            .storage()
            .instance()
            .get(&DataKey::TotalFeesCollected)
            .unwrap_or(0i128);
        let total_granted: u32 = env
            .storage()
            .instance()
            .get(&DataKey::TotalCreditsGranted)
            .unwrap_or(0u32);
        let total_consumed: u32 = env
            .storage()
            .instance()
            .get(&DataKey::TotalCreditsConsumed)
            .unwrap_or(0u32);
        (total_collected, total_granted, total_consumed)
    }

    // ========================================================================
    // Backward-Compatible Per-Audit Payment & Storage APIs
    // ========================================================================

    /// Charge legacy audit fee from caller's wallet to treasury (retained for backward compatibility).
    pub fn pay_audit_fee(env: Env, user: Address, contract_hash: String) -> i128 {
        user.require_auth();

        let fee_key = DataKey::FeePaid(contract_hash.clone());
        if env.storage().persistent().has(&fee_key) {
            panic!("Audit fee already paid for this contract hash.");
        }

        let fee_amount: i128 = env
            .storage()
            .instance()
            .get(&DataKey::AuditFee)
            .unwrap_or(10_000_000i128);

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

            let token_client = token::Client::new(&env, &fee_token);
            token_client.transfer(&user, &treasury, &fee_amount);
        }

        let timestamp = env.ledger().timestamp();
        let payment = FeePayment {
            user: user.clone(),
            contract_hash: contract_hash.clone(),
            amount: fee_amount,
            timestamp,
        };
        env.storage().persistent().set(&fee_key, &payment);

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

        FeePaidEvent {
            user,
            contract_hash,
            amount: fee_amount,
        }
        .publish(&env);

        fee_amount
    }

    pub fn is_fee_paid(env: Env, contract_hash: String) -> bool {
        env.storage()
            .persistent()
            .has(&DataKey::FeePaid(contract_hash))
    }

    pub fn get_fee_payment(env: Env, contract_hash: String) -> FeePayment {
        let key = DataKey::FeePaid(contract_hash);
        env.storage()
            .persistent()
            .get(&key)
            .unwrap_or_else(|| panic!("Fee payment record not found."))
    }

    pub fn get_audit_fee(env: Env) -> i128 {
        env.storage()
            .instance()
            .get(&DataKey::AuditFee)
            .unwrap_or(10_000_000i128)
    }

    pub fn get_treasury(env: Env) -> Address {
        env.storage()
            .instance()
            .get(&DataKey::Treasury)
            .unwrap_or_else(|| panic!("Treasury not configured."))
    }

    pub fn get_fee_token(env: Env) -> Address {
        env.storage()
            .instance()
            .get(&DataKey::FeeToken)
            .unwrap_or_else(|| panic!("Fee token not configured."))
    }

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

    // ========================================================================
    // Audit Inscription Engine
    // ========================================================================

    /// Record an AI audit report (Pre or Post deployment) on the Stellar ledger.
    pub fn record_audit(
        env: Env,
        auditor: Address,
        contract_hash: String,
        risk_score: u32,
        is_secure: bool,
        audit_type: String,
    ) {
        auditor.require_auth();

        let report = AuditReport {
            contract_hash: contract_hash.clone(),
            risk_score,
            is_secure,
            audit_type,
            auditor,
        };

        env.storage().persistent().set(&DataKey::Audit(contract_hash), &report);
    }

    /// Retrieve an audit report by its contract hash.
    pub fn get_audit(env: Env, contract_hash: String) -> AuditReport {
        let key = DataKey::Audit(contract_hash);
        env.storage()
            .persistent()
            .get(&key)
            .unwrap_or_else(|| panic!("Audit report not found for this contract hash."))
    }
}

// ============================================================================
// Unit Tests
// ============================================================================

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::{
        testutils::Address as _,
        token, Env, String,
    };

    fn setup_test_contract<'a>(
        env: &'a Env,
    ) -> (
        SolaceContractClient<'a>,
        Address,
        Address,
        Address,
        token::Client<'a>,
        token::StellarAssetClient<'a>,
    ) {
        let contract_id = env.register(SolaceContract, ());
        let client = SolaceContractClient::new(env, &contract_id);

        let admin = Address::generate(env);
        let treasury = Address::generate(env);
        let user = Address::generate(env);

        let token_admin = Address::generate(env);
        let token_id = env.register_stellar_asset_contract_v2(token_admin.clone());
        let token_client = token::Client::new(env, &token_id.address());
        let token_admin_client = token::StellarAssetClient::new(env, &token_id.address());

        let fee: i128 = 10_000_000; // 1 XLM default
        client.initialize(&admin, &treasury, &token_id.address(), &fee);

        (client, admin, treasury, user, token_client, token_admin_client)
    }

    #[test]
    fn test_package_info_queries() {
        let env = Env::default();
        env.mock_all_auths();
        let (client, _, _, _, _, _) = setup_test_contract(&env);

        // Starter: 30 XLM (300,000,000 stroops), 3 credits
        let pkg1 = client.get_package_info(&1);
        assert_eq!(pkg1.0, 300_000_000);
        assert_eq!(pkg1.1, 3);

        // Growth: 60 XLM (600,000,000 stroops), 6 credits
        let pkg2 = client.get_package_info(&2);
        assert_eq!(pkg2.0, 600_000_000);
        assert_eq!(pkg2.1, 6);

        // Professional: 90 XLM (900,000,000 stroops), 9 credits
        let pkg3 = client.get_package_info(&3);
        assert_eq!(pkg3.0, 900_000_000);
        assert_eq!(pkg3.1, 9);
    }

    #[test]
    fn test_credit_purchase_and_accumulation() {
        let env = Env::default();
        env.mock_all_auths();

        let (client, _, treasury, user, token_client, token_admin_client) =
            setup_test_contract(&env);

        // Mint 200 XLM (2,000,000,000 stroops) to user
        token_admin_client.mint(&user, &2_000_000_000);

        // Initial balance should be 0 credits
        assert_eq!(client.has_credits(&user), false);
        let initial_balance = client.get_user_credits(&user);
        assert_eq!(initial_balance.available_credits, 0);

        // 1. Purchase Starter Package (30 XLM -> 3 credits)
        let credits_after_p1 = client.purchase_credits(&user, &1);
        assert_eq!(credits_after_p1, 3);
        assert_eq!(client.has_credits(&user), true);
        assert_eq!(token_client.balance(&treasury), 300_000_000);
        assert_eq!(token_client.balance(&user), 1_700_000_000);

        // 2. User purchases Growth Package (60 XLM -> 6 credits)
        // Must ACCUMULATE on top of existing 3 credits => 3 + 6 = 9 credits!
        let credits_after_p2 = client.purchase_credits(&user, &2);
        assert_eq!(credits_after_p2, 9);

        let bal = client.get_user_credits(&user);
        assert_eq!(bal.available_credits, 9);
        assert_eq!(bal.total_purchased, 9);
        assert_eq!(bal.total_consumed, 0);

        // Check user purchase history
        assert_eq!(client.get_user_purchase_count(&user), 2);
        let rec1 = client.get_user_purchase(&user, &0);
        assert_eq!(rec1.package_id, 1);
        assert_eq!(rec1.credits_granted, 3);
        assert_eq!(rec1.amount_stroops, 300_000_000);

        let rec2 = client.get_user_purchase(&user, &1);
        assert_eq!(rec2.package_id, 2);
        assert_eq!(rec2.credits_granted, 6);
        assert_eq!(rec2.amount_stroops, 600_000_000);

        // Total treasury balance: 30 + 60 = 90 XLM (900,000,000 stroops)
        assert_eq!(token_client.balance(&treasury), 900_000_000);
    }

    #[test]
    fn test_credit_consumption_lifecycle() {
        let env = Env::default();
        env.mock_all_auths();

        let (client, _, _, user, _, token_admin_client) = setup_test_contract(&env);

        // Mint and purchase Starter package (3 credits)
        token_admin_client.mint(&user, &500_000_000);
        client.purchase_credits(&user, &1);

        let hash_1 = String::from_str(&env, "hash_contract_vault_001");
        let hash_2 = String::from_str(&env, "hash_contract_vault_002");
        let hash_3 = String::from_str(&env, "hash_contract_vault_003");

        // Consume Credit 1 for Audit 1
        let rem1 = client.consume_credit(&user, &hash_1);
        assert_eq!(rem1, 2);

        // Consume Credit 2 for Audit 2
        let rem2 = client.consume_credit(&user, &hash_2);
        assert_eq!(rem2, 1);

        // Idempotency: Re-submitting hash_2 should NOT consume another credit
        let rem2_dup = client.consume_credit(&user, &hash_2);
        assert_eq!(rem2_dup, 1);

        // Consume Credit 3 for Audit 3
        let rem3 = client.consume_credit(&user, &hash_3);
        assert_eq!(rem3, 0);
        assert_eq!(client.has_credits(&user), false);

        let final_balance = client.get_user_credits(&user);
        assert_eq!(final_balance.available_credits, 0);
        assert_eq!(final_balance.total_consumed, 3);
        assert_eq!(final_balance.total_purchased, 3);

        // Check global protocol stats
        let stats = client.get_credit_stats();
        assert_eq!(stats.0, 300_000_000); // 30 XLM collected
        assert_eq!(stats.1, 3);           // 3 credits granted
        assert_eq!(stats.2, 3);           // 3 credits consumed
    }

    #[test]
    #[should_panic(expected = "Insufficient audit credits")]
    fn test_cannot_consume_with_zero_credits() {
        let env = Env::default();
        env.mock_all_auths();

        let (client, _, _, user, _, _) = setup_test_contract(&env);
        let contract_hash = String::from_str(&env, "unfunded_contract_hash");

        // User has 0 credits - must panic with informative error
        client.consume_credit(&user, &contract_hash);
    }

    #[test]
    #[should_panic(expected = "Invalid package ID")]
    fn test_invalid_package_id_panics() {
        let env = Env::default();
        env.mock_all_auths();

        let (client, _, _, user, _, token_admin_client) = setup_test_contract(&env);
        token_admin_client.mint(&user, &500_000_000);

        // Invalid package 999 must panic
        client.purchase_credits(&user, &999);
    }

    #[test]
    fn test_legacy_audit_fee_and_record_compatibility() {
        let env = Env::default();
        env.mock_all_auths();

        let (client, _, treasury, user, token_client, token_admin_client) =
            setup_test_contract(&env);

        let auditor = Address::generate(&env);
        token_admin_client.mint(&user, &100_000_000);

        let fee: i128 = 10_000_000;
        let contract_hash = String::from_str(&env, "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");

        assert_eq!(client.is_fee_paid(&contract_hash), false);

        // Legacy pay fee works
        let paid = client.pay_audit_fee(&user, &contract_hash);
        assert_eq!(paid, fee);
        assert_eq!(client.is_fee_paid(&contract_hash), true);
        assert_eq!(token_client.balance(&treasury), fee);

        // Inscribe audit
        let audit_type = String::from_str(&env, "PRE_DEPLOYMENT");
        client.record_audit(&auditor, &contract_hash, &95, &true, &audit_type);

        let report = client.get_audit(&contract_hash);
        assert_eq!(report.risk_score, 95);
        assert_eq!(report.is_secure, true);
    }
}
