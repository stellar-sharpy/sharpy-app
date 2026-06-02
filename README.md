# sharpy-app

![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38bdf8?logo=tailwindcss)
![License](https://img.shields.io/badge/license-MIT-green)

Next.js 14 frontend dApp for **Sharpy** — advanced on-chain split payment on Stellar.

## Live App

**https://sharpy-sigma.vercel.app**

## Features

- 🎯 **Recurring Splits** — Automatically generate invoices on schedule
- 🔒 **Escrow Protection** — Hold funds before release with configurable delays
- 📦 **Batch Operations** — Create and pay multiple invoices efficiently
- 💰 **Advanced Splits** — Fixed, Percentage, and Tiered payment rules
- 📊 **Dashboard** — Track sent and received invoices
- ✅ **Public Verification** — On-chain verification without login

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 3 |
| Wallet | Freighter (`@stellar/freighter-api` v3) |
| Contract SDK | `@stellar-sharpy/sdk` (local workspace) |
| Deploy | Vercel |

## Pages

| Route | Description |
|-------|-------------|
| `/` | Landing page |
| `/dashboard` | Wallet-gated sent and received invoices |
| `/invoice/new` | Create invoice (single, escrow, recurring) |
| `/invoice/[id]` | Invoice detail, funding progress, pay button |
| `/invoice/[id]/escrow` | Release escrow-held invoices |
| `/invoice/[id]/recurring` | View recurring invoice chain |
| `/verify/[id]` | Public on-chain verification (no login, SSR) |

## Local Setup

```bash
git clone https://github.com/stellar-sharpy/sharpy-app.git
cd sharpy-app
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

```bash
NEXT_PUBLIC_STELLAR_NETWORK=testnet
NEXT_PUBLIC_CONTRACT_ID=CAYTIFPD6RFWVHMK5SPPUUIWWAAANHKOJB6GOAJS5SR5MBKZMEY2UODZ
NEXT_PUBLIC_RPC_URL=https://soroban-testnet.stellar.org
NEXT_PUBLIC_USDC_CONTRACT_ID=CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA
```

## Build

```bash
npm run build   # builds SDK workspace then Next.js
npm run start
npm run lint
```

## Project Structure

```
sharpy-app/
├── packages/sdk/        # @stellar-sharpy/sdk (local workspace)
├── src/
│   ├── app/             # Next.js App Router pages
│   ├── components/      # WalletProvider, Navbar
│   └── lib/
│       ├── client.ts    # SDK client setup from env vars
│       └── utils.ts     # Formatting helpers
├── .env.example
└── next.config.js
```

## Related Repos

| Repo | Description |
|------|-------------|
| [sharpy-contracts](https://github.com/stellar-sharpy/sharpy-contracts) | Soroban smart contract (Rust) |
| [sharpy-sdk](https://github.com/stellar-sharpy/sharpy-sdk) | TypeScript SDK |

## License

MIT
