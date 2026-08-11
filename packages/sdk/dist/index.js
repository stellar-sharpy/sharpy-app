export { DeadlinePassedError, InvoiceNotFoundError, InvoiceNotPendingError, OverpaymentError, SharpyClient, deadlineFromDays, explorerUrl, formatAmount, isExpired, isValidAddress, parseAmount, truncateAddress } from './chunk-WTBZQR5Q.js';
import { isConnected, requestAccess, getAddress, signTransaction as signTransaction$1 } from '@stellar/freighter-api';

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
async function signTransaction(xdr, networkPassphrase) {
  const result = await signTransaction$1(xdr, { networkPassphrase });
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

export { NETWORKS, connectWallet, getWalletPublicKey, signTransaction };
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map