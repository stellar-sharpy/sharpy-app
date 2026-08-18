"use client";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useEffect, useRef, useState } from "react";
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
