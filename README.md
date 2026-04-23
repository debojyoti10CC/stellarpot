<div align="center">

<img src="https://img.shields.io/badge/%F0%9F%AA%90-StellarPot-7C3AED?style=for-the-badge&labelColor=0D0D0D" alt="StellarPot" height="40" />

# StellarPot

**Private, peer-to-peer betting — no house, no middleman, no trust required.**

[![License: MIT](https://img.shields.io/badge/License-MIT-green)](LICENSE)
[![Stellar Testnet](https://img.shields.io/badge/Network-Stellar_Testnet-7B61FF?logo=stellar)](https://stellar.expert)
[![Built with Soroban](https://img.shields.io/badge/Smart_Contract-Soroban-FF6B35)](https://soroban.stellar.org)
[![Next.js 15](https://img.shields.io/badge/Frontend-Next.js_15-000000?logo=next.js)](https://nextjs.org)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen)](CONTRIBUTING.md)

[Live Demo](https://stellarpot.xyz) · [Contract on Stellar.Expert](https://stellar.expert/explorer/testnet/contract/CC5CLW64G7B2HY2PHIQWEETUON5LGKXTIDXS2K5HU4OVHUEAJEYEWT4N) · [Report a Bug](https://github.com/your-org/stellarpot/issues) · [Request a Feature](https://github.com/your-org/stellarpot/discussions)


<img width="1911" height="903" alt="image" src="https://github.com/user-attachments/assets/01a6ee2b-d14d-4166-8032-bc90a3565815" />

</div>

---

## Overview

StellarPot is a 100% decentralized, non-custodial betting platform for friends and private communities, built on the [Stellar](https://stellar.org) network using [Soroban](https://soroban.stellar.org) smart contracts.

There is no house edge. There is no operator. There is no centralized escrow. The smart contract *is* the escrow — self-executing, publicly auditable, and incapable of favoring any party. Winnings are distributed automatically and proportionally the moment a result is declared.

> **Status:** Testnet. Do not use with real funds until a mainnet audit is complete.

---

## Table of Contents

- [How It Works](#how-it-works)
- [Architecture](#architecture)
- [Deployed Contracts](#deployed-contracts)
- [Getting Started](#getting-started)
- [Local Development](#local-development)
- [Smart Contract Testing](#smart-contract-testing)
- [Security Model](#security-model)
- [Contributing](#contributing)
- [License](#license)

---

## How It Works

StellarPot is built around the concept of a **Pot** — a single-question, fixed-stake betting room shared privately among a group.

```
Creator defines question + options + stake + expiry
        │
        ▼
  6-character room code generated (e.g. G6X9P)
        │
        ▼
  Friends join via secure link and place bets
  [XLM transferred from wallet → contract escrow]
        │
        ▼
  Event occurs → Creator declares outcome
        │
        ▼
  Contract calculates proportional payouts
  [Funds distributed instantly to winners' wallets]
```

1. **Create** — Connect your [Freighter Wallet](https://freighter.app), define a question, set the options, stake amount, and expiry time.
2. **Share** — A deterministic 6-character alphanumeric code is generated on-chain. Share it privately — no guessable serial ID is ever exposed.
3. **Stake** — Friends join via the secure link and place their bet. The Soroban contract pulls XLM directly into escrow.
4. **Resolve** — Once the event concludes, the creator selects the winning outcome on-chain.
5. **Settle** — The contract computes `Total Pool ÷ Winning Stakes` and transfers funds proportionally to every winner. No manual step required, and no one can block or redirect the payout.

---

## Architecture

```
stellarpot/
├── contracts/
│   └── stellarpot/
│       └── src/
│           └── lib.rs        # Core Soroban smart contract
├── src/
│   ├── app/                  # Next.js 15 App Router pages
│   ├── components/           # UI component library
│   └── lib/                  # RPC client, wallet utilities, obfuscation
├── public/
└── README.md
```

### Smart Contract (`contracts/stellarpot/src/lib.rs`)

Written in **Rust** and compiled to WASM for the Soroban runtime.

| Concern | Implementation |
|---|---|
| **Escrow** | Holds native XLM via the Stellar Asset Contract (SAC) |
| **State** | `Room` and `Bet` structs in `instance` + `persistent` storage |
| **Authorization** | `require_auth()` on all creator-gated operations |
| **Payout Math** | Proportional division with safe integer arithmetic to avoid rounding loss |

### Frontend (`src/`)

A thin, non-custodial **Next.js 15** application that talks directly to the blockchain. No backend, no database.

- **No private keys ever leave the browser.** All transaction signing is delegated to the [Freighter](https://freighter.app) browser extension.
- **Deterministic obfuscation.** Serial `u64` room IDs are transformed to 6-character alphanumeric codes using a fixed mathematical salt — entirely client-side, no lookup table required.
- **Real-time data.** Soroban RPC is polled to reflect live pool sizes and conviction percentages.

### Design System

| Token | Value |
|---|---|
| **Framework** | Tailwind CSS 4 |
| **Typeface** | Outfit (Geometric Sans) |
| **Aesthetic** | Monochromatic · Technical · Minimalist |

---

## Deployed Contracts

> **Network: Stellar Testnet**

| Component | Contract ID |
|---|---|
| Core Smart Contract | [`CC5CLW64G7B2HY2PHIQWEETUON5LGKXTIDXS2K5HU4OVHUEAJEYEWT4N`](https://stellar.expert/explorer/testnet/contract/CC5CLW64G7B2HY2PHIQWEETUON5LGKXTIDXS2K5HU4OVHUEAJEYEWT4N) |
| Native XLM Wrapper (SAC) | [`CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC`](https://stellar.expert/explorer/testnet/contract/CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC) |

---

## Getting Started

### Prerequisites

| Tool | Version |
|---|---|
| Node.js | 18+ |
| Rust | 1.81+ |
| Rust target | `wasm32-unknown-unknown` |
| Browser extension | [Freighter Wallet](https://freighter.app) |

```bash
rustup target add wasm32-unknown-unknown
```

---

## Local Development

```bash
# 1. Clone the repository
git clone https://github.com/your-org/stellarpot.git
cd stellarpot

# 2. Install dependencies
npm install

# 3. Start the development server
npm run dev
```

Open `http://localhost:3000` and connect Freighter to **Testnet** before interacting with any contract functions.

---

## Smart Contract Testing

```bash
cd contracts/stellarpot
cargo test
```

To build the contract manually:

```bash
cargo build --target wasm32-unknown-unknown --release
```

---

## Security Model

| Property | Guarantee |
|---|---|
| **Non-custodial** | Private keys never leave the user's device |
| **Immutable rules** | Stake amount and options are locked at room creation |
| **Transparent** | Every bet, resolution, and payout is verifiable on the public Stellar ledger |
| **No admin** | No privileged key exists that can freeze, redirect, or drain funds |
| **Creator-bound resolution** | Only the room creator can declare an outcome, enforced by `require_auth()` at the contract level |

> **Disclaimer:** This project has not undergone a formal third-party security audit. Use on testnet only until an audit is completed and published.

---

## Contributing

Contributions are welcome. Please open an issue to discuss what you'd like to change before submitting a pull request.

```bash
git checkout -b feature/your-feature-name
git commit -m "feat: describe your change"
git push origin feature/your-feature-name
# Open a pull request
```

Please follow [Conventional Commits](https://www.conventionalcommits.org/) for commit messages.

---

## License

[MIT](LICENSE) © StellarPot Contributors

---

<div align="center">

Built with ❤️ on [Stellar Soroban](https://soroban.stellar.org)

</div>
