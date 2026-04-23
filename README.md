# StellarPot: Private Betting for Friends 🪐

StellarPot is a **100% decentralized, non-custodial** private betting platform built on the **Stellar network** using **Soroban smart contracts**. Unlike traditional betting sites, StellarPot has no middleman, no house edge, and no centralized control. The contract acts as a neutral escrow that ensures fair payouts directly to your wallet.

---

## 🔗 Live Contract Details (Testnet)

| Component | Asset / ID | Explorer Link |
| :--- | :--- | :--- |
| **Core Smart Contract** | `CC5CLW64G7B2HY2PHIQWEETUON5LGKXTIDXS2K5HU4OVHUEAJEYEWT4N` | [View on Stellar.Expert](https://stellar.expert/explorer/testnet/contract/CC5CLW64G7B2HY2PHIQWEETUON5LGKXTIDXS2K5HU4OVHUEAJEYEWT4N) |
| **Native XLM Wrapper (SAC)** | `CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC` | [View on Stellar.Expert](https://stellar.expert/explorer/testnet/contract/CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC) |

---

## 🚀 The Workflow

StellarPot is designed for group chats, friend circles, and private communities. Here is how a typical "Pot" works:

1.  **Initialization**: A user connects their **Freighter Wallet** and creates a room by defining a question, options (e.g., "Yes/No"), a fixed stake amount (e.g., 10 XLM), and an expiry time.
2.  **Obfuscated Sharing**: The platform generates a deterministic, 6-character unguessable code (e.g., `G6X9P`) that maps to the on-chain Room ID. This allows for private sharing without random people guessing the serial ID.
3.  **Staking**: Friends join the room via the secure link and place their bets. The Soroban contract transfers the XLM from their wallet into the contract's secure escrow.
4.  **Resolution**: Once the event occurs, the creator selects the winning outcome.
5.  **Settlement**: The contract automatically calculates the proportional payouts (Total Pool / Winning Stakes) and distributes the funds instantly to all winners. No human can block or steal the funds once the bet is placed.

---

## 🛠 Technical Architecture

### 1. Smart Contract (Rust / Soroban)
The core logic resides in `/contracts/stellarpot/src/lib.rs`. It manages:
- **Escrow**: Holding native XLM using the Stellar Asset Contract (SAC).
- **State**: Storing `Room` and `Bet` structs in `instance` and `persistent` storage.
- **Verification**: Using `require_auth()` to ensure only the creator can resolve or cancel a room.
- **Math**: Precise proportional payout calculation to handle non-integer divisions safely in a decentralized environment.

### 2. Secure Frontend (Next.js 15)
The frontend is a thin, non-custodial layer that talks directly to the blockchain:
- **No Private Keys**: All signing happens via the Freighter browser extension.
- **Deterministic Obfuscation**: Uses a mathematical salt to transform serial `u64` IDs into unguessable alphanumeric codes on-the-fly, ensuring privacy without a central database.
- **Real-time Data**: Polls the Soroban RPC to fetch the latest pool sizes and conviction percentages.

### 3. Design System
- **Framework**: Tailwind CSS 4
- **Typography**: **Outfit** (Premium Geometric Sans)
- **Aesthetic**: Monochromatic, technical, and minimalist (Vercel/Linear style).

---

## 💻 Local Development

### Prerequisites
- Node.js 18+
- Rust 1.81+ (with `wasm32-unknown-unknown` target)
- [Freighter Wallet](https://www.freighter.app/)

### Setup
1.  **Clone & Install**:
    ```bash
    npm install
    ```
2.  **Run Development Server**:
    ```bash
    npm run dev
    ```
3.  **Contract Testing**:
    ```bash
    cd contracts/stellarpot
    cargo test
    ```

---

## 🛡 Security & Trust Model
- **Non-Custodial**: StellarPot never touches your private keys.
- **Immutable Logic**: Once a room is created, the rules (stake amount, options) cannot be changed.
- **Transparency**: Every transaction, bet, and payout is verifiable on the public Stellar ledger.
- **Admin-Free**: There is no "owner" of the contract that can freeze your funds.

---
*Built with ❤️ on Stellar Soroban.*
