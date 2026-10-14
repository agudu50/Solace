export const NAV_LINKS = [
  { href: '/', label: 'Audit Studio' },
  { href: '/reports', label: 'Verified Reports' },
  { href: '/monitor', label: 'Live Monitor' },
];

export const SAMPLE_SOROBAN_CONTRACT = `// Solace Sample Soroban Smart Contract
#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, String, symbol_short};

#[contracttype]
pub enum DataKey {
    Admin,
    Balance(Address),
}

#[contract]
pub struct VaultContract;

#[contractimpl]
impl VaultContract {
    pub fn init(env: Env, admin: Address) {
        // Vulnerability: Missing check if admin is already initialized!
        env.storage().instance().set(&DataKey::Admin, &admin);
    }

    pub fn deposit(env: Env, from: Address, amount: i128) {
        from.require_auth();
        let current: i128 = env.storage().instance().get(&DataKey::Balance(from.clone())).unwrap_or(0);
        env.storage().instance().set(&DataKey::Balance(from), &(current + amount));
    }

    pub fn withdraw(env: Env, to: Address, amount: i128) {
        // Vulnerability: Missing to.require_auth() or admin authorization check!
        let current: i128 = env.storage().instance().get(&DataKey::Balance(to.clone())).unwrap_or(0);
        if current < amount {
            panic!("insufficient funds");
        }
        env.storage().instance().set(&DataKey::Balance(to), &(current - amount));
    }
}
`;
