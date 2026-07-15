# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 0.1.x | ✅ Active |

## Reporting a Vulnerability

**Do not open a public GitHub issue for security vulnerabilities.**

Report via [GitHub Security Advisory](https://github.com/stellar-sharpy/sharpy-app/security/advisories/new) or contact the maintainers directly.

Include:
- Description of the vulnerability
- Affected page or component
- Steps to reproduce
- Potential impact

We will acknowledge within 48 hours and aim to release a fix within 7 days.

## Scope

- Wallet connection or signing vulnerabilities
- x402 payment flow exploits (replay, invoice binding bypass)
- XSS or injection vulnerabilities in invoice data rendering
- Environment variable exposure

## Out of Scope

- Stellar network-level issues
- Third-party wallet vulnerabilities (Freighter, etc.)
- UI/UX bugs with no security impact

## Disclosure Policy

We follow coordinated disclosure. Please give us reasonable time to patch before public disclosure.
