# Changelog

## [0.2.0] - 2026-07-18

### Added
- Stellar Wallets Kit — Freighter, Lobstr, xBull, WalletConnect, Hana, Ledger and more
- Multi-wallet modal selector on every Connect click
- WalletConnect support for mobile payments
- `/pay/[id]` public shareable payment page (wallet + x402 agentic mode)
- `/api/x402/[id]` x402 HTTP endpoint via OpenZeppelin facilitator
- `/invoice/[id]/cancel` creator cancel page
- Audit log tab on invoice detail (`AuditLogTab`, `Tabs` components)
- Feature card images with hover zoom on landing page
- Animated background orbs on landing page
- Protocol 25/26 invoice fingerprint on `/verify/[id]`
- Multi-token registry and TokenSelector dropdown
- Dashboard search and filter
- QR codes, copy-to-clipboard, tx step indicators

### Changed
- Wallet disconnect fully clears session — no auto-reconnect
- Light mode contrast improved throughout
- Contract redeployed: `CBJ7WNBHCO5LKM7LW33D7HUT7WZI5OROVPC7IJL3A6NT6HMVJ4XUWPHJ`
- `SharpyClient` accepts optional `signTransaction` override via signerRegistry

### Fixed
- Wallet auto-reconnect after disconnect
- Light mode text/badge visibility
- WASM build target updated to `wasm32v1-none` for Rust 1.84+

## [0.1.0] - 2026-06-01

### Added
- Landing page with feature highlights and stats bar
- `/dashboard` — wallet-gated invoice list with funding progress bars
- `/invoice/new` — create invoice form with toggle switches for escrow and recurring options
- `/invoice/[id]` — invoice detail with pay button, recipient breakdown, progress
- `/invoice/[id]/escrow` — escrow release management
- `/invoice/[id]/recurring` — recurring chain viewer
- `/verify/[id]` — public SSR on-chain verification (no wallet required)
- WalletProvider context with Freighter v3 integration
- Sticky navbar with connect/disconnect and theme toggle
- Dark/light mode via `next-themes` with CSS custom properties
- Dark theme: `#0A0B0F` bg, `#6C63FF` primary, `#00D4AA` accent
- Light theme: clean white/gray surfaces with same accent palette
- Custom Tailwind component classes: `card`, `btn-primary`, `btn-ghost`, `input`, `badge`, `progress-bar`
- Skeleton loading states on all async pages
- Project logo and favicon integrated
- Deployed to Vercel: https://sharpy-sigma.vercel.app
