"use client";
import { useEffect, useState } from "react";
import { Horizon } from "@stellar/stellar-sdk";
import { TOKENS } from "../lib/tokens";

const HORIZON_URL =
  (process.env.NEXT_PUBLIC_STELLAR_NETWORK ?? "testnet") === "mainnet"
    ? "https://horizon.stellar.org"
    : "https://horizon-testnet.stellar.org";

interface Balance {
  symbol: string;
  balance: string;
  type: string;
}

function formatBalance(raw: string): string {
  const n = Number(raw);
  if (isNaN(n)) return raw;
  if (n >= 1000) return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
  if (n >= 1) return n.toLocaleString(undefined, { maximumFractionDigits: 4 });
  return n.toLocaleString(undefined, { maximumFractionDigits: 7 });
}

export default function WalletBalance({ address }: { address: string }) {
  const [balances, setBalances] = useState<Balance[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    const server = new Horizon.Server(HORIZON_URL);
    server
      .loadAccount(address)
      .then((account) => {
        if (cancelled) return;
        const list: Balance[] = account.balances.map((b: any) => {
          if (b.asset_type === "native") {
            return { symbol: "XLM", balance: b.balance, type: "native" };
          }
          const token = TOKENS.find((t) => t.address.testnet === b.asset_issuer || t.address.mainnet === b.asset_issuer);
          // Match by code + issuer
          const match = TOKENS.find(
            (t) =>
              (t.address.testnet === b.asset_issuer || t.address.mainnet === b.asset_issuer) &&
              t.symbol === b.asset_code
          );
          return { symbol: match?.symbol ?? b.asset_code, balance: b.balance, type: b.asset_code };
        });
        // Sort: XLM first, USDC second
        list.sort((a, b) => {
          const order: Record<string, number> = { XLM: 0, USDC: 1, AQUA: 2, yXLM: 3 };
          return (order[a.symbol] ?? 99) - (order[b.symbol] ?? 99);
        });
        setBalances(list);
      })
      .catch((e: any) => {
        if (cancelled) return;
        setError(e.message ?? "Failed to load balances");
        setBalances([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [address]);

  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <div className="h-6 w-20 rounded-full animate-pulse" style={{ background: "var(--surface-2)" }} />
        <div className="h-6 w-20 rounded-full animate-pulse" style={{ background: "var(--surface-2)" }} />
      </div>
    );
  }

  if (error) {
    return <p className="text-xs" style={{ color: "var(--muted)" }}>{error}</p>;
  }

  if (!balances || balances.length === 0) {
    return <p className="text-xs" style={{ color: "var(--muted)" }}>No balances</p>;
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {balances.slice(0, 4).map((b) => (
        <span
          key={b.symbol + b.type}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border"
          style={{ background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--text-secondary)" }}
          title={`${b.balance} ${b.symbol}`}
        >
          <span className="w-3 h-3 rounded-full flex items-center justify-center text-[8px] font-bold" style={{ background: b.symbol === "XLM" ? "#000" : b.symbol === "USDC" ? "#2775CA" : "#6C63FF", color: "#fff" }}>
            {b.symbol.slice(0, 1)}
          </span>
          {formatBalance(b.balance)} {b.symbol}
        </span>
      ))}
      {balances.length > 4 && (
        <span className="text-xs" style={{ color: "var(--muted)" }}>+{balances.length - 4} more</span>
      )}
    </div>
  );
}

export function WalletBalanceCard({ address }: { address: string }) {
  return (
    <div className="card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium" style={{ color: "var(--muted)" }}>Wallet Balances</p>
        <span className="text-xs mono" style={{ color: "var(--muted-2)" }}>{address.slice(0, 6)}…{address.slice(-4)}</span>
      </div>
      <WalletBalance address={address} />
    </div>
  );
}
