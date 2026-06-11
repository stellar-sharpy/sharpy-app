# sharpy-app

![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38bdf8?logo=tailwindcss)
![License](https://img.shields.io/badge/license-MIT-green)

Next.js 14 frontend dApp for **Sharpy** — advanced on-chain split payment on Stellar.

## Features

🎯 **Recurring Splits** — Automatically generate invoices on schedule
🔒 **Escrow Protection** — Hold funds before release with configurable delays
📦 **Batch Operations** — Create and pay multiple invoices efficiently
💰 **Advanced Splits** — Fixed, Percentage, and Tiered payment rules
📊 **Dashboard** — Track sent and received invoices
✅ **Public Verification** — On-chain verification without login

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 3 |
| Wallet | Freighter (`@stellar/freighter-api`) |
| Contract SDK | `@stellar-sharpy/sdk` |
| Deploy | Vercel |

## Local Setup

### Prerequisites

- Node.js 20+
- [Freighter wallet](https://freighter.app) browser extension

### Install & Run

```bash
git clone https://github.com/stellar-sharpy/sharpy-app.git
cd sharpy-app
npm install
cp .env.example .env.local
# Edit .env.local with your testnet values
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment Variables

Create `.env.local`:

```bash
NEXT_PUBLIC_STELLAR_NETWORK=testnet
NEXT_PUBLIC_CONTRACT_ID=CABC...YOUR_CONTRACT_ID
NEXT_PUBLIC_RPC_URL=https://soroban-testnet.stellar.org
NEXT_PUBLIC_USDC_CONTRACT_ID=CBBD...
```

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_STELLAR_NETWORK` | `testnet` or `mainnet` |
| `NEXT_PUBLIC_CONTRACT_ID` | Deployed Sharpy contract ID |
| `NEXT_PUBLIC_RPC_URL` | Soroban RPC endpoint URL |
| `NEXT_PUBLIC_USDC_CONTRACT_ID` | Native USDC contract ID on network |

## Pages

| Route | Description |
|-------|-------------|
| `/` | Landing page with CTA |
| `/dashboard` | User's sent and received invoices |
| `/invoice/new` | Create a new invoice |
| `/invoice/[id]` | Invoice detail, payment progress, Pay button |
| `/invoice/[id]/escrow` | Manage escrow-held invoices |
| `/invoice/[id]/recurring` | View recurring invoice chain |
| `/verify/[id]` | Public on-chain verification (no login) |

## Run Lint

```bash
npm run lint
```

## Build

```bash
npm run build
npm run start
```

## E2E Tests

```bash
npm run test:e2e
```

## Development

```bash
npm run dev      # Watch mode on localhost:3000
npm run lint     # Type check
npm run build    # Production build
```

## Project Structure

```
src/
├── app/              # Next.js app router pages
├── components/       # Reusable React components
├── lib/
│   ├── client.ts    # Sharpy SDK client setup
│   ├── utils.ts     # Helper functions
│   └── types.ts     # TypeScript types
├── styles/          # Global and component styles
└── public/          # Static assets
```

## Deployment

Deploy to [Vercel](https://vercel.com):

```bash
vercel
```

Or connect your GitHub repo for automatic deployments.

## License

MIT
