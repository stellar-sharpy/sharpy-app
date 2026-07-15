import { isConnected, requestAccess, getAddress, signTransaction as signTransaction$1 } from '@stellar/freighter-api';
import { Contract, TransactionBuilder, BASE_FEE, xdr, Address, nativeToScVal, scValToNative } from '@stellar/stellar-sdk';
import { Server } from '@stellar/stellar-sdk/rpc';

// src/wallet.ts
async function connectWallet() {
  const connected = await isConnected();
  if (!connected.isConnected) throw new Error("Freighter wallet not found. Please install the Freighter extension.");
  await requestAccess();
  const result = await getAddress();
  if ("error" in result) throw new Error(`Could not get address: ${result.error}`);
  return result.address;
}
async function getWalletPublicKey() {
  try {
    const connected = await isConnected();
    if (!connected.isConnected) return null;
    const result = await getAddress();
    if ("error" in result) return null;
    return result.address;
  } catch {
    return null;
  }
}
async function signTransaction(xdr2, networkPassphrase) {
  const result = await signTransaction$1(xdr2, { networkPassphrase });
  if ("error" in result) throw new Error(`Signing failed: ${result.error}`);
  return result.signedTxXdr;
}

// src/errors.ts
var InvoiceNotFoundError = class extends Error {
  constructor(invoiceId) {
    super(`Invoice #${invoiceId} not found`);
    this.name = "InvoiceNotFoundError";
  }
};
var DeadlinePassedError = class extends Error {
  constructor(invoiceId) {
    super(`Invoice #${invoiceId} deadline has passed`);
    this.name = "DeadlinePassedError";
  }
};
var InvoiceNotPendingError = class extends Error {
  constructor(invoiceId) {
    super(`Invoice #${invoiceId} is not pending`);
    this.name = "InvoiceNotPendingError";
  }
};
var OverpaymentError = class extends Error {
  constructor(invoiceId) {
    super(`Payment exceeds remaining balance for invoice #${invoiceId}`);
    this.name = "OverpaymentError";
  }
};
function mapContractError(message, invoiceId) {
  const id = invoiceId ?? 0;
  const m = message.toLowerCase();
  if (m.includes("not found")) return new InvoiceNotFoundError(id);
  if (m.includes("deadline")) return new DeadlinePassedError(id);
  if (m.includes("not pending")) return new InvoiceNotPendingError(id);
  if (m.includes("overpayment") || m.includes("exceeds") || m.includes("remaining balance")) return new OverpaymentError(id);
  return new Error(message);
}
var SharpyClient = class {
  constructor(config) {
    this.config = config;
    this.server = new Server(config.rpcUrl);
  }
  async buildAndSubmit(sourcePublicKey, method, args, invoiceId) {
    const account = await this.server.getAccount(sourcePublicKey);
    const contract = new Contract(this.config.contractId);
    const tx = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: this.config.networkPassphrase
    }).addOperation(contract.call(method, ...args)).setTimeout(30).build();
    const simResult = await this.server.simulateTransaction(tx);
    if ("error" in simResult) throw mapContractError(`Simulation failed: ${simResult.error}`, invoiceId);
    const { assembleTransaction } = await import('@stellar/stellar-sdk/rpc');
    const assembled = assembleTransaction(tx, simResult);
    const signed = await signTransaction(assembled.toXDR(), this.config.networkPassphrase);
    const { TransactionBuilder: TB } = await import('@stellar/stellar-sdk');
    const signedTx = TB.fromXDR(signed, this.config.networkPassphrase);
    const sendResult = await this.server.sendTransaction(signedTx);
    if (sendResult.status === "ERROR") throw new Error(`Submit failed: ${JSON.stringify(sendResult.errorResult)}`);
    let getResult;
    for (let i = 0; i < 20; i++) {
      await new Promise((r) => setTimeout(r, 1500));
      getResult = await this.server.getTransaction(sendResult.hash);
      if (getResult.status !== "NOT_FOUND") break;
    }
    if (!getResult || getResult.status !== "SUCCESS") {
      throw mapContractError(`Transaction failed: ${getResult?.status}`, invoiceId);
    }
    return {
      txHash: sendResult.hash,
      result: getResult.returnValue ?? xdr.ScVal.scvVoid()
    };
  }
  /** Creates a single invoice with split rules and escrow options.
   * @param params Invoice creation parameters including recipients, token, deadline, and options
   * @returns Invoice ID and transaction hash
   */
  async createInvoice(params) {
    const args = [
      new Address(params.creator).toScVal(),
      nativeToScVal(params.recipients.map((r) => new Address(r.address).toScVal())),
      nativeToScVal(params.recipients.map((r) => r.amount)),
      new Address(params.token).toScVal(),
      nativeToScVal(params.deadline, { type: "u64" }),
      buildInvoiceOptions(params)
    ];
    const { txHash, result } = await this.buildAndSubmit(params.creator, "create_invoice", args);
    return { invoiceId: Number(scValToNative(result)), txHash };
  }
  /** Creates a recurring invoice that auto-generates the next invoice on release.
   * @param params Recurring invoice parameters including interval and max recurrences
   * @returns Invoice ID and transaction hash
   */
  async createRecurring(params) {
    const args = [
      new Address(params.creator).toScVal(),
      nativeToScVal(params.recipients.map((r) => new Address(r.address).toScVal())),
      nativeToScVal(params.recipients.map((r) => r.amount)),
      new Address(params.token).toScVal(),
      nativeToScVal(params.deadline, { type: "u64" }),
      nativeToScVal(params.recurrenceInterval, { type: "u64" }),
      nativeToScVal(params.maxRecurrences, { type: "u32" })
    ];
    const { txHash, result } = await this.buildAndSubmit(params.creator, "create_recurring", args);
    return { invoiceId: Number(scValToNative(result)), txHash };
  }
  /** Pays toward a single invoice.
   * @param payer Payer address (must sign)
   * @param invoiceId Target invoice ID
   * @param amount Amount in stroops (bigint)
   * @returns Transaction hash
   */
  async pay(payer, invoiceId, amount) {
    const args = [
      new Address(payer).toScVal(),
      nativeToScVal(invoiceId, { type: "u64" }),
      nativeToScVal(amount, { type: "i128" })
    ];
    const { txHash } = await this.buildAndSubmit(payer, "pay", args, invoiceId);
    return { txHash };
  }
  /** Releases escrow-held funds once the delay period has passed.
   * @param caller Caller address
   * @param invoiceId Invoice ID with escrow enabled
   */
  async releaseEscrow(caller, invoiceId) {
    const args = [nativeToScVal(invoiceId, { type: "u64" })];
    const { txHash } = await this.buildAndSubmit(caller, "release_escrow", args, invoiceId);
    return { txHash };
  }
  /** Refunds all payers after deadline has passed and invoice is not fully funded.
   * @param caller Any address can trigger the refund
   * @param invoiceId Invoice ID that has passed its deadline
   */
  async refund(caller, invoiceId) {
    const args = [nativeToScVal(invoiceId, { type: "u64" })];
    const { txHash } = await this.buildAndSubmit(caller, "refund", args, invoiceId);
    return { txHash };
  }
  /** Cancels an invoice and refunds all payments. Only the creator can cancel.
   * @param caller Creator address
   * @param invoiceId Invoice ID to cancel
   */
  /** Cancels an invoice and refunds all payments. Only the creator can cancel.
   * @param caller Creator address
   * @param invoiceId Invoice ID to cancel
   */
  async cancelInvoice(caller, invoiceId) {
    const args = [
      new Address(caller).toScVal(),
      nativeToScVal(invoiceId, { type: "u64" })
    ];
    const { txHash } = await this.buildAndSubmit(caller, "cancel_invoice", args, invoiceId);
    return { txHash };
  }
  /** Fetches full invoice state by ID.
   * @param invoiceId Invoice ID to fetch
   * @throws InvoiceNotFoundError if the invoice does not exist
   */
  async getInvoice(invoiceId) {
    const account = await this.server.getAccount(
      "GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN"
      // read-only placeholder
    );
    const contract = new Contract(this.config.contractId);
    const tx = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: this.config.networkPassphrase
    }).addOperation(contract.call("get_invoice", nativeToScVal(invoiceId, { type: "u64" }))).setTimeout(30).build();
    const sim = await this.server.simulateTransaction(tx);
    if ("error" in sim) throw mapContractError(`Simulation failed: ${sim.error}`, invoiceId);
    const raw = scValToNative(sim.result.retval);
    return mapInvoice(raw);
  }
  /** Creates up to 10 invoices in a single transaction.
   * @param creator Creator address
   * @param invoices Array of invoice parameters (max 10)
   * @returns Array of invoice IDs and transaction hash
   */
  async createBatch(creator, invoices) {
    const batchArg = xdr.ScVal.scvVec(
      invoices.map(
        (inv) => xdr.ScVal.scvMap([
          new xdr.ScMapEntry({ key: xdr.ScVal.scvSymbol("amounts"), val: nativeToScVal(inv.recipients.map((r) => r.amount)) }),
          new xdr.ScMapEntry({ key: xdr.ScVal.scvSymbol("deadline"), val: nativeToScVal(inv.deadline, { type: "u64" }) }),
          new xdr.ScMapEntry({ key: xdr.ScVal.scvSymbol("recipients"), val: nativeToScVal(inv.recipients.map((r) => new Address(r.address).toScVal())) }),
          new xdr.ScMapEntry({ key: xdr.ScVal.scvSymbol("token"), val: new Address(inv.token).toScVal() })
        ])
      )
    );
    const args = [new Address(creator).toScVal(), batchArg];
    const { txHash, result } = await this.buildAndSubmit(creator, "create_batch", args);
    const ids = scValToNative(result).map(Number);
    return { invoiceIds: ids, txHash };
  }
  /** Fetches the full audit trail for an invoice.
   * @param invoiceId Invoice ID
   * @returns Array of audit entries with action, actor, and timestamp
   */
  async getAuditLog(invoiceId) {
    const account = await this.server.getAccount("GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN");
    const contract = new Contract(this.config.contractId);
    const tx = new TransactionBuilder(account, { fee: BASE_FEE, networkPassphrase: this.config.networkPassphrase }).addOperation(contract.call("get_audit_log", nativeToScVal(invoiceId, { type: "u64" }))).setTimeout(30).build();
    const sim = await this.server.simulateTransaction(tx);
    if ("error" in sim) throw new Error(`Simulation failed: ${sim.error}`);
    const raw = scValToNative(sim.result.retval);
    return raw.map((e) => ({ action: e.action, actor: e.actor, timestamp: Number(e.timestamp) }));
  }
  /** Returns the next invoice ID in a recurring chain, or null if none.
   * @param invoiceId Current invoice ID
   */
  async getNextRecurring(invoiceId) {
    const account = await this.server.getAccount(
      "GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN"
    );
    const contract = new Contract(this.config.contractId);
    const tx = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: this.config.networkPassphrase
    }).addOperation(contract.call("get_next_recurring", nativeToScVal(invoiceId, { type: "u64" }))).setTimeout(30).build();
    const sim = await this.server.simulateTransaction(tx);
    if ("error" in sim) throw new Error(`Simulation failed: ${sim.error}`);
    const raw = scValToNative(sim.result.retval);
    return raw ?? null;
  }
  /** Pays toward multiple invoices in a single transaction. All invoices must use the same token.
   * @param payer Payer address (must sign)
   * @param payments Array of { invoiceId, amount } pairs
   * @returns Transaction hash
   */
  async poolPay(payer, payments) {
    const paymentsArg = xdr.ScVal.scvVec(
      payments.map(
        (p) => xdr.ScVal.scvMap([
          new xdr.ScMapEntry({ key: xdr.ScVal.scvSymbol("amount"), val: nativeToScVal(p.amount, { type: "i128" }) }),
          new xdr.ScMapEntry({ key: xdr.ScVal.scvSymbol("invoice_id"), val: nativeToScVal(p.invoiceId, { type: "u64" }) })
        ])
      )
    );
    const args = [new Address(payer).toScVal(), paymentsArg];
    const { txHash } = await this.buildAndSubmit(payer, "pool_pay", args);
    return { txHash };
  }
  /** Returns the total amount paid toward an invoice by a specific address.
   * @param invoiceId Invoice ID
   * @param payer Payer address to query
   * @returns Total paid in stroops
   */
  async getPayerTotal(invoiceId, payer) {
    const account = await this.server.getAccount("GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN");
    const contract = new Contract(this.config.contractId);
    const tx = new TransactionBuilder(account, { fee: BASE_FEE, networkPassphrase: this.config.networkPassphrase }).addOperation(contract.call(
      "get_payer_total",
      nativeToScVal(invoiceId, { type: "u64" }),
      new Address(payer).toScVal()
    )).setTimeout(30).build();
    const sim = await this.server.simulateTransaction(tx);
    if ("error" in sim) throw new Error(`Simulation failed: ${sim.error}`);
    return BigInt(scValToNative(sim.result.retval) ?? 0);
  }
  /** Returns funding stats for an invoice: funded, total, payment_count, unique_payers, completion_bps.
   * @param invoiceId Invoice ID
   */
  async getInvoiceStats(invoiceId) {
    const account = await this.server.getAccount("GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN");
    const contract = new Contract(this.config.contractId);
    const tx = new TransactionBuilder(account, { fee: BASE_FEE, networkPassphrase: this.config.networkPassphrase }).addOperation(contract.call("get_invoice_stats", nativeToScVal(invoiceId, { type: "u64" }))).setTimeout(30).build();
    const sim = await this.server.simulateTransaction(tx);
    if ("error" in sim) throw new Error(`Simulation failed: ${sim.error}`);
    const raw = scValToNative(sim.result.retval);
    return {
      funded: BigInt(raw.funded ?? 0),
      total: BigInt(raw.total ?? 0),
      paymentCount: Number(raw.payment_count ?? 0),
      uniquePayers: Number(raw.unique_payers ?? 0),
      completionBps: Number(raw.completion_bps ?? 0)
    };
  }
  /**
   * Extend the TTL of an invoice entry to prevent archival.
   * Protocol 26 CAP-78: anyone can call this to keep long-lived or recurring
   * invoices accessible without a full state restore operation.
   * @param caller - The address submitting the transaction (pays fees)
   * @param invoiceId - The invoice to bump
   */
  async bumpInvoiceTtl(caller, invoiceId) {
    const args = [nativeToScVal(invoiceId, { type: "u64" })];
    const { txHash } = await this.buildAndSubmit(caller, "bump_invoice_ttl", args);
    return { txHash };
  }
  /**
   * Get a deterministic SHA-256 fingerprint of an invoice's immutable fields.
   * Protocol 25 (X-Ray) / Protocol 26 crypto host functions: tamper-evident
   * content hash committing to invoice_id, deadline, recipient count, and total.
   * Use for off-chain verification, receipt generation, and audit trails.
   * @param invoiceId - The invoice to fingerprint
   * @returns 32-byte hex string (SHA-256 hash)
   */
  async getInvoiceFingerprint(invoiceId) {
    const account = await this.server.getAccount("GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN");
    const contract = new Contract(this.config.contractId);
    const tx = new TransactionBuilder(account, { fee: BASE_FEE, networkPassphrase: this.config.networkPassphrase }).addOperation(contract.call("get_invoice_fingerprint", nativeToScVal(invoiceId, { type: "u64" }))).setTimeout(30).build();
    const sim = await this.server.simulateTransaction(tx);
    if ("error" in sim) throw new Error(`Simulation failed: ${sim.error}`);
    const raw = scValToNative(sim.result.retval);
    if (raw instanceof Uint8Array || Buffer.isBuffer(raw)) {
      return Buffer.from(raw).toString("hex");
    }
    return String(raw);
  }
};
function buildInvoiceOptions(params) {
  return xdr.ScVal.scvMap([
    new xdr.ScMapEntry({
      key: xdr.ScVal.scvSymbol("auto_resolve_rules"),
      val: xdr.ScVal.scvVec([])
    }),
    new xdr.ScMapEntry({
      key: xdr.ScVal.scvSymbol("escrow_enabled"),
      val: xdr.ScVal.scvBool(params.escrowEnabled ?? false)
    }),
    new xdr.ScMapEntry({
      key: xdr.ScVal.scvSymbol("escrow_release_delay"),
      val: params.escrowReleaseDelay ? xdr.ScVal.scvVec([nativeToScVal(params.escrowReleaseDelay, { type: "u64" })]) : xdr.ScVal.scvVec([])
    }),
    new xdr.ScMapEntry({
      key: xdr.ScVal.scvSymbol("split_rules"),
      val: xdr.ScVal.scvVec(
        (params.splitRules ?? []).map((r) => encodeSplitRule(r))
      )
    })
  ]);
}
function encodeSplitRule(rule) {
  if (rule.type === "Fixed") {
    return xdr.ScVal.scvVec([
      xdr.ScVal.scvSymbol("Fixed"),
      nativeToScVal(rule.amount, { type: "i128" })
    ]);
  }
  if (rule.type === "Percentage") {
    return xdr.ScVal.scvVec([
      xdr.ScVal.scvSymbol("Percentage"),
      nativeToScVal(rule.bps, { type: "u32" })
    ]);
  }
  return xdr.ScVal.scvVec([
    xdr.ScVal.scvSymbol("Tiered"),
    nativeToScVal(rule.threshold, { type: "i128" }),
    nativeToScVal(rule.bps, { type: "u32" })
  ]);
}
function mapInvoice(raw) {
  return {
    version: raw.version,
    creator: raw.creator,
    recipients: raw.recipients,
    amounts: raw.amounts,
    tokens: raw.tokens,
    deadline: Number(raw.deadline),
    funded: BigInt(raw.funded),
    status: raw.status,
    escrowEnabled: raw.escrow_enabled,
    escrowReleaseDelay: Number(raw.escrow_release_delay),
    completionTime: raw.completion_time ? Number(raw.completion_time) : void 0
  };
}

// src/utils.ts
var STROOPS_PER_UNIT = 10000000n;
function parseAmount(value) {
  const parts = value.split(".");
  const whole = parts[0] ?? "0";
  const frac = (parts[1] ?? "").slice(0, 7).padEnd(7, "0");
  return BigInt(whole) * STROOPS_PER_UNIT + BigInt(frac);
}
function formatAmount(stroops) {
  const whole = stroops / STROOPS_PER_UNIT;
  const frac = stroops % STROOPS_PER_UNIT;
  if (frac === 0n) return whole.toString();
  return `${whole}.${frac.toString().padStart(7, "0").replace(/0+$/, "")}`;
}
function deadlineFromDays(days) {
  return Math.floor(Date.now() / 1e3) + days * 86400;
}
function isExpired(deadline) {
  return Math.floor(Date.now() / 1e3) > deadline;
}
function isValidAddress(address) {
  return /^G[A-Z2-7]{55}$/.test(address);
}
function truncateAddress(address) {
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}
function explorerUrl(network, contractId, type = "contract") {
  const net = network === "testnet" ? "testnet" : "public";
  return `https://stellar.expert/explorer/${net}/${type}/${contractId}`;
}

export { DeadlinePassedError, InvoiceNotFoundError, InvoiceNotPendingError, OverpaymentError, SharpyClient, connectWallet, deadlineFromDays, explorerUrl, formatAmount, getWalletPublicKey, isExpired, isValidAddress, parseAmount, signTransaction, truncateAddress };
//# sourceMappingURL=chunk-WEQU3XND.js.map
//# sourceMappingURL=chunk-WEQU3XND.js.map