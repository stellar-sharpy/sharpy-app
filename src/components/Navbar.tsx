"use client";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { useWallet } from "./WalletProvider";
import { truncateAddress } from "../lib/utils";

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="w-8 h-8" />;

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
      style={{ border: "1px solid var(--border)", color: "var(--muted-2)" }}
      aria-label="Toggle theme"
    >
      {theme === "dark" ? (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/>
          <line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/>
          <line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
        </svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
        </svg>
      )}
    </button>
  );
}

export default function Navbar() {
  const { publicKey, connect, disconnect } = useWallet();

  return (
    <header className="border-b sticky top-0 z-50 backdrop-blur-md"
      style={{ borderColor: "var(--border)", backgroundColor: "color-mix(in srgb, var(--bg) 80%, transparent)" }}>
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#6C63FF] to-[#00D4AA] p-1.5 flex items-center justify-center shrink-0">
            <img src="/logo.svg" alt="" className="w-full h-full brightness-0 invert" />
          </div>
          <span className="font-display font-semibold tracking-tight" style={{ color: "var(--text)" }}>Sharpy</span>
        </Link>

        <div className="flex items-center gap-2">
          {publicKey ? (
            <>
              <Link href="/dashboard"
                className="text-sm px-3 py-1.5 rounded-lg transition-colors"
                style={{ color: "var(--muted)" }}>
                Dashboard
              </Link>
              <Link href="/invoice/new" className="btn-primary text-sm py-1.5 px-4">
                New Invoice
              </Link>
              <button onClick={disconnect}
                className="mono text-xs px-3 py-1.5 rounded-lg transition-colors"
                style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                {truncateAddress(publicKey)}
              </button>
            </>
          ) : (
            <button onClick={connect} className="btn-primary text-sm py-1.5 px-4">
              Connect Wallet
            </button>
          )}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
