# sharpy-app

![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38bdf8?logo=tailwindcss)
![Protocol 27](https://img.shields.io/badge/Stellar-Protocol%2027-6C63FF?logo=stellar)
![License](https://img.shields.io/badge/license-MIT-green)

Next.js 14 frontend dApp for **Sharpy** — advanced on-chain split payment on Stellar.

## Live App

**https://sharpy-sigma.vercel.app**

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         sharpy-app                                   │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                     Next.js 14 App Router                    │  │
│  │                                                              │  │
│  │  /              /dashboard      /invoice/new                 │  │
│  │  Landing        Invoice list    Create form                  │  │
│  │  page           (wallet-gated)  (single/escrow/recurring)    │  │
│  │                                                              │  │
│  │  /invoice/[id]  /invoice/[id]/escrow  /invoice/[id]/cancel   │  │
│  │  Detail + pay   Escrow release        Creator cancel         │  │
│  │                                                              │  │
│  │  /invoice/[id]/recurring   /pay/[id]   /verify/[id]          │  │
│  │  Recurring chain           Public pay  SSR verification      │  │
│  │                            (x402 ready) (no login)           │  │
│  └───────────────────────────────┬──────────────────────────────┘  │
│                                  │                                  │
│  ┌───────────────────────────────▼──────────────────────────────┐  │
│  │                      src/lib/                                 │  │
│  │                                                              │  │
│  │  client.ts          utils.ts           tokens.ts            │  │
│  │  SharpyClient       formatAmount()     Token registry       │  │
│  │  setup from         formatDeadline()   USDC/XLM/AQUA/yXLM   │  │
│  │  env vars           fundingPercent()                        │  │
│  └───────────────────────────────┬──────────────────────────────┘  │
│                                  │                                  │
│  ┌───────────────────────────────▼──────────────────────────────┐  │
│  │                   src/components/                             │  │
│  │                                                              │  │
│  │  WalletProvider   Navbar         TokenSelector              │  │
│  │  Freighter v3     Theme toggle   CopyButton                 │  │
│  │  connect/sign     Dark/light     QR Code                    │  │
│  └───────────────────────────────┬──────────────────────────────┘  │
│                                  │                                  │
│  ┌───────────────────────────────▼──────────────────────────────┐  │
│  │               packages/sdk (vendored)                         │  │
│  │               @stellar-sharpy/sdk 0.1.0                      │  │
│  │               @stellar/stellar-sdk 16.0.1 (Protocol 27)      │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    │                           │
          ┌─────────▼──────────┐    ┌──────────▼──────────┐
          │  Stellar Soroban   │    │   Freighter Wallet   │
          │  Testnet RPC       │    │   (auth-entry sign)  │
          │  Protocol 27       │    │   Albedo / Hana      │
          └────────────────────┘    └─────────────────────┘
```

## User Flow

```
User visits /invoice/new
        │
        ▼
 Connect Freighter wallet
        │
        ▼
 Fill recipients + amounts
 Set deadline
 Toggle escrow / recurring
        │
        ▼
 Sign transaction (Freighter)
        │
        ▼
 Invoice created on-chain
        │
   ┌────┴────┐
   │         │
   ▼         ▼
Share     /dashboard
/pay/[id] shows invoice
link      in list
   │
   ▼
Payer visits /pay/[id]
   │
   ├── Browser: Connect wallet → Pay button
   │
   └── AI Agent: x402 HTTP payment flow (coming soon)
        │
        ▼
  Invoice funded → auto-release or escrow lock
        │
        ▼
  Recipients receive funds on Stellar
```

## Features

- Recurring Splits — Automatically generate invoices on schedule
- Escrow Protection — Hold funds before release with configurable delays
- Batch Operations — Create and pay multiple invoices efficiently
- Advanced Splits — Fixed, Percentage, and Tiered payment rules
- Dashboard — Track sent and received invoices with search/filter
- Public Verification — On-chain verification without login (SSR)
- Multi-token — USDC, XLM, AQUA, yXLM support
- Dark/Light mode — System preference detection
- QR Codes — Shareable invoice payment links
- Protocol 27 ready — @stellar/stellar-sdk 16.0.1

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 3 |
| Wallet | Freighter (`@stellar/freighter-api` v3) |
| Contract SDK | `@stellar-sharpy/sdk` (local workspace) |
| Stellar SDK | `@stellar/stellar-sdk` 16.0.1 |
| Deploy | Vercel |

## Pages

| Route | Description |
|-------|-------------|
| `/` | Landing page |
| `/dashboard` | Wallet-gated invoice list with search and filter |
| `/invoice/new` | Create invoice — single, escrow, or recurring |
| `/invoice/[id]` | Invoice detail, funding progress, pay button, QR code |
| `/invoice/[id]/escrow` | Release escrow-held invoices |
| `/invoice/[id]/recurring` | View recurring invoice chain |
| `/invoice/[id]/cancel` | Creator cancel page |
| `/pay/[id]` | Public shareable payment page (x402 ready) |
| `/verify/[id]` | Public on-chain verification — SSR, no login |

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
│   ├── components/      # WalletProvider, Navbar, TokenSelector, CopyButton
│   └── lib/
│       ├── client.ts    # SDK client setup from env vars
│       ├── utils.ts     # Formatting helpers
│       └── tokens.ts    # Token registry (USDC, XLM, AQUA, yXLM)
├── public/              # Logo, favicon
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
