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
  signerReady: boolean;       // true only when a signer is registered and ready to sign
  connect: () => Promise<void>;
  disconnect: () => void;
}

const WalletContext = createContext<WalletCtx>({
  publicKey: null,
  walletId: null,
  signerReady: false,
  connect: async () => {},
  disconnect: () => {},
});

// Signs with a wallet module instance, normalising the return value across
// wallet implementations. Freighter v3 returns { signedTransaction };
// other wallets return { signedTxXdr }.
async function signWithModule(
  mod: { signTransaction(xdr: string, opts: { networkPassphrase: string }): Promise<unknown> },
  xdr: string,
  networkPassphrase: string
): Promise<string> {
  const result = await mod.signTransaction(xdr, { networkPassphrase });
  const signed =
    (result as any)?.signedTxXdr ??
    (result as any)?.signedTransaction ??
    result;
  if (typeof signed !== "string") throw new Error("Wallet returned no signed XDR");
  return signed;
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [walletId, setWalletId] = useState<string | null>(null);
  const [signerReady, setSignerReady] = useState(false);

  // On mount: restore address for display only.
  // The signer is NOT restored — the user must go through connect() again
  // after a page refresh. This is standard Web3 UX and is the only way to
  // guarantee the correct wallet module is bound to the signer.
  useEffect(() => {
    const saved = sessionStorage.getItem(SESSION_KEY);
    if (!saved) return;
    try {
      const { address, wallet } = JSON.parse(saved);
      if (address) {
        setPublicKey(address);
        setWalletId(wallet ?? null);
        // signerReady stays false — user must reconnect to activate signing
      }
    } catch {
      sessionStorage.removeItem(SESSION_KEY);
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
      const { address } = await StellarWalletsKit.authModal({});

      // Capture the selected module instance immediately after the modal resolves.
      // We hold a direct reference — it cannot be swapped out by the kit's internal state.
      const selectedModule = (StellarWalletsKit as any).selectedModule;
      if (!selectedModule) throw new Error("No wallet module selected after auth");

      const wId: string = selectedModule.productId ?? selectedModule.id ?? "unknown";

      setPublicKey(address);
      setWalletId(wId);
      sessionStorage.setItem(SESSION_KEY, JSON.stringify({ address, wallet: wId }));

      // Register signer bound to the captured module instance.
      setKitSigner((xdr, networkPassphrase) =>
        signWithModule(selectedModule, xdr, networkPassphrase)
      );
      setSignerReady(true);
    } catch (e: any) {
      if (e?.code !== -1) console.error("Wallet connection failed:", e);
    }
  }, []);

  const disconnect = useCallback(async () => {
    setPublicKey(null);
    setWalletId(null);
    setSignerReady(false);
    sessionStorage.removeItem(SESSION_KEY);
    const { setKitSigner } = await import("../lib/client");
    setKitSigner(null);
  }, []);

  return (
    <WalletContext.Provider value={{ publicKey, walletId, signerReady, connect, disconnect }}>
      {children}
    </WalletContext.Provider>
  );
}

export const useWallet = () => useContext(WalletContext);
