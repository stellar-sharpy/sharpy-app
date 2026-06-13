# sharpy-app

Next.js 14 frontend dApp for Sharpy — advanced on-chain split payment on Stellar.

## Table of Contents

- [Overview](#overview)
- [Live App](#live-app)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Pages](#pages)
- [Local Setup](#local-setup)
- [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)
- [Build](#build)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

## Overview

sharpy-app is the official frontend for the Sharpy split payment protocol. It connects to the Sharpy Soroban contract on Stellar via the `@stellar-sharpy/sdk` and allows users to create invoices, make payments, manage escrow, and view recurring invoice chains — directly from their Freighter wallet.

The `/verify/[id]` route provides public on-chain invoice verification without requiring a wallet connection, making it suitable for sharing invoice status with third parties.

## Live App

[https://sharpy-sigma.vercel.app](https://sharpy-sigma.vercel.app)

Connected to Stellar testnet. Contract ID: `CAYTIFPD6RFWVHMK5SPPUUIWWAAANHKOJB6GOAJS5SR5MBKZMEY2UODZ`

## Features

- Create single, batch, and recurring invoices on Stellar
- Pay toward invoices with USDC via Freighter wallet
- Escrow management — release funds after configurable delay
- Recurring invoice chain viewer
- Public invoice verification (no wallet required, server-side rendered)
- Dashboard showing all invoices created or received by the connected wallet
- Dark and light mode with system preference detection
- Fully typed, connected to the Sharpy TypeScript SDK

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 3 |
| Wallet | Freighter (`@stellar/freighter-api` v3) |
| Contract SDK | `@stellar-sharpy/sdk` (local workspace) |
| Deployment | Vercel |

## Pages

| Route | Type | Description |
|-------|------|-------------|
| `/` | Static | Landing page with feature overview and call to action |
| `/dashboard` | Client | Wallet-gated list of sent and received invoices |
| `/invoice/new` | Client | Create a new invoice — single, escrow, or recurring |
| `/invoice/[id]` | Dynamic | Invoice detail: recipients, funding progress, pay button |
| `/invoice/[id]/escrow` | Dynamic | Release escrow-held invoice after delay period |
| `/invoice/[id]/recurring` | Dynamic | View the full recurring invoice chain |
| `/verify/[id]` | SSR | Public on-chain verification — no wallet required |

## Local Setup

### Prerequisites

- Node.js 20+
- [Freighter wallet](https://freighter.app) browser extension

### Install and run

```bash
git clone https://github.com/stellar-sharpy/sharpy-app.git
cd sharpy-app
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

Copy `.env.example` to `.env.local` and set the values:

```bash
NEXT_PUBLIC_STELLAR_NETWORK=testnet
NEXT_PUBLIC_CONTRACT_ID=CAYTIFPD6RFWVHMK5SPPUUIWWAAANHKOJB6GOAJS5SR5MBKZMEY2UODZ
NEXT_PUBLIC_RPC_URL=https://soroban-testnet.stellar.org
NEXT_PUBLIC_USDC_CONTRACT_ID=CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA
```

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_STELLAR_NETWORK` | `testnet` or `mainnet` |
| `NEXT_PUBLIC_CONTRACT_ID` | Deployed Sharpy contract ID |
| `NEXT_PUBLIC_RPC_URL` | Soroban RPC endpoint |
| `NEXT_PUBLIC_USDC_CONTRACT_ID` | USDC token contract ID on the target network |

## Project Structure

```
sharpy-app/
├── packages/
│   └── sdk/                 @stellar-sharpy/sdk vendored as local workspace
├── src/
│   ├── app/                 Next.js App Router pages
│   │   ├── page.tsx         Landing page
│   │   ├── layout.tsx       Root layout with Providers and Navbar
│   │   ├── globals.css      Global styles and CSS custom properties
│   │   ├── dashboard/       Dashboard page
│   │   ├── invoice/
│   │   │   ├── new/         Invoice creation form
│   │   │   └── [id]/        Invoice detail, escrow, recurring pages
│   │   └── verify/[id]/     Public verification (SSR)
│   ├── components/
│   │   ├── Navbar.tsx       Sticky navigation with wallet connect and theme toggle
│   │   ├── Providers.tsx    ThemeProvider + WalletProvider wrapper
│   │   └── WalletProvider.tsx  Freighter wallet context
│   └── lib/
│       ├── client.ts        SDK client initialised from environment variables
│       └── utils.ts         Formatting helpers (amounts, dates, addresses)
├── public/
│   ├── logo.png             Project logo (2000x2000)
│   ├── logo.svg             Project logo (vector)
│   └── favicon.ico          Browser favicon
├── .env.example             Environment variable template
├── tailwind.config.js       Tailwind configuration with custom color tokens
└── next.config.js           Next.js configuration
```

## Build

```bash
npm run build   # Builds the SDK workspace then compiles Next.js
npm run start   # Start production server
npm run lint    # ESLint + TypeScript type check
```

## Deployment

The app is deployed on Vercel. To deploy manually:

```bash
npm install -g vercel
vercel login
vercel --prod
```

Set the four environment variables in the Vercel project settings before deploying.

To connect automatic deployments, link the GitHub repository in the Vercel dashboard under Project Settings > Git.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT
