# Contributing to sharpy-app

Thank you for contributing to the Sharpy frontend dApp!

## Getting Started

```bash
git clone https://github.com/stellar-sharpy/sharpy-app.git
cd sharpy-app
npm install
cp .env.example .env.local
npm run dev
```

You'll need the [Freighter](https://freighter.app) browser extension to test wallet interactions.

## How to Contribute

### Reporting Bugs

Use the **Bug Report** template. Include browser, wallet version, and steps to reproduce.

### Suggesting Features

Use the **Feature Request** template. Reference the page/route and describe the user experience.

### Pull Requests

1. Fork and branch from `main`
2. Run `npm run lint` — 0 errors
3. Run `npm run build` — must succeed
4. Test in browser with Freighter connected to testnet
5. Open a PR with screenshots if UI changes are involved

## Code Standards

- Use Tailwind CSS utility classes — no inline styles except for CSS variables
- All pages that require a wallet must show a connect prompt when disconnected
- Keep contract interactions in `src/lib/client.ts` only
- New pages must be added to the route table in the README

## Environment

Always develop against testnet:
```
NEXT_PUBLIC_STELLAR_NETWORK=testnet
NEXT_PUBLIC_CONTRACT_ID=CAYTIFPD6RFWVHMK5SPPUUIWWAAANHKOJB6GOAJS5SR5MBKZMEY2UODZ
```

## License

MIT
