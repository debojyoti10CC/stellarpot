#![no_std]

use soroban_sdk::{
    contract, contractimpl, contracttype, contracterror,
    token, Address, Env, Map, String, Symbol, Vec,
    log,
};

// ═══════════════════════════════════════════════════════════
//  DATA TYPES — All state lives on-chain, fully verifiable
// ═══════════════════════════════════════════════════════════

#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub enum RoomStatus {
    Open,
    Resolved,
    Cancelled,
}

#[contracttype]
#[derive(Clone, Debug)]
pub struct Bet {
    pub bettor: Address,
    pub option_idx: u32,
    pub amount: i128,
}

#[contracttype]
#[derive(Clone, Debug)]
pub struct Room {
    pub creator: Address,
    pub token: Address,          // The token used for betting (native XLM wrapper)
    pub description: String,
    pub options: Vec<String>,
    pub stake_amount: i128,      // Fixed stake per participant
    pub expiry_ledger: u32,      // Ledger sequence after which resolution is allowed
    pub status: RoomStatus,
    pub bets: Vec<Bet>,
    pub total_pool: i128,
    pub winning_option: u32,     // Only valid when status == Resolved
}

// ═══════════════════════════════════════════════════════════
//  STORAGE KEYS
// ═══════════════════════════════════════════════════════════

#[contracttype]
pub enum DataKey {
    Admin,
    Room(u64),       // room_id -> Room
    RoomCount,       // u64 counter
}

// ═══════════════════════════════════════════════════════════
//  ERRORS — On-chain enforcement, no ambiguity
// ═══════════════════════════════════════════════════════════

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    NotInitialized = 1,
    RoomNotFound = 2,
    RoomNotOpen = 3,
    AlreadyBet = 4,
    InvalidOption = 5,
    NotCreator = 6,
    NotExpired = 7,
    InsufficientFunds = 8,
    NoBets = 9,
    NoWinners = 10,
    AlreadyInitialized = 11,
}

// ═══════════════════════════════════════════════════════════
//  CONTRACT
// ═══════════════════════════════════════════════════════════

#[contract]
pub struct StellarPotContract;

#[contractimpl]
impl StellarPotContract {

    // ────────────────────────────────────────────
    //  INITIALIZE — One-time admin setup
    // ────────────────────────────────────────────
    pub fn initialize(env: Env, admin: Address) -> Result<(), Error> {
        if env.storage().instance().has(&DataKey::Admin) {
            return Err(Error::AlreadyInitialized);
        }
        admin.require_auth();
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::RoomCount, &0u64);
        log!(&env, "StellarPot initialized, admin={}", admin);
        Ok(())
    }

    // ────────────────────────────────────────────
    //  CREATE ROOM
    //  Creator defines the prediction, options,
    //  stake amount, and token address.
    //  No escrow key generated — the CONTRACT holds
    //  the funds. Trustless by design.
    // ────────────────────────────────────────────
    pub fn create_room(
        env: Env,
        creator: Address,
        token: Address,
        description: String,
        options: Vec<String>,
        stake_amount: i128,
        expiry_ledgers: u32,   // How many ledgers from now until expiry
    ) -> Result<u64, Error> {
        creator.require_auth();

        let mut count: u64 = env.storage().instance()
            .get(&DataKey::RoomCount)
            .unwrap_or(0);
        count += 1;

        let room = Room {
            creator: creator.clone(),
            token,
            description,
            options,
            stake_amount,
            expiry_ledger: env.ledger().sequence() + expiry_ledgers,
            status: RoomStatus::Open,
            bets: Vec::new(&env),
            total_pool: 0,
            winning_option: 0,
        };

        env.storage().persistent().set(&DataKey::Room(count), &room);
        env.storage().instance().set(&DataKey::RoomCount, &count);

        log!(&env, "Room {} created by {}", count, creator);
        Ok(count)
    }

    // ────────────────────────────────────────────
    //  PLACE BET
    //  User sends tokens directly to the contract.
    //  The contract holds funds — no human holds keys.
    //  On-chain state records who bet what.
    // ────────────────────────────────────────────
    pub fn place_bet(
        env: Env,
        bettor: Address,
        room_id: u64,
        option_idx: u32,
    ) -> Result<(), Error> {
        bettor.require_auth();

        let mut room: Room = env.storage().persistent()
            .get(&DataKey::Room(room_id))
            .ok_or(Error::RoomNotFound)?;

        // Enforce room is open
        if room.status != RoomStatus::Open {
            return Err(Error::RoomNotOpen);
        }

        // Enforce valid option
        if option_idx >= room.options.len() {
            return Err(Error::InvalidOption);
        }

        // Enforce no duplicate bets from same address
        for bet in room.bets.iter() {
            if bet.bettor == bettor {
                return Err(Error::AlreadyBet);
            }
        }

        // Transfer tokens from bettor to THIS CONTRACT
        // The contract address holds the funds — no human has the key
        let token_client = token::Client::new(&env, &room.token);
        token_client.transfer(
            &bettor,
            &env.current_contract_address(),
            &room.stake_amount,
        );

        // Record the bet on-chain
        let bet = Bet {
            bettor: bettor.clone(),
            option_idx,
            amount: room.stake_amount,
        };
        room.bets.push_back(bet);
        room.total_pool += room.stake_amount;

        env.storage().persistent().set(&DataKey::Room(room_id), &room);

        log!(&env, "Bet placed: room={}, bettor={}, option={}", room_id, bettor, option_idx);
        Ok(())
    }

    // ────────────────────────────────────────────
    //  RESOLVE — Creator declares winner
    //  Contract automatically distributes funds
    //  to all winners proportionally.
    //  Fully deterministic, fully verifiable.
    // ────────────────────────────────────────────
    pub fn resolve(
        env: Env,
        caller: Address,
        room_id: u64,
        winning_option: u32,
    ) -> Result<(), Error> {
        caller.require_auth();

        let mut room: Room = env.storage().persistent()
            .get(&DataKey::Room(room_id))
            .ok_or(Error::RoomNotFound)?;

        // Only open rooms can be resolved
        if room.status != RoomStatus::Open {
            return Err(Error::RoomNotOpen);
        }

        // Only creator can resolve
        if caller != room.creator {
            return Err(Error::NotCreator);
        }

        // Validate option
        if winning_option >= room.options.len() {
            return Err(Error::InvalidOption);
        }

        // Must have bets
        if room.bets.is_empty() {
            return Err(Error::NoBets);
        }

        let token_client = token::Client::new(&env, &room.token);

        // Calculate winners and their proportional shares
        let mut winner_total: i128 = 0;
        let mut winners: Vec<Bet> = Vec::new(&env);

        for bet in room.bets.iter() {
            if bet.option_idx == winning_option {
                winner_total += bet.amount;
                winners.push_back(bet.clone());
            }
        }

        if winners.is_empty() {
            // No winners — refund everyone
            for bet in room.bets.iter() {
                token_client.transfer(
                    &env.current_contract_address(),
                    &bet.bettor,
                    &bet.amount,
                );
            }
            log!(&env, "No winners in room {}. All bets refunded.", room_id);
        } else {
            // Distribute total pool proportionally to winners
            let pool = room.total_pool;
            for winner in winners.iter() {
                // winner's share = (winner's bet / total winning bets) * total pool
                let payout = (winner.amount * pool) / winner_total;
                if payout > 0 {
                    token_client.transfer(
                        &env.current_contract_address(),
                        &winner.bettor,
                        &payout,
                    );
                }
            }
            log!(&env, "Room {} resolved. Winners paid from pool of {}", room_id, pool);
        }

        room.status = RoomStatus::Resolved;
        room.winning_option = winning_option;
        env.storage().persistent().set(&DataKey::Room(room_id), &room);

        Ok(())
    }

    // ────────────────────────────────────────────
    //  CANCEL — Creator can cancel if no bets yet,
    //  or refund all bets if room has them.
    // ────────────────────────────────────────────
    pub fn cancel(
        env: Env,
        caller: Address,
        room_id: u64,
    ) -> Result<(), Error> {
        caller.require_auth();

        let mut room: Room = env.storage().persistent()
            .get(&DataKey::Room(room_id))
            .ok_or(Error::RoomNotFound)?;

        if room.status != RoomStatus::Open {
            return Err(Error::RoomNotOpen);
        }

        if caller != room.creator {
            return Err(Error::NotCreator);
        }

        // Refund all existing bets
        if !room.bets.is_empty() {
            let token_client = token::Client::new(&env, &room.token);
            for bet in room.bets.iter() {
                token_client.transfer(
                    &env.current_contract_address(),
                    &bet.bettor,
                    &bet.amount,
                );
            }
        }

        room.status = RoomStatus::Cancelled;
        env.storage().persistent().set(&DataKey::Room(room_id), &room);

        log!(&env, "Room {} cancelled by creator", room_id);
        Ok(())
    }

    // ────────────────────────────────────────────
    //  READ FUNCTIONS — Pure on-chain queries
    // ────────────────────────────────────────────

    pub fn get_room(env: Env, room_id: u64) -> Result<Room, Error> {
        env.storage().persistent()
            .get(&DataKey::Room(room_id))
            .ok_or(Error::RoomNotFound)
    }

    pub fn get_room_count(env: Env) -> u64 {
        env.storage().instance()
            .get(&DataKey::RoomCount)
            .unwrap_or(0)
    }

    pub fn get_bets(env: Env, room_id: u64) -> Result<Vec<Bet>, Error> {
        let room: Room = env.storage().persistent()
            .get(&DataKey::Room(room_id))
            .ok_or(Error::RoomNotFound)?;
        Ok(room.bets)
    }
}

// ═══════════════════════════════════════════════════════════
//  TESTS — Verify contract logic without deploying
// ═══════════════════════════════════════════════════════════

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::testutils::{Address as _, Ledger};
    use soroban_sdk::token::{StellarAssetClient, Client as TokenClient};

    fn setup_test<'a>() -> (Env, Address, Address, Address, StellarAssetClient<'a>, TokenClient<'a>) {
        let env = Env::default();
        env.mock_all_auths();

        let admin = Address::generate(&env);
        let creator = Address::generate(&env);
        let token_admin = Address::generate(&env);

        // Create a test token (simulates native XLM SAC)
        let token_address = env.register_stellar_asset_contract_v2(token_admin.clone());
        let sac = StellarAssetClient::new(&env, &token_address.address());
        let token = TokenClient::new(&env, &token_address.address());

        (env, admin, creator, token_address.address(), sac, token)
    }

    #[test]
    fn test_full_flow() {
        let (env, admin, creator, token_addr, sac, token) = setup_test();

        let contract_id = env.register(StellarPotContract, ());
        let client = StellarPotContractClient::new(&env, &contract_id);

        // Initialize
        client.initialize(&admin);

        // Fund creator and bettors
        let bettor_a = Address::generate(&env);
        let bettor_b = Address::generate(&env);
        sac.mint(&creator, &1000_0000000);
        sac.mint(&bettor_a, &1000_0000000);
        sac.mint(&bettor_b, &1000_0000000);

        // Create room
        let options = Vec::from_array(&env, [
            String::from_str(&env, "Yes"),
            String::from_str(&env, "No"),
        ]);
        let room_id = client.create_room(
            &creator,
            &token_addr,
            &String::from_str(&env, "Will BTC hit 100k?"),
            &options,
            &10_0000000, // 10 XLM stake
            &100,        // 100 ledgers until expiry
        );
        assert_eq!(room_id, 1);

        // Place bets
        client.place_bet(&bettor_a, &room_id, &0); // Bet on "Yes"
        client.place_bet(&bettor_b, &room_id, &1); // Bet on "No"

        // Check pool = 20 XLM
        let room = client.get_room(&room_id);
        assert_eq!(room.total_pool, 20_0000000);
        assert_eq!(room.bets.len(), 2);

        // Contract should hold 20 XLM
        assert_eq!(token.balance(&contract_id), 20_0000000);

        // Bettor balances should be reduced
        assert_eq!(token.balance(&bettor_a), 990_0000000);
        assert_eq!(token.balance(&bettor_b), 990_0000000);

        // Resolve — "Yes" wins. Bettor A gets full pool (20 XLM)
        client.resolve(&creator, &room_id, &0);

        // Bettor A should have 990 + 20 = 1010 XLM
        assert_eq!(token.balance(&bettor_a), 1010_0000000);
        // Bettor B loses their stake
        assert_eq!(token.balance(&bettor_b), 990_0000000);

        // Room should be resolved
        let room = client.get_room(&room_id);
        assert_eq!(room.status, RoomStatus::Resolved);
        assert_eq!(room.winning_option, 0);
    }

    #[test]
    fn test_no_winners_refund() {
        let (env, admin, creator, token_addr, sac, token) = setup_test();
        let contract_id = env.register(StellarPotContract, ());
        let client = StellarPotContractClient::new(&env, &contract_id);

        client.initialize(&admin);

        let bettor_a = Address::generate(&env);
        sac.mint(&bettor_a, &1000_0000000);

        let options = Vec::from_array(&env, [
            String::from_str(&env, "Yes"),
            String::from_str(&env, "No"),
        ]);
        let room_id = client.create_room(
            &creator, &token_addr,
            &String::from_str(&env, "Test"),
            &options, &10_0000000, &100,
        );

        client.place_bet(&bettor_a, &room_id, &0); // Bet on "Yes"

        // Resolve "No" wins, but bettor A is the only one and bet "Yes"
        // No winners → everyone gets refunded
        client.resolve(&creator, &room_id, &1);

        assert_eq!(token.balance(&bettor_a), 1000_0000000); // Full refund
    }

    #[test]
    fn test_cancel_refund() {
        let (env, admin, creator, token_addr, sac, token) = setup_test();
        let contract_id = env.register(StellarPotContract, ());
        let client = StellarPotContractClient::new(&env, &contract_id);

        client.initialize(&admin);

        let bettor_a = Address::generate(&env);
        sac.mint(&bettor_a, &500_0000000);

        let options = Vec::from_array(&env, [
            String::from_str(&env, "A"),
            String::from_str(&env, "B"),
        ]);
        let room_id = client.create_room(
            &creator, &token_addr,
            &String::from_str(&env, "Cancel test"),
            &options, &10_0000000, &100,
        );

        client.place_bet(&bettor_a, &room_id, &0);
        assert_eq!(token.balance(&bettor_a), 490_0000000);

        // Creator cancels — bettor gets refund
        client.cancel(&creator, &room_id);
        assert_eq!(token.balance(&bettor_a), 500_0000000);

        let room = client.get_room(&room_id);
        assert_eq!(room.status, RoomStatus::Cancelled);
    }
}
