# sharpy-app

![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38bdf8?logo=tailwindcss)
![stellar-sdk](https://img.shields.io/badge/stellar--sdk-16.0.1-6C63FF)
![License](https://img.shields.io/badge/license-MIT-green)

Next.js 14 frontend dApp for **Sharpy** — advanced on-chain split payment on Stellar.

## Live App

**https://sharpy-sigma.vercel.app**

## Features

- Recurring splits — automatically generate invoices on schedule
- Escrow protection — hold funds before release with configurable delays
- Batch operations — create and pay multiple invoices efficiently
- Advanced splits — Fixed, Percentage, and Tiered payment rules
- Multi-token support — USDC, XLM, AQUA, yXLM
- Dashboard with search and filter
- QR code for invoice payment links
- Copy-to-clipboard for invoice URL and contract address
- Transaction confirmation step indicators
- Cancel invoice page for creators
- Public verification — on-chain verification without login
- Dark/light mode with system preference detection
- Protocol 27 compatible — stellar-sdk 16.0.1

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
| `/dashboard` | Wallet-gated sent and received invoices with search/filter |
| `/invoice/new` | Create invoice — single, escrow, recurring |
| `/invoice/[id]` | Invoice detail, funding progress, pay button, QR code |
| `/invoice/[id]/escrow` | Escrow release management |
| `/invoice/[id]/recurring` | Recurring invoice chain view |
| `/invoice/[id]/cancel` | Creator cancel and refund |
| `/verify/[id]` | Public on-chain verification (SSR, no login) |

## Local Setup

```bash
git clone https://github.com/stellar-sharpy/sharpy-app.git
cd sharpy-app
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Requires [Freighter](https://freighter.app) browser extension.

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
npm run lint
npm run start
```

## Project Structure

```
sharpy-app/
├── packages/sdk/           # @stellar-sharpy/sdk (local workspace)
├── src/
│   ├── app/                # Next.js App Router pages
│   │   ├── dashboard/
│   │   ├── invoice/
│   │   │   ├── new/
│   │   │   └── [id]/
│   │   │       ├── escrow/
│   │   │       ├── recurring/
│   │   │       └── cancel/
│   │   └── verify/[id]/
│   ├── components/         # WalletProvider, Navbar, TokenSelector
│   └── lib/
│       ├── client.ts       # SDK client setup from env vars
│       ├── tokens.ts       # Token registry (USDC, XLM, AQUA, yXLM)
│       └── utils.ts        # Formatting helpers
├── public/                 # Logo, favicon
├── .env.example
└── next.config.js
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Always test with Freighter connected to testnet before opening a PR.

## Related Repos

| Repo | Description |
|------|-------------|
| [sharpy-contracts](https://github.com/stellar-sharpy/sharpy-contracts) | Soroban smart contract (Rust) |
| [sharpy-sdk](https://github.com/stellar-sharpy/sharpy-sdk) | TypeScript SDK |

## License

MIT
