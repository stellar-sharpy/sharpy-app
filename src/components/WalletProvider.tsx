"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";

const SESSION_KEY = "sharpy_wallet_connected";
const NETWORK = (process.env.NEXT_PUBLIC_STELLAR_NETWORK ?? "testnet") as "testnet" | "mainnet";

interface WalletCtx {
  publicKey: string | null;
  walletId: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
}

const WalletContext = createContext<WalletCtx>({
  publicKey: null,
  walletId: null,
  connect: async () => {},
  disconnect: () => {},
});

export function WalletProvider({ children }: { children: ReactNode }) {
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [walletId, setWalletId] = useState<string | null>(null);

  // Restore session on mount
  useEffect(() => {
    const saved = sessionStorage.getItem(SESSION_KEY);
    if (saved) {
      try {
        const { address, wallet } = JSON.parse(saved);
        if (address) {
          setPublicKey(address);
          setWalletId(wallet ?? null);
        }
      } catch {
        sessionStorage.removeItem(SESSION_KEY);
      }
    }
  }, []);

  const connect = useCallback(async () => {
    const { StellarWalletsKit } = await import("@creit.tech/stellar-wallets-kit/sdk");
    const { Networks } = await import("@creit.tech/stellar-wallets-kit");
    const { defaultModules } = await import("@creit.tech/stellar-wallets-kit/modules/utils");
    const { setKitSigner } = await import("../lib/client");

    StellarWalletsKit.init({
      modules: defaultModules(),
      network: NETWORK === "mainnet" ? Networks.PUBLIC : Networks.TESTNET,
    });

    try {
      // authModal opens the wallet selector and resolves with { address }
      const { address } = await StellarWalletsKit.authModal({});
      const walletId = (StellarWalletsKit as any).selectedModule?.id ?? "unknown";

      setPublicKey(address);
      setWalletId(walletId);
      sessionStorage.setItem(SESSION_KEY, JSON.stringify({ address, wallet: walletId }));

      // Register kit signer so SharpyClient uses the selected wallet
      setKitSigner(async (xdr: string, networkPassphrase: string) => {
        const { signedTxXdr } = await StellarWalletsKit.signTransaction(xdr, { networkPassphrase });
        return signedTxXdr;
      });
    } catch (e: any) {
      // User closed modal — not an error
      if (e?.code !== -1) console.error("Wallet connection failed:", e);
    }
  }, []);

  const disconnect = useCallback(async () => {
    setPublicKey(null);
    setWalletId(null);
    sessionStorage.removeItem(SESSION_KEY);
    // Clear signer so next connect is always fresh
    const { setKitSigner } = await import("../lib/client");
    setKitSigner(null);
  }, []);

  return (
    <WalletContext.Provider value={{ publicKey, walletId, connect, disconnect }}>
      {children}
    </WalletContext.Provider>
  );
}

export const useWallet = () => useContext(WalletContext);
