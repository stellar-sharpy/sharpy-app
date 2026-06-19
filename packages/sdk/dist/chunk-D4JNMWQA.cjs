'use strict';

var freighterApi = require('@stellar/freighter-api');
var stellarSdk = require('@stellar/stellar-sdk');
var rpc = require('@stellar/stellar-sdk/rpc');

// src/wallet.ts
async function connectWallet() {
  const connected = await freighterApi.isConnected();
  if (!connected.isConnected) throw new Error("Freighter wallet not found. Please install the Freighter extension.");
  await freighterApi.requestAccess();
  const result = await freighterApi.getAddress();
  if ("error" in result) throw new Error(`Could not get address: ${result.error}`);
  return result.address;
}
async function getWalletPublicKey() {
  try {
    const connected = await freighterApi.isConnected();
    if (!connected.isConnected) return null;
    const result = await freighterApi.getAddress();
    if ("error" in result) return null;
    return result.address;
  } catch {
    return null;
  }
}
async function signTransaction(xdr2, networkPassphrase) {
  const result = await freighterApi.signTransaction(xdr2, { networkPassphrase });
  if ("error" in result) throw new Error(`Signing failed: ${result.error}`);
  return result.signedTxXdr;
}
var SharpyClient = class {
  constructor(config) {
    this.config = config;
    this.server = new rpc.Server(config.rpcUrl);
  }
  async buildAndSubmit(sourcePublicKey, method, args) {
    const account = await this.server.getAccount(sourcePublicKey);
    const contract = new stellarSdk.Contract(this.config.contractId);
    const tx = new stellarSdk.TransactionBuilder(account, {
      fee: stellarSdk.BASE_FEE,
      networkPassphrase: this.config.networkPassphrase
    }).addOperation(contract.call(method, ...args)).setTimeout(30).build();
    const simResult = await this.server.simulateTransaction(tx);
    if ("error" in simResult) throw new Error(`Simulation failed: ${simResult.error}`);
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
      throw new Error(`Transaction failed: ${getResult?.status}`);
    }
    return {
      txHash: sendResult.hash,
      result: getResult.returnValue ?? stellarSdk.xdr.ScVal.scvVoid()
    };
  }
  async createInvoice(params) {
    const args = [
      new stellarSdk.Address(params.creator).toScVal(),
      stellarSdk.nativeToScVal(params.recipients.map((r) => new stellarSdk.Address(r.address).toScVal()), { type: "vec" }),
      stellarSdk.nativeToScVal(params.recipients.map((r) => r.amount), { type: "vec" }),
      new stellarSdk.Address(params.token).toScVal(),
      stellarSdk.nativeToScVal(params.deadline, { type: "u64" }),
      buildInvoiceOptions(params)
    ];
    const { txHash, result } = await this.buildAndSubmit(params.creator, "create_invoice", args);
    return { invoiceId: Number(stellarSdk.scValToNative(result)), txHash };
  }
  async createRecurring(params) {
    const args = [
      new stellarSdk.Address(params.creator).toScVal(),
      stellarSdk.nativeToScVal(params.recipients.map((r) => new stellarSdk.Address(r.address).toScVal()), { type: "vec" }),
      stellarSdk.nativeToScVal(params.recipients.map((r) => r.amount), { type: "vec" }),
      new stellarSdk.Address(params.token).toScVal(),
      stellarSdk.nativeToScVal(params.deadline, { type: "u64" }),
      stellarSdk.nativeToScVal(params.recurrenceInterval, { type: "u64" }),
      stellarSdk.nativeToScVal(params.maxRecurrences, { type: "u32" })
    ];
    const { txHash, result } = await this.buildAndSubmit(params.creator, "create_recurring", args);
    return { invoiceId: Number(stellarSdk.scValToNative(result)), txHash };
  }
  async pay(payer, invoiceId, amount) {
    const args = [
      new stellarSdk.Address(payer).toScVal(),
      stellarSdk.nativeToScVal(invoiceId, { type: "u64" }),
      stellarSdk.nativeToScVal(amount, { type: "i128" })
    ];
    const { txHash } = await this.buildAndSubmit(payer, "pay", args);
    return { txHash };
  }
  async releaseEscrow(caller, invoiceId) {
    const args = [stellarSdk.nativeToScVal(invoiceId, { type: "u64" })];
    const { txHash } = await this.buildAndSubmit(caller, "release_escrow", args);
    return { txHash };
  }
  async refund(caller, invoiceId) {
    const args = [stellarSdk.nativeToScVal(invoiceId, { type: "u64" })];
    const { txHash } = await this.buildAndSubmit(caller, "refund", args);
    return { txHash };
  }
  async cancelInvoice(caller, invoiceId) {
    const args = [
      new stellarSdk.Address(caller).toScVal(),
      stellarSdk.nativeToScVal(invoiceId, { type: "u64" })
    ];
    const { txHash } = await this.buildAndSubmit(caller, "cancel_invoice", args);
    return { txHash };
  }
  async getInvoice(invoiceId) {
    const account = await this.server.getAccount(
      "GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN"
      // read-only placeholder
    );
    const contract = new stellarSdk.Contract(this.config.contractId);
    const tx = new stellarSdk.TransactionBuilder(account, {
      fee: stellarSdk.BASE_FEE,
      networkPassphrase: this.config.networkPassphrase
    }).addOperation(contract.call("get_invoice", stellarSdk.nativeToScVal(invoiceId, { type: "u64" }))).setTimeout(30).build();
    const sim = await this.server.simulateTransaction(tx);
    if ("error" in sim) throw new Error(`Simulation failed: ${sim.error}`);
    const raw = stellarSdk.scValToNative(sim.result.retval);
    return mapInvoice(raw);
  }
  async createBatch(creator, invoices) {
    const batchArg = stellarSdk.xdr.ScVal.scvVec(
      invoices.map(
        (inv) => stellarSdk.xdr.ScVal.scvMap([
          new stellarSdk.xdr.ScMapEntry({ key: stellarSdk.xdr.ScVal.scvSymbol("amounts"), val: stellarSdk.nativeToScVal(inv.recipients.map((r) => r.amount), { type: "vec" }) }),
          new stellarSdk.xdr.ScMapEntry({ key: stellarSdk.xdr.ScVal.scvSymbol("deadline"), val: stellarSdk.nativeToScVal(inv.deadline, { type: "u64" }) }),
          new stellarSdk.xdr.ScMapEntry({ key: stellarSdk.xdr.ScVal.scvSymbol("recipients"), val: stellarSdk.nativeToScVal(inv.recipients.map((r) => new stellarSdk.Address(r.address).toScVal()), { type: "vec" }) }),
          new stellarSdk.xdr.ScMapEntry({ key: stellarSdk.xdr.ScVal.scvSymbol("token"), val: new stellarSdk.Address(inv.token).toScVal() })
        ])
      )
    );
    const args = [new stellarSdk.Address(creator).toScVal(), batchArg];
    const { txHash, result } = await this.buildAndSubmit(creator, "create_batch", args);
    const ids = stellarSdk.scValToNative(result).map(Number);
    return { invoiceIds: ids, txHash };
  }
  async getAuditLog(invoiceId) {
    const account = await this.server.getAccount("GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN");
    const contract = new stellarSdk.Contract(this.config.contractId);
    const tx = new stellarSdk.TransactionBuilder(account, { fee: stellarSdk.BASE_FEE, networkPassphrase: this.config.networkPassphrase }).addOperation(contract.call("get_audit_log", stellarSdk.nativeToScVal(invoiceId, { type: "u64" }))).setTimeout(30).build();
    const sim = await this.server.simulateTransaction(tx);
    if ("error" in sim) throw new Error(`Simulation failed: ${sim.error}`);
    const raw = stellarSdk.scValToNative(sim.result.retval);
    return raw.map((e) => ({ action: e.action, actor: e.actor, timestamp: Number(e.timestamp) }));
  }
  async getNextRecurring(invoiceId) {
    const account = await this.server.getAccount(
      "GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN"
    );
    const contract = new stellarSdk.Contract(this.config.contractId);
    const tx = new stellarSdk.TransactionBuilder(account, {
      fee: stellarSdk.BASE_FEE,
      networkPassphrase: this.config.networkPassphrase
    }).addOperation(contract.call("get_next_recurring", stellarSdk.nativeToScVal(invoiceId, { type: "u64" }))).setTimeout(30).build();
    const sim = await this.server.simulateTransaction(tx);
    if ("error" in sim) throw new Error(`Simulation failed: ${sim.error}`);
    const raw = stellarSdk.scValToNative(sim.result.retval);
    return raw ?? null;
  }
};
function buildInvoiceOptions(params) {
  return stellarSdk.xdr.ScVal.scvMap([
    new stellarSdk.xdr.ScMapEntry({
      key: stellarSdk.xdr.ScVal.scvSymbol("auto_resolve_rules"),
      val: stellarSdk.xdr.ScVal.scvVec([])
    }),
    new stellarSdk.xdr.ScMapEntry({
      key: stellarSdk.xdr.ScVal.scvSymbol("escrow_enabled"),
      val: stellarSdk.xdr.ScVal.scvBool(params.escrowEnabled ?? false)
    }),
    new stellarSdk.xdr.ScMapEntry({
      key: stellarSdk.xdr.ScVal.scvSymbol("escrow_release_delay"),
      val: params.escrowReleaseDelay ? stellarSdk.xdr.ScVal.scvVec([stellarSdk.nativeToScVal(params.escrowReleaseDelay, { type: "u64" })]) : stellarSdk.xdr.ScVal.scvVec([])
    }),
    new stellarSdk.xdr.ScMapEntry({
      key: stellarSdk.xdr.ScVal.scvSymbol("split_rules"),
      val: stellarSdk.xdr.ScVal.scvVec(
        (params.splitRules ?? []).map((r) => encodeSplitRule(r))
      )
    })
  ]);
}
function encodeSplitRule(rule) {
  if (rule.type === "Fixed") {
    return stellarSdk.xdr.ScVal.scvVec([
      stellarSdk.xdr.ScVal.scvSymbol("Fixed"),
      stellarSdk.nativeToScVal(rule.amount, { type: "i128" })
    ]);
  }
  if (rule.type === "Percentage") {
    return stellarSdk.xdr.ScVal.scvVec([
      stellarSdk.xdr.ScVal.scvSymbol("Percentage"),
      stellarSdk.nativeToScVal(rule.bps, { type: "u32" })
    ]);
  }
  return stellarSdk.xdr.ScVal.scvVec([
    stellarSdk.xdr.ScVal.scvSymbol("Tiered"),
    stellarSdk.nativeToScVal(rule.threshold, { type: "i128" }),
    stellarSdk.nativeToScVal(rule.bps, { type: "u32" })
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

exports.SharpyClient = SharpyClient;
exports.connectWallet = connectWallet;
exports.deadlineFromDays = deadlineFromDays;
exports.explorerUrl = explorerUrl;
exports.formatAmount = formatAmount;
exports.getWalletPublicKey = getWalletPublicKey;
exports.isExpired = isExpired;
exports.isValidAddress = isValidAddress;
exports.parseAmount = parseAmount;
exports.signTransaction = signTransaction;
exports.truncateAddress = truncateAddress;
//# sourceMappingURL=chunk-D4JNMWQA.cjs.map
//# sourceMappingURL=chunk-D4JNMWQA.cjs.map