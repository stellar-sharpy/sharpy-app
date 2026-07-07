'use strict';

var chunkSCQVLDEG_cjs = require('./chunk-SCQVLDEG.cjs');

// src/index.ts
var NETWORKS = {
  testnet: {
    rpcUrl: "https://soroban-testnet.stellar.org",
    networkPassphrase: "Test SDF Network ; September 2015",
    contractId: "CAYTIFPD6RFWVHMK5SPPUUIWWAAANHKOJB6GOAJS5SR5MBKZMEY2UODZ"
  },
  mainnet: {
    rpcUrl: "https://mainnet.sorobanrpc.com",
    networkPassphrase: "Public Global Stellar Network ; September 2015",
    contractId: ""
  }
};

Object.defineProperty(exports, "DeadlinePassedError", {
  enumerable: true,
  get: function () { return chunkSCQVLDEG_cjs.DeadlinePassedError; }
});
Object.defineProperty(exports, "InvoiceNotFoundError", {
  enumerable: true,
  get: function () { return chunkSCQVLDEG_cjs.InvoiceNotFoundError; }
});
Object.defineProperty(exports, "InvoiceNotPendingError", {
  enumerable: true,
  get: function () { return chunkSCQVLDEG_cjs.InvoiceNotPendingError; }
});
Object.defineProperty(exports, "OverpaymentError", {
  enumerable: true,
  get: function () { return chunkSCQVLDEG_cjs.OverpaymentError; }
});
Object.defineProperty(exports, "SharpyClient", {
  enumerable: true,
  get: function () { return chunkSCQVLDEG_cjs.SharpyClient; }
});
Object.defineProperty(exports, "connectWallet", {
  enumerable: true,
  get: function () { return chunkSCQVLDEG_cjs.connectWallet; }
});
Object.defineProperty(exports, "deadlineFromDays", {
  enumerable: true,
  get: function () { return chunkSCQVLDEG_cjs.deadlineFromDays; }
});
Object.defineProperty(exports, "explorerUrl", {
  enumerable: true,
  get: function () { return chunkSCQVLDEG_cjs.explorerUrl; }
});
Object.defineProperty(exports, "formatAmount", {
  enumerable: true,
  get: function () { return chunkSCQVLDEG_cjs.formatAmount; }
});
Object.defineProperty(exports, "getWalletPublicKey", {
  enumerable: true,
  get: function () { return chunkSCQVLDEG_cjs.getWalletPublicKey; }
});
Object.defineProperty(exports, "isExpired", {
  enumerable: true,
  get: function () { return chunkSCQVLDEG_cjs.isExpired; }
});
Object.defineProperty(exports, "isValidAddress", {
  enumerable: true,
  get: function () { return chunkSCQVLDEG_cjs.isValidAddress; }
});
Object.defineProperty(exports, "parseAmount", {
  enumerable: true,
  get: function () { return chunkSCQVLDEG_cjs.parseAmount; }
});
Object.defineProperty(exports, "signTransaction", {
  enumerable: true,
  get: function () { return chunkSCQVLDEG_cjs.signTransaction; }
});
Object.defineProperty(exports, "truncateAddress", {
  enumerable: true,
  get: function () { return chunkSCQVLDEG_cjs.truncateAddress; }
});
exports.NETWORKS = NETWORKS;
//# sourceMappingURL=index.cjs.map
//# sourceMappingURL=index.cjs.map