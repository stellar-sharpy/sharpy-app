"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { sharpyClient, NETWORK } from "../lib/client";
import { formatAmount } from "../lib/utils";
import { TOKENS, getTokenAddress } from "../lib/tokens";

/**
 * Compact dashboard banner summarizing claimable fallback balances.
 * Renders nothing while loading, on error, or when nothing is claimable —
 * the dashboard must never break because of this widget.
 */
export default function ClaimBanner({ address }: { address: string }) {
  const [entries, setEntries] = useState<{ symbol: string; balance: bigint }[] | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const bals = await Promise.all(
          TOKENS.map(async (t) => {
            try {
              return { symbol: t.symbol, balance: await sharpyClient.getClaimableBalance(address, getTokenAddress(t, NETWORK)) };
            } catch {
              return { symbol: t.symbol, balance: 0n };
            }
          })
        );
        if (!cancelled) setEntries(bals.filter((b) => b.balance > 0n));
      } catch {
        if (!cancelled) setEntries(null);
      }
    })();
    return () => { cancelled = true; };
  }, [address]);

  if (dismissed || entries === null || entries.length === 0) return null;
  const total = entries.reduce((a, b) => a + b.balance, 0n);

  return (
    <div className="card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3" style={{ borderColor: "rgba(0,212,170,0.35)" }} role="status" aria-live="polite" aria-label={`${formatAmount(total)} claimable across ${entries.length} token${entries.length !== 1 ? "s" : ""}`}>
      <div>
        <p className="text-sm font-medium" style={{ color: "var(--text)" }}>
          {formatAmount(total)} claimable
        </p>
        <p className="text-xs" style={{ color: "var(--muted)" }}>
          {entries.map((e) => `${formatAmount(e.balance)} ${e.symbol}`).join(" · ")} — failed recipient
          transfers were credited back; withdraw via claim.
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Link href="/claim" className="btn-primary text-xs px-4 py-2 text-center" aria-label={`Review and claim ${formatAmount(total)} across ${entries.length} token${entries.length !== 1 ? "s" : ""}`}>
          Review &amp; claim
        </Link>
        <button
          onClick={() => setDismissed(true)}
          className="text-xs px-3 py-2 rounded-lg border"
          style={{ borderColor: "var(--border)", color: "var(--muted)" }}
          aria-label="Dismiss claimable balance banner"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
