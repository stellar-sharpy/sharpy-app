# @stellar-sharpy/sdk

![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![stellar-sdk](https://img.shields.io/badge/stellar--sdk-16.0.1-6C63FF)
![License](https://img.shields.io/badge/license-MIT-green)
![Version](https://img.shields.io/badge/version-0.2.0-6C63FF)

TypeScript SDK for **Sharpy** — advanced split payment protocol on Stellar. Interact with the Sharpy Soroban smart contract to create invoices, manage payments, and query invoice state.

---

## Installation

```bash
npm install @stellar-sharpy/sdk
```

---

## Quick Start

```typescript
import { SharpyClient, connectWallet, parseAmount, deadlineFromDays, NETWORKS } from "@stellar-sharpy/sdk";

// Connect Freighter wallet
const publicKey = await connectWallet();

// Initialize client
const client = new SharpyClient(NETWORKS.testnet);

// Create a split invoice
const { invoiceId } = await client.createInvoice({
  creator: publicKey,
  recipients: [
    { address: "GABC...1", amount: parseAmount("60") },
    { address: "GDEF...2", amount: parseAmount("40") },
  ],
  token: NETWORKS.testnet.nativeContractId,
  deadline: deadlineFromDays(7),
});

console.log(`Invoice created: ${invoiceId}`);

// Pay the invoice
await client.pay(publicKey, invoiceId, parseAmount("100"));

// Check status
const invoice = await client.getInvoice(invoiceId);
console.log(invoice.status); // "Released"
```

---

## Live Examples

See the SDK in action with real testnet transactions:

- [Create Invoice #3](https://stellar.expert/explorer/testnet/tx/ce46bcef570a4c05f6348081126135c9f24165c5e470a6b51b923f423156c5da) — Basic invoice creation
- [Batch Creation](https://stellar.expert/explorer/testnet/tx/97cee323bb5443ddc8439f9d99f5a34e585f8cf74872a6138c5f1456adb5ab90) — Multiple invoices in one call
- [Multi-recipient Split](https://stellar.expert/explorer/testnet/tx/785d079c53350fdf50db1e6d92da2219e148b204b87b6448632d1e21a94faac4) — Split payment to multiple addresses
- [Escrow Protection](https://stellar.expert/explorer/testnet/tx/db19f9206a4a25b4431b6a3dfae25080f3c20a285249521aac5e593f1c26e76c) — Invoice with time-locked escrow
- [Recurring Billing](https://stellar.expert/explorer/testnet/tx/2f5e2344337de8f4c578f5d91861db4425ebcfcf967b4d1430c0434d9e77ea64) — Subscription invoice setup

**Test Account**: [GD4Q2BH6...RS63](https://stellar.expert/explorer/testnet/account/GD4Q2BH6KISIHTZWV5CSUMZC7VUBQAAXPNVSCESTUGH5WEYALMOTRS63)

---

## Core Methods

### Invoice Creation

```typescript
// Basic invoice
await client.createInvoice({
  creator: publicKey,
  recipients: [{ address: "GABC...", amount: parseAmount("100") }],
  token: NETWORKS.testnet.nativeContractId,
  deadline: deadlineFromDays(7),
});

// Batch creation (up to 10 invoices)
await client.createBatch(publicKey, [invoice1, invoice2, invoice3]);

// Recurring invoice
await client.createRecurring({
  creator: publicKey,
  recipients: [{ address: "GABC...", amount: parseAmount("10") }],
  token: NETWORKS.testnet.nativeContractId,
  deadline: deadlineFromDays(30),
  interval: 2_592_000, // 30 days in seconds
  maxIterations: 12, // 12 months
});
```

### Payments

```typescript
// Single payment
await client.pay(payerPublicKey, invoiceId, parseAmount("50"));

// Pool pay (multiple invoices)
await client.poolPay(payerPublicKey, [
  { invoiceId: 1, amount: parseAmount("50") },
  { invoiceId: 2, amount: parseAmount("100") },
]);
```

### Invoice Queries

```typescript
// Get full invoice
const invoice = await client.getInvoice(invoiceId);

// Get invoice statistics
const stats = await client.getInvoiceStats(invoiceId);
console.log(stats.funded, stats.total, stats.completionBps);

// Get payer total
const total = await client.getPayerTotal(invoiceId, payerAddress);

// Get invoices by creator
const invoiceIds = await client.getInvoicesByCreator(creatorAddress);

// Preview payout amounts
const payouts = await client.previewPayout(invoiceId, parseAmount("100"));
```

### Escrow & Management

```typescript
// Release escrow (after delay)
await client.releaseEscrow(invoiceId);

// Dispute escrow
await client.disputeRelease(invoiceId);

// Resolve dispute (arbitrator only)
await client.resolveDispute(invoiceId, true); // true = release, false = refund

// Cancel invoice
await client.cancelInvoice(creatorPublicKey, invoiceId);

// Refund invoice
await client.refund(invoiceId);
```

### Protocol Features

```typescript
// Get invoice fingerprint (SHA-256 hash)
const fingerprint = await client.getInvoiceFingerprint(invoiceId);

// Bump invoice TTL (prevent archival)
await client.bumpInvoiceTtl(invoiceId);

// Get audit log
const log = await client.getAuditLog(invoiceId);

// Claim failed transfer balance
const claimed = await client.claim(accountAddress, tokenAddress);
```

---

## Configuration

### Custom Networks

```typescript
import { SharpyClient } from "@stellar-sharpy/sdk";

const client = new SharpyClient({
  contractId: "CAEWQX36RLGP2WY6ACOREDJEIGELYV3HWWUPGV3CJMC27OWGQWZHTH6T",
  rpcUrl: "https://soroban-testnet.stellar.org",
  networkPassphrase: "Test SDF Network ; September 2015",
  nativeContractId: "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC",
});
```

### Custom Signer

```typescript
import { SharpyClient } from "@stellar-sharpy/sdk";

const client = new SharpyClient(NETWORKS.testnet, {
  signTransaction: async (xdr) => {
    // Your custom signing logic
    return signedXdr;
  },
});
```

---

## Utilities

```typescript
import { parseAmount, formatAmount, deadlineFromDays } from "@stellar-sharpy/sdk";

// Parse human-readable amounts to stroops
const stroops = parseAmount("10.5"); // 105000000n

// Format stroops to human-readable
const formatted = formatAmount(105000000n); // "10.5"

// Create deadline timestamp
const deadline = deadlineFromDays(7); // Unix timestamp 7 days from now
```

---

## Error Handling

```typescript
import { InvoiceNotFoundError, DeadlinePassedError, InsufficientFundsError } from "@stellar-sharpy/sdk";

try {
  await client.pay(publicKey, invoiceId, parseAmount("100"));
} catch (error) {
  if (error instanceof InvoiceNotFoundError) {
    console.error("Invoice does not exist");
  } else if (error instanceof DeadlinePassedError) {
    console.error("Invoice deadline has passed");
  } else if (error instanceof InsufficientFundsError) {
    console.error("Insufficient balance");
  }
}
```

---

## TypeScript Types

```typescript
import type { Invoice, InvoiceStatus, SplitRule, InvoiceStats } from "@stellar-sharpy/sdk";

interface Invoice {
  version: number;
  creator: string;
  recipients: string[];
  amounts: bigint[];
  tokens: string[];
  deadline: number;
  funded: bigint;
  status: InvoiceStatus; // "Pending" | "Released" | "Refunded" | "Cancelled"
  escrowEnabled: boolean;
  escrowReleaseDelay: number;
  // ... other fields
}
```

---

## Related

- **dApp**: [sharpy-sigma.vercel.app](https://sharpy-sigma.vercel.app)
- **Contract**: [stellar-sharpy/sharpy-contracts](https://github.com/stellar-sharpy/sharpy-contracts)
- **Pitch Deck**: [View on Gamma](https://gamma.app/docs/Split-Payments-on-Stellar-s0et8z1agtva59n)

---

## License

MIT — see [LICENSE](../../LICENSE)
