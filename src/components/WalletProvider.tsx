"use client";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { connectWallet, getWalletPublicKey } from "@stellar-sharpy/sdk";

const SESSION_KEY = "sharpy_wallet_connected";

interface WalletCtx {
  publicKey: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
}

const WalletContext = createContext<WalletCtx>({ publicKey: null, connect: async () => {}, disconnect: () => {} });

export function WalletProvider({ children }: { children: ReactNode }) {
  const [publicKey, setPublicKey] = useState<string | null>(null);

  useEffect(() => {
    // Only auto-restore if user explicitly connected this session
    // If they disconnected, sessionStorage flag is cleared — no auto-reconnect
    const wasConnected = sessionStorage.getItem(SESSION_KEY);
    if (wasConnected) {
      getWalletPublicKey().then((key) => {
        if (key) setPublicKey(key);
        else sessionStorage.removeItem(SESSION_KEY);
      });
    }
  }, []);

  const connect = async () => {
    const key = await connectWallet();
    setPublicKey(key);
    sessionStorage.setItem(SESSION_KEY, "1");
  };

  const disconnect = () => {
    setPublicKey(null);
    // Clear session flag — next page load will NOT auto-reconnect
    sessionStorage.removeItem(SESSION_KEY);
  };

  return <WalletContext.Provider value={{ publicKey, connect, disconnect }}>{children}</WalletContext.Provider>;
}

export const useWallet = () => useContext(WalletContext);
