import { SharpyClient, NETWORKS } from "@stellar-sharpy/sdk";
import { TOKENS, getTokenAddress } from "./tokens";

const network = (process.env.NEXT_PUBLIC_STELLAR_NETWORK ?? "testnet") as "testnet" | "mainnet";
const net = NETWORKS[network];

export const sharpyClient = new SharpyClient({
  rpcUrl: process.env.NEXT_PUBLIC_RPC_URL ?? net.rpcUrl,
  networkPassphrase: net.networkPassphrase,
  contractId: process.env.NEXT_PUBLIC_CONTRACT_ID ?? net.contractId,
});

export const NETWORK = network;
export const NETWORK_PASSPHRASE = net.networkPassphrase;

// Default token addresses per network (used as fallback)
export const DEFAULT_TOKEN = getTokenAddress(TOKENS[0], network); // USDC
