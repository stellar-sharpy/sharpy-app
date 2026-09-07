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
  const [total, setTotal] = useState<bigint | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const bals = await Promise.all(
          TOKENS.map(async (t) => {
            try {
              return await sharpyClient.getClaimableBalance(address, getTokenAddress(t, NETWORK));
            } catch {
              return 0n;
            }
          })
        );
        if (!cancelled) setTotal(bals.reduce((a, b) => a + b, 0n));
      } catch {
        if (!cancelled) setTotal(null);
      }
    })();
    return () => { cancelled = true; };
  }, [address]);

  if (total === null || total <= 0n) return null;

  return (
    <div className="card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3" style={{ borderColor: "rgba(0,212,170,0.35)" }}>
      <div>
        <p className="text-sm font-medium" style={{ color: "var(--text)" }}>
          {formatAmount(total)} claimable
        </p>
        <p className="text-xs" style={{ color: "var(--muted)" }}>
          Failed recipient transfers were credited back — withdraw via claim.
        </p>
      </div>
      <Link href="/claim" className="btn-primary text-xs px-4 py-2 text-center" aria-label="Review and claim balances">
        Review &amp; claim
      </Link>
    </div>
  );
}
