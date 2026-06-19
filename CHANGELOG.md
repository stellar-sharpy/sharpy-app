# Changelog

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
