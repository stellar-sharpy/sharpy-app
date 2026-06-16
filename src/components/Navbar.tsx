"use client";
import Link from "next/link";
import { useWallet } from "./WalletProvider";
import { truncateAddress } from "../lib/utils";

export default function Navbar() {
  const { publicKey, connect, disconnect } = useWallet();
  return (
    <header className="border-b border-[#1E2028] bg-[#0A0B0F]/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#6C63FF] to-[#00D4AA] flex items-center justify-center text-white font-bold text-sm font-display">
            S
          </div>
          <span className="font-display font-semibold text-[#F1F2F6] tracking-tight">Sharpy</span>
        </Link>

        {/* Nav */}
        <div className="flex items-center gap-2">
          {publicKey ? (
            <>
              <Link href="/dashboard"
                className="text-sm text-[#6B7280] hover:text-[#F1F2F6] px-3 py-1.5 rounded-lg hover:bg-[#111318] transition-colors">
                Dashboard
              </Link>
              <Link href="/invoice/new"
                className="btn-primary text-sm py-1.5 px-4">
                New Invoice
              </Link>
              <button onClick={disconnect}
                className="ml-1 text-xs mono bg-[#111318] border border-[#1E2028] px-3 py-1.5 rounded-lg hover:border-[#2E3040] hover:text-[#F1F2F6] transition-colors">
                {truncateAddress(publicKey)}
              </button>
            </>
          ) : (
            <button onClick={connect} className="btn-primary text-sm py-1.5 px-4">
              Connect Wallet
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
