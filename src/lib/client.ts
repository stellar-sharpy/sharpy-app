import { SharpyClient, NETWORKS } from "@stellar-sharpy/sdk";
import { TOKENS, getTokenAddress } from "./tokens";

const network = (process.env.NEXT_PUBLIC_STELLAR_NETWORK ?? "testnet") as "testnet" | "mainnet";
const net = NETWORKS[network];

export const NETWORK = network;
export const CONTRACT_ID = process.env.NEXT_PUBLIC_CONTRACT_ID ?? net.contractId;
export const NETWORK_PASSPHRASE = net.networkPassphrase;
export const DEFAULT_TOKEN = getTokenAddress(TOKENS[0], network);

// Signing function registry — updated by WalletProvider on connect/disconnect
export const signerRegistry = {
  fn: null as ((xdr: string, networkPassphrase: string) => Promise<string>) | null,
};

export const sharpyClient = new SharpyClient({
  rpcUrl: process.env.NEXT_PUBLIC_RPC_URL ?? net.rpcUrl,
  networkPassphrase: net.networkPassphrase,
  contractId: CONTRACT_ID,
  // Always delegates to signerRegistry.fn at call time
  signTransaction: async (xdr: string, passphrase: string) => {
    if (signerRegistry.fn) return signerRegistry.fn(xdr, passphrase);
    // Fallback to Freighter if no kit signer registered
    const { signTransaction } = await import("@stellar/freighter-api");
    const result = await (signTransaction as any)(xdr, { networkPassphrase: passphrase });
    if (result && "error" in result) throw new Error(`Signing failed: ${result.error}`);
    return result.signedTxXdr ?? result;
  },
});

export function setKitSigner(fn: ((xdr: string, networkPassphrase: string) => Promise<string>) | null) {
  signerRegistry.fn = fn;
}
