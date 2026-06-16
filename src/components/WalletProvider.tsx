"use client";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { connectWallet, getWalletPublicKey } from "@stellar-sharpy/sdk";

interface WalletCtx {
  publicKey: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
}

const WalletContext = createContext<WalletCtx>({ publicKey: null, connect: async () => {}, disconnect: () => {} });

export function WalletProvider({ children }: { children: ReactNode }) {
  const [publicKey, setPublicKey] = useState<string | null>(null);

  useEffect(() => {
    getWalletPublicKey().then(setPublicKey);
  }, []);

  const connect = async () => {
    const key = await connectWallet();
    setPublicKey(key);
  };

  const disconnect = () => setPublicKey(null);

  return <WalletContext.Provider value={{ publicKey, connect, disconnect }}>{children}</WalletContext.Provider>;
}

export const useWallet = () => useContext(WalletContext);
