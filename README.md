# sharpy-app

![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38bdf8?logo=tailwindcss)
![stellar-sdk](https://img.shields.io/badge/stellar--sdk-16.0.1-6C63FF)
![Components](https://img.shields.io/badge/components-30%2B-00D4AA)
![License](https://img.shields.io/badge/license-MIT-green)
![Version](https://img.shields.io/badge/version-0.2.0-6C63FF)
[![Demo](https://img.shields.io/badge/Demo-Watch%20on%20Loom-00D4AA?logo=loom)](https://www.loom.com/share/09aa4a78e0c944dcab866a7036fde24d)

Next.js 14 frontend dApp for **Sharpy** — advanced on-chain split payment on Stellar. Supports recurring invoices, escrow-protected payments, batch operations, agentic x402 payments, CCTP cross-chain USDC bridging, and public on-chain verification.

## Live App

**https://sharpy-sigma.vercel.app**

**[Pitch Deck](https://gamma.app/docs/Split-Payments-on-Stellar-s0et8z1agtva59n)**

**[Demo Video](https://www.loom.com/share/09aa4a78e0c944dcab866a7036fde24d)**

###  Live Testnet Transactions

See Sharpy in action with real on-chain transactions:

- [Create Invoice #3](https://stellar.expert/explorer/testnet/tx/ce46bcef570a4c05f6348081126135c9f24165c5e470a6b51b923f423156c5da) — Basic invoice creation
- [Batch Creation](https://stellar.expert/explorer/testnet/tx/97cee323bb5443ddc8439f9d99f5a34e585f8cf74872a6138c5f1456adb5ab90) — Multiple invoices in one transaction
- [Multi-recipient Split](https://stellar.expert/explorer/testnet/tx/785d079c53350fdf50db1e6d92da2219e148b204b87b6448632d1e21a94faac4) — Payment split to multiple addresses
- [Escrow Protection](https://stellar.expert/explorer/testnet/tx/db19f9206a4a25b4431b6a3dfae25080f3c20a285249521aac5e593f1c26e76c) — Invoice with time-locked escrow
- [Recurring Billing](https://stellar.expert/explorer/testnet/tx/2f5e2344337de8f4c578f5d91861db4425ebcfcf967b4d1430c0434d9e77ea64) — Subscription invoice setup

**Test Account**: [GD4Q2BH6...RS63](https://stellar.expert/explorer/testnet/account/GD4Q2BH6KISIHTZWV5CSUMZC7VUBQAAXPNVSCESTUGH5WEYALMOTRS63)

###  Recommended Wallet for Testing
**Freighter** — Browser-based, instant signing, no phone required.  
 [Freighter Setup Guide](./FREIGHTER_SETUP.md) | 🧪 [Testing Guide](./TESTING.md)

<img width="1047" height="649" alt="image" src="https://github.com/user-attachments/assets/fa30c2c8-3f8c-4ebb-b0f1-373d6dab27eb" />


---

## Architecture

```mermaid
graph TD
    User["User / Browser"]
    Agent["AI Agent / HTTP Client"]
    Freighter["Freighter Wallet"]
    App["sharpy-app\nNext.js 14 · Vercel"]
    SDK["@stellar-sharpy/sdk\nTypeScript SDK"]
    X402["x402 Protocol\n/api/x402/[id]"]
    RPC["Soroban RPC\nstellar-sdk 16.0.1"]
    Contract["Sharpy Contract\nSoroban · Protocol 27"]
    Stellar["Stellar Network"]
    Horizon["Horizon API"]

    User -->|"connects wallet"| Freighter
    User -->|"interacts with UI"| App
    Agent -->|"GET /api/x402/[id]"| X402
    X402 -->|"settle via facilitator"| SDK
    App -->|"calls methods"| SDK
    Freighter -->|"signs transactions"| SDK
    SDK -->|"simulate + submit"| RPC
    RPC -->|"executes"| Contract
    Contract -->|"state + events"| Stellar
    Stellar -->|"event polling"| Horizon
    Horizon -->|"invoice history"| App
```

---

## Features

### Invoice Management
- Create invoices with Fixed, Percentage, or Tiered split rules
- Multi-recipient — split to any number of recipients
- Multi-token — USDC, XLM, AQUA, yXLM per recipient
- Recurring invoices — auto-generate next invoice on release
- Batch creation — up to 10 invoices in one transaction
- Cancel & refund — creator cancels and refunds all payers
- Payout preview — see exact per-recipient breakdown before signing
- Split rules display — visual breakdown of Fixed / Percentage / Tiered rules
- Recurring invoice timeline — vertical chain visualization of subscription history
- Invoice stats tab — completion ring, payer count, payment history bar chart

### Payments
- Pay toward any invoice with Freighter wallet
- Pool payments — pay multiple invoices in one call
- Transaction confirmation step indicators (Signing → Submitting → Confirming → Done)
- QR code for sharing invoice payment links
- Copy-to-clipboard for invoice URLs and contract address
- Deadline countdown timer — live updates every second
- Verified badge — displayed when invoice is fully funded

### Escrow
- Enable escrow on any invoice with configurable release delay
- Escrow release management page
- Dispute mechanism with optional arbitrator
- CCTP cross-chain status banner with localStorage persistence

### x402 Agentic Payments
- Public `/pay/[id]` page with three payment modes: Wallet, x402 / Agent, Cross-chain (CCTP)
- `/api/x402/[id]` endpoint — AI agents pay invoices via HTTP 402 protocol
- `GET` returns structured payment requirements, `POST` verifies and settles
- CCTP cross-chain tab — bridge USDC from Arbitrum, Ethereum, or Base to Stellar via Circle CCTP; generates hookData from connected wallet, polls Circle attestation API, completes inbound transfer via Freighter

### Verification & Transparency
- Public `/verify/[id]` — on-chain verification with no login required (SSR)
- SHA-256 invoice fingerprint display (Protocol 25/26 CAP-75/82)
- Audit log tab showing full on-chain history
- Export invoice as image (html2canvas)
- Share button with Twitter/Email integration

### UX
- Dashboard with search, filter by status, and Created/Paid tabs
- Dark/light mode with system preference detection
- Fully responsive — mobile-first layouts
- Skeleton loading states on all async pages
- Error boundary with graceful fallback
- Empty state illustrations for dashboard and invoice list
- Network indicator (testnet/mainnet)
- Token icon display per recipient

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 3 + CSS custom properties |
| Fonts | Inter (body) + Space Grotesk (display) |
| Wallet | Freighter (`@stellar/freighter-api` v3) |
| Contract SDK | `@stellar-sharpy/sdk` (local workspace) |
| x402 | `@x402/stellar` v2.17.0 |
| Deploy | Vercel |

---

## Pages & Routes

| Route | Type | Description |
|-------|------|-------------|
| `/` | Static | Landing page with feature highlights and CTAs |
| `/dashboard` | Client | Wallet-gated invoice list with search and filter |
| `/invoice/new` | Client | Create invoice — single, escrow, or recurring |
| `/invoice/[id]` | Dynamic | Invoice detail, funding progress, pay button, QR code |
| `/invoice/[id]/escrow` | Dynamic | Escrow release and dispute management |
| `/invoice/[id]/recurring` | Dynamic | Recurring invoice chain viewer |
| `/invoice/[id]/cancel` | Dynamic | Creator cancel and refund |
| `/verify/[id]` | SSR | Public on-chain verification with fingerprint |
| `/pay/[id]` | Client | Public shareable payment page — wallet, x402, and CCTP cross-chain |
| `/api/x402/[id]` | API | x402 HTTP endpoint (GET: requirements, POST: settle) |

---

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
# Edit .env.local with your values
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment Variables

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
| `NEXT_PUBLIC_RPC_URL` | Soroban RPC endpoint URL |
| `NEXT_PUBLIC_USDC_CONTRACT_ID` | Native USDC contract ID on network |

---

## Build

```bash
npm run build    # builds SDK workspace then Next.js
npm run start    # production server
npm run lint     # ESLint + TypeScript check
npm run test:e2e # Playwright end-to-end tests
```

---

## Project Structure

```
sharpy-app/
├── packages/
│   └── sdk/                    # @stellar-sharpy/sdk (local workspace)
│       ├── src/
│       │   ├── client.ts       # SharpyClient — all contract methods
│       │   ├── wallet.ts       # Freighter v3 wallet helpers
│       │   ├── utils.ts        # parseAmount, formatAmount, etc.
│       │   ├── errors.ts       # Typed error classes
│       │   └── index.ts        # Public exports + NETWORKS constant
│       └── package.json
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── page.tsx            # Landing page
│   │   ├── layout.tsx          # Root layout
│   │   ├── globals.css         # Tailwind + CSS design system
│   │   ├── dashboard/
│   │   ├── invoice/
│   │   │   ├── new/
│   │   │   └── [id]/
│   │   │       ├── page.tsx
│   │   │       ├── escrow/
│   │   │       ├── recurring/
│   │   │       └── cancel/
│   │   ├── pay/[id]/           # Public shareable payment page
│   │   ├── verify/[id]/        # SSR public verification
│   │   └── api/x402/[id]/      # x402 HTTP payment endpoint
│   ├── components/
│   │   ├── Navbar.tsx          # Sticky navbar with theme toggle
│   │   ├── WalletProvider.tsx  # Freighter wallet context
│   │   ├── Providers.tsx       # ThemeProvider + WalletProvider
│   │   ├── TokenSelector.tsx   # Multi-token dropdown
│   │   └── CopyButton.tsx      # Copy to clipboard
│   └── lib/
│       ├── client.ts           # SDK client setup from env vars
│       ├── tokens.ts           # Token registry (USDC, XLM, AQUA, yXLM)
│       └── utils.ts            # Formatting helpers
├── public/
│   ├── logo.svg
│   ├── logo.png
│   └── favicon.ico
├── .env.example
├── next.config.js
├── tailwind.config.js
└── package.json
```

---

## Protocol Compatibility

| stellar-sdk | Protocol | Status | Features |
|-------------|----------|--------|---------|
| 16.0.1 | 27 | ✅ Current | CAP-71 auth delegation ready |

### Protocol 25/26 Integration

| Feature | Route | Description |
|---------|-------|-------------|
| Invoice fingerprint (CAP-75/82) | `/verify/[id]` | SHA-256 content hash displayed with copy button |
| TTL extension (CAP-78) | SDK `bumpInvoiceTtl` | Available via SDK for long-lived invoice maintenance |

---

## Related Repos

| Repo | Description |
|------|-------------|
| [sharpy-contracts](https://github.com/stellar-sharpy/sharpy-contracts) | Soroban smart contract (Rust) |
| [sharpy-sdk](https://github.com/stellar-sharpy/sharpy-sdk) | TypeScript SDK |

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Always test with Freighter connected to testnet before opening a PR.

## Security

See [SECURITY.md](SECURITY.md) for the vulnerability disclosure process.

## License

[MIT](LICENSE)
