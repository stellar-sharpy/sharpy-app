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
var SharpyClient = class {
  constructor(config) {
    this.config = config;
    this.server = new Server(config.rpcUrl);
  }
  async buildAndSubmit(sourcePublicKey, method, args) {
    const account = await this.server.getAccount(sourcePublicKey);
    const contract = new Contract(this.config.contractId);
    const tx = new TransactionBuilder(account, {
      fee: BASE_FEE,
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
      result: getResult.returnValue ?? xdr.ScVal.scvVoid()
    };
  }
  async createInvoice(params) {
    const args = [
      new Address(params.creator).toScVal(),
      nativeToScVal(params.recipients.map((r) => new Address(r.address).toScVal()), { type: "vec" }),
      nativeToScVal(params.recipients.map((r) => r.amount), { type: "vec" }),
      new Address(params.token).toScVal(),
      nativeToScVal(params.deadline, { type: "u64" }),
      buildInvoiceOptions(params)
    ];
    const { txHash, result } = await this.buildAndSubmit(params.creator, "create_invoice", args);
    return { invoiceId: Number(scValToNative(result)), txHash };
  }
  async createRecurring(params) {
    const args = [
      new Address(params.creator).toScVal(),
      nativeToScVal(params.recipients.map((r) => new Address(r.address).toScVal()), { type: "vec" }),
      nativeToScVal(params.recipients.map((r) => r.amount), { type: "vec" }),
      new Address(params.token).toScVal(),
      nativeToScVal(params.deadline, { type: "u64" }),
      nativeToScVal(params.recurrenceInterval, { type: "u64" }),
      nativeToScVal(params.maxRecurrences, { type: "u32" })
    ];
    const { txHash, result } = await this.buildAndSubmit(params.creator, "create_recurring", args);
    return { invoiceId: Number(scValToNative(result)), txHash };
  }
  async pay(payer, invoiceId, amount) {
    const args = [
      new Address(payer).toScVal(),
      nativeToScVal(invoiceId, { type: "u64" }),
      nativeToScVal(amount, { type: "i128" })
    ];
    const { txHash } = await this.buildAndSubmit(payer, "pay", args);
    return { txHash };
  }
  async releaseEscrow(caller, invoiceId) {
    const args = [nativeToScVal(invoiceId, { type: "u64" })];
    const { txHash } = await this.buildAndSubmit(caller, "release_escrow", args);
    return { txHash };
  }
  async refund(caller, invoiceId) {
    const args = [nativeToScVal(invoiceId, { type: "u64" })];
    const { txHash } = await this.buildAndSubmit(caller, "refund", args);
    return { txHash };
  }
  async cancelInvoice(caller, invoiceId) {
    const args = [
      new Address(caller).toScVal(),
      nativeToScVal(invoiceId, { type: "u64" })
    ];
    const { txHash } = await this.buildAndSubmit(caller, "cancel_invoice", args);
    return { txHash };
  }
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
    if ("error" in sim) throw new Error(`Simulation failed: ${sim.error}`);
    const raw = scValToNative(sim.result.retval);
    return mapInvoice(raw);
  }
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

export { SharpyClient, connectWallet, deadlineFromDays, explorerUrl, formatAmount, getWalletPublicKey, isExpired, isValidAddress, parseAmount, signTransaction, truncateAddress };
//# sourceMappingURL=chunk-EQDBWKMG.js.map
//# sourceMappingURL=chunk-EQDBWKMG.js.map