# StellarPot: Decentralized Prediction Pools on Soroban

StellarPot is a trustless, decentralized prediction market platform built on the **Stellar network** using **Soroban smart contracts**. It enables users to create prediction rooms, stake tokens on potential outcomes, and automate the distribution of the total pool to winners through transparent, on-chain logic.

##  Overview

The platform bridges a modern **Next.js** frontend with a robust **Rust-based** smart contract to ensure financial integrity. By leveraging Soroban, the system eliminates the need for a human intermediary; all funds are held in escrow by the contract itself, and payouts are calculated deterministically based on the verified outcome.

##  Key Features

* **Non-Custodial Escrow:** Staked funds are held by the contract address, ensuring no single entity has access to the pool's private keys.
* **Proportional Payout Distribution:** Winners receive a share of the total pool proportional to their initial stake.
* **Automated Refund Logic:** If a room is cancelled or resolved with no winners for the chosen outcome, the contract automatically returns stakes to all participants.
* **On-Chain State Management:** All room data, including descriptions, expiry ledgers, and participant bets, is recorded permanently on the Stellar ledger.
* **Seamless Wallet Integration:** Uses the **Freighter API** for secure, user-friendly transaction signing and identity management.

##  Tech Stack

### Frontend
* **Framework:** Next.js 15 (App Router)
* **Styling:** Tailwind CSS 4
* **UI Components:** Radix UI primitives and Lucide icons
* **State Management:** React Context API for wallet and room states
* **Blockchain Interaction:** `@stellar/stellar-sdk` and `@stellar/freighter-api`

### Smart Contract
* **Language:** Rust
* **Environment:** Soroban SDK
* **Network:** Stellar Testnet

##  Smart Contract Logic

The `StellarPotContract` implements the core business logic through several key entry points:

1.  **`initialize`**: Configures the administrative address and initializes global state counters.
2.  **`create_room`**: Allows creators to define a prediction, possible options, a fixed stake amount, and an expiry ledger sequence.
3.  **`place_bet`**: Transfers the required stake from the user to the contract and records their selected option.
4.  **`resolve`**: Triggered by the creator to finalize an outcome. The contract then calculates and executes proportional payouts to winners.
5.  **`cancel`**: Enables the creator to close a room and trigger an immediate refund of all active bets.

##  Getting Started

### Prerequisites
* Node.js 18+
* Rust and the Soroban CLI (for contract compilation and testing)
* [Freighter Wallet](https://www.freighter.app/) extension (configured for Testnet)

### Installation

1.  **Clone the Repository:**
    ```bash
    git clone <repository-url>
    cd stellarpot
    ```

2.  **Install Dependencies:**
    ```bash
    npm install
    # or
    pnpm install
    ```

3.  **Environment Configuration:**
    Create a `.env.local` file in the root directory:
    ```env
    NEXT_PUBLIC_CONTRACT_ID=CC... (Your Deployed Soroban Contract ID)
    ```

4.  **Launch Development Server:**
    ```bash
    npm run dev
    ```

### Contract Deployment & Testing
To run the included Rust test suite:
```bash
cd contracts/stellarpot
cargo test
```

To deploy to the Stellar Testnet:
```bash
soroban contract deploy \
    --wasm target/wasm32-unknown-unknown/release/stellarpot.wasm \
    --source <your-account-alias> \
    --network testnet
```

##  Project Structure

* `/app`: Next.js routing and server-side API endpoints.
* `/components`: Reusable React UI components for the dashboard and room management.
* `/contracts/stellarpot`: Rust source code for the Soroban smart contract.
* `/lib`: Core utilities for Stellar SDK interactions, database mocking, and wallet contexts.
* `/public`: Static assets and icons.

## 🛡 Security & Design
StellarPot utilizes **Stellar Asset Contract (SAC)** wrappers to handle native XLM. Security is enforced at the protocol level using `require_auth()`, ensuring that only the authorized owner of an account can stake funds or resolve a created room.
