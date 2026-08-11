'use strict';

var chunkPWXQMNQ3_cjs = require('./chunk-PWXQMNQ3.cjs');
var freighterApi = require('@stellar/freighter-api');

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
async function signTransaction(xdr, networkPassphrase) {
  const result = await freighterApi.signTransaction(xdr, { networkPassphrase });
  if ("error" in result) throw new Error(`Signing failed: ${result.error}`);
  return result.signedTxXdr;
}

// src/index.ts
var NETWORKS = {
  testnet: {
    rpcUrl: "https://soroban-testnet.stellar.org",
    networkPassphrase: "Test SDF Network ; September 2015",
    contractId: "CD4USMFARRFLM47FZTPH5QUXRY7MEXDBKLPA2Z5J23ZR7Y3AQEIMEMEL"
  },
  mainnet: {
    rpcUrl: "https://mainnet.sorobanrpc.com",
    networkPassphrase: "Public Global Stellar Network ; September 2015",
    contractId: ""
  }
};

Object.defineProperty(exports, "DeadlinePassedError", {
  enumerable: true,
  get: function () { return chunkPWXQMNQ3_cjs.DeadlinePassedError; }
});
Object.defineProperty(exports, "InvoiceNotFoundError", {
  enumerable: true,
  get: function () { return chunkPWXQMNQ3_cjs.InvoiceNotFoundError; }
});
Object.defineProperty(exports, "InvoiceNotPendingError", {
  enumerable: true,
  get: function () { return chunkPWXQMNQ3_cjs.InvoiceNotPendingError; }
});
Object.defineProperty(exports, "OverpaymentError", {
  enumerable: true,
  get: function () { return chunkPWXQMNQ3_cjs.OverpaymentError; }
});
Object.defineProperty(exports, "SharpyClient", {
  enumerable: true,
  get: function () { return chunkPWXQMNQ3_cjs.SharpyClient; }
});
Object.defineProperty(exports, "deadlineFromDays", {
  enumerable: true,
  get: function () { return chunkPWXQMNQ3_cjs.deadlineFromDays; }
});
Object.defineProperty(exports, "explorerUrl", {
  enumerable: true,
  get: function () { return chunkPWXQMNQ3_cjs.explorerUrl; }
});
Object.defineProperty(exports, "formatAmount", {
  enumerable: true,
  get: function () { return chunkPWXQMNQ3_cjs.formatAmount; }
});
Object.defineProperty(exports, "isExpired", {
  enumerable: true,
  get: function () { return chunkPWXQMNQ3_cjs.isExpired; }
});
Object.defineProperty(exports, "isValidAddress", {
  enumerable: true,
  get: function () { return chunkPWXQMNQ3_cjs.isValidAddress; }
});
Object.defineProperty(exports, "parseAmount", {
  enumerable: true,
  get: function () { return chunkPWXQMNQ3_cjs.parseAmount; }
});
Object.defineProperty(exports, "truncateAddress", {
  enumerable: true,
  get: function () { return chunkPWXQMNQ3_cjs.truncateAddress; }
});
exports.NETWORKS = NETWORKS;
exports.connectWallet = connectWallet;
exports.getWalletPublicKey = getWalletPublicKey;
exports.signTransaction = signTransaction;
//# sourceMappingURL=index.cjs.map
//# sourceMappingURL=index.cjs.map