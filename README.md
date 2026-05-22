# SkillBadge — Onchain Skill Credentials. Zero Gas.

**Claim verified, soul-bound skill badges on Base Sepolia — without ever needing ETH.**

SkillBadge lets developers mint onchain credentials for their skills (React, Solidity, AI Engineering, etc.) completely free of gas fees. Under the hood, UGF (Universal Gas Framework) handles the entire gas payment using testnet Mock USD — the user just connects their wallet, picks a badge, and claims it. That's it.

Built for the UGF Hackathon on Base Sepolia.

---

## What it does

You connect your wallet, choose a skill badge from 6 available tiers (Common → Mythic), and mint it onchain. The badge is soul-bound — permanently tied to your wallet address, verifiable by anyone on Base Sepolia.

The gas? Sponsored by UGF. You saved `~$0.03` every claim without touching ETH.

---

## Screenshots

### Landing Page
![Hero](screenshot_hero.jpg)

### Pick Your Badge
![Choose Badge](screenshot_choose.jpg)

### Transaction Receipt
![Receipt](screenshot_receipt.jpg)

---

## How it works

```
Connect wallet (MetaMask / Coinbase Wallet)
        ↓
Sign authentication message
        ↓
Pick a skill badge (6 types, 6 rarity tiers)
        ↓
UGF quotes gas cost in testnet Mock USD
        ↓
UGF sponsors gas → badge minted on Base Sepolia
        ↓
Transaction receipt + BaseScan link shown instantly
```

No ETH. No paymaster config. No ERC-4337. Just a working dApp.

---

## Badge Types

| Badge | Rarity |
|---|---|
| React Developer | Rare |
| Solidity Developer | Epic |
| AI Engineer | Legendary |
| Full Stack Developer | Common |
| Web3 Developer | Epic |
| C++ Engineer | Rare |

---

## Tech Stack

| Frontend | React + Vite |
| Gas Abstraction | `@tychilabs/react-ugf` (UGF React SDK) |
| Wallet Connection | ConnectKit |
| Network | Base Sepolia (Chain ID: 84532) |
| Styling | CSS |

---

## Getting Started

### Prerequisites

- Node.js v18+
- MetaMask configured on Base Sepolia
- Mock USD from the [UGF Faucet](https://universalgasframework.com/faucets)

### Run locally

```bash
git clone https://github.com/PranavChavan-999/Blockchain.git
cd Blockchain
npm install
npm run dev
```

Open `http://localhost:5173`

### Build

```bash
npm run build
```

---

## Network Setup

Add Base Sepolia to MetaMask:

| Field | Value |
|---|---|
| Network Name | Base Sepolia Testnet |
| RPC URL | `https://sepolia.base.org` |
| Chain ID | `84532` |
| Symbol | ETH |
| Explorer | `https://sepolia-explorer.base.org` |

---

## UGF Integration

The core claim flow uses the `@tychilabs/react-ugf` SDK:

```bash
npm install @tychilabs/react-ugf
```

When a user clicks "Claim Badge":
1. UGF fetches a gas quote in testnet Mock USD
2. User confirms the wallet transaction (gas sponsored — 0 ETH required)
3. UGF executes the mint on Base Sepolia
4. App shows a full transaction receipt with TX hash and BaseScan link

Docs: [universalgasframework.com/docs](https://universalgasframework.com/docs)

---

## Project Structure

```
Blockchain/
├── public/
├── src/
│   ├── components/      # UI components (Hero, BadgePicker, Receipt, etc.)
│   ├── App.jsx
│   └── main.jsx
├── index.html
├── vite.config.js
└── package.json
```

---

## Team

| Name | Role |
| Pranav Chavan | Developer |
| Adarsh Maurya | Developer |

---

## Hackathon Track

**Minting** — Onchain skill badge / credential claiming

Built for the **Universal Gas Framework Hackathon** by [TychiLabs](https://x.com/TychiLabs)

---

## Acknowledgements

- [Universal Gas Framework](https://universalgasframework.com) — for making gasless transactions actually simple
- [Base](https://base.org) — fast, cheap L2 that made this practical to build on
- [ConnectKit](https://docs.family.co/connectkit) — wallet connection without the headache
