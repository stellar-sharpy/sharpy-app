"use client";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useEffect, useRef, useState } from "react";
import { useWallet } from "./WalletProvider";
import { truncateAddress } from "../lib/utils";
import WalletBalanceInline from "./WalletBalance";

function ThemeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="w-14 h-8 rounded-full border" style={{ borderColor: "var(--border)", background: "var(--surface-2)" }} />;

  const isDark = resolvedTheme === "dark";
  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="relative w-14 h-8 rounded-full flex items-center px-1 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#6C63FF]/40"
      style={{
        background: isDark ? "var(--surface-2)" : "#E8EBF4",
        border: "1px solid var(--border)",
        boxShadow: "inset 0 1px 2px rgba(0,0,0,0.08)",
      }}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      title={`Current: ${isDark ? "dark" : "light"} — click to switch`}
    >
      <span className="absolute left-1.5 text-[10px] transition-opacity duration-300" style={{ opacity: isDark ? 0 : 0.6, color: "var(--muted)" }}>☀</span>
      <span className="absolute right-1.5 text-[10px] transition-opacity duration-300" style={{ opacity: isDark ? 0.6 : 0, color: "var(--muted)" }}>☾</span>
      <span
        className="relative w-6 h-6 rounded-full flex items-center justify-center shadow-md transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
        style={{
          background: isDark ? "#6C63FF" : "#FFFFFF",
          color: isDark ? "#FFFFFF" : "#6C63FF",
          transform: isDark ? "translateX(24px)" : "translateX(0)",
          border: "1px solid var(--border)",
        }}
      >
        {isDark ? (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
          </svg>
        ) : (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/>
            <line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/>
            <line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
          </svg>
        )}
      </span>
    </button>
  );
}

function NavNewInvoiceDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="btn-primary text-sm py-1.5 px-4 flex items-center gap-1.5"
        aria-haspopup="true"
        aria-expanded={open}
      >
        New Invoice
        <svg
          width="11"
          height="11"
          viewBox="0 0 12 12"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={`transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        >
          <path d="M2 4l4 4 4-4" />
        </svg>
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-1.5 z-50 w-52 rounded-xl shadow-xl overflow-hidden"
          style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
          role="menu"
        >
          <Link
            href="/invoice/new"
            onClick={() => setOpen(false)}
            role="menuitem"
            className="flex items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-[var(--surface-2)]"
            style={{ color: "var(--text)" }}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M8 2v12M2 8h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            <div>
              <p className="font-medium">Single Invoice</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>One invoice</p>
            </div>
          </Link>

          <div style={{ borderTop: "1px solid var(--border)" }} />

          <Link
            href="/invoice/batch"
            onClick={() => setOpen(false)}
            role="menuitem"
            className="flex items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-[var(--surface-2)]"
            style={{ color: "var(--text)" }}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <rect x="1" y="1" width="6" height="6" rx="1.2" stroke="currentColor" strokeWidth="1.5" />
              <rect x="9" y="1" width="6" height="6" rx="1.2" stroke="currentColor" strokeWidth="1.5" />
              <rect x="1" y="9" width="6" height="6" rx="1.2" stroke="currentColor" strokeWidth="1.5" />
              <rect x="9" y="9" width="6" height="6" rx="1.2" stroke="currentColor" strokeWidth="1.5" />
            </svg>
            <div>
              <p className="font-medium">Batch Invoices</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>Up to 10 in one tx</p>
            </div>
          </Link>
        </div>
      )}
    </div>
  );
}

function WalletBalanceDropdown({ address, onDisconnect }: { address: string; onDisconnect: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="mono text-xs px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
      >
        {truncateAddress(address)}
        <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" className={`transition-transform ${open ? "rotate-180" : ""}`}><path d="M2 4l4 4 4-4" /></svg>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 z-50 w-72 rounded-xl shadow-xl p-3 space-y-3" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium" style={{ color: "var(--text)" }}>Balances</p>
            <button onClick={() => { setOpen(false); onDisconnect(); }} className="text-xs px-2 py-1 rounded-lg" style={{ background: "rgba(239,68,68,0.1)", color: "#EF4444", border: "1px solid rgba(239,68,68,0.2)" }}>Disconnect</button>
          </div>
          <WalletBalanceInline address={address} />
          <a href={`https://stellar.expert/explorer/testnet/account/${address}`} target="_blank" rel="noreferrer" className="text-xs text-[#6C63FF] hover:underline block">View on Explorer →</a>
        </div>
      )}
    </div>
  );
}

export default function Navbar() {
  const { publicKey, connect, disconnect } = useWallet();

  return (
    <header className="border-b sticky top-0 z-50 backdrop-blur-md"
      style={{ borderColor: "var(--border)", backgroundColor: "color-mix(in srgb, var(--bg) 80%, transparent)" }}>
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <img src="/logo-icon.png" alt="Sharpy" className="h-8 w-8 object-contain" />
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
              <NavNewInvoiceDropdown />
              <WalletBalanceDropdown address={publicKey} onDisconnect={disconnect} />
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
