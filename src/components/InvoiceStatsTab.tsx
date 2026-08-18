"use client";
import { useEffect, useState } from "react";
import { sharpyClient } from "../lib/client";
import { formatAmount } from "../lib/utils";
import { getTokenByAddress } from "../lib/tokens";

interface InvoiceStats {
  funded: bigint;
  total: bigint;
  paymentCount: number;
  uniquePayers: number;
  completionBps: number;
}

interface Props {
  invoiceId: number;
  tokenAddress?: string;
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div
      className="rounded-xl p-4 flex flex-col gap-1"
      style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
    >
      <p className="text-xs" style={{ color: "var(--muted)" }}>{label}</p>
      <p className="font-display text-xl font-bold" style={{ color: "var(--text)" }}>{value}</p>
      {sub && <p className="text-xs" style={{ color: "var(--muted-2)" }}>{sub}</p>}
    </div>
  );
}

function CompletionRing({ bps }: { bps: number }) {
  const pct = Math.min(100, bps / 100);
  const r = 28;
  const circ = 2 * Math.PI * r;
  const filled = (pct / 100) * circ;

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width="72" height="72" viewBox="0 0 72 72">
        <circle cx="36" cy="36" r={r} fill="none" stroke="var(--border)" strokeWidth="6" />
        <circle
          cx="36" cy="36" r={r} fill="none"
          stroke={pct >= 100 ? "#00D4AA" : "#6C63FF"}
          strokeWidth="6"
          strokeDasharray={`${filled} ${circ}`}
          strokeLinecap="round"
          transform="rotate(-90 36 36)"
          style={{ transition: "stroke-dasharray 0.6s ease" }}
        />
        <text x="36" y="40" textAnchor="middle" fontSize="13" fontWeight="700" fill="var(--text)">
          {pct.toFixed(0)}%
        </text>
      </svg>
      <p className="text-xs" style={{ color: "var(--muted)" }}>Funded</p>
    </div>
  );
}

export default function InvoiceStatsTab({ invoiceId, tokenAddress }: Props) {
  const [stats, setStats] = useState<InvoiceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const tokenSymbol = getTokenByAddress(tokenAddress ?? "")?.symbol ?? "tokens";

  useEffect(() => {
    sharpyClient
      .getInvoiceStats(invoiceId)
      .then(setStats)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [invoiceId]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-xl h-20 animate-pulse" style={{ background: "var(--surface-2)" }} />
        ))}
      </div>
    );
  }

  if (error || !stats) {
    return <p className="text-sm text-red-400">{error || "Failed to load stats."}</p>;
  }

  const remaining = stats.total > 0n ? stats.total - stats.funded : 0n;

  return (
    <div className="space-y-5">
      {/* Completion ring + grid */}
      <div className="flex items-center gap-6">
        <CompletionRing bps={stats.completionBps} />
        <div className="grid grid-cols-2 gap-3 flex-1">
          <StatCard
            label="Total Funded"
            value={`${formatAmount(stats.funded)} ${tokenSymbol}`}
            sub={`of ${formatAmount(stats.total)} ${tokenSymbol}`}
          />
          <StatCard
            label="Remaining"
            value={`${formatAmount(remaining)} ${tokenSymbol}`}
          />
        </div>
      </div>

      {/* Payer stats */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="Total Payments"
          value={String(stats.paymentCount)}
          sub="transactions"
        />
        <StatCard
          label="Unique Payers"
          value={String(stats.uniquePayers)}
          sub="addresses"
        />
      </div>

      {/* Completion bps raw */}
      <div
        className="rounded-xl p-4 flex items-center justify-between"
        style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
      >
        <div>
          <p className="text-xs mb-1" style={{ color: "var(--muted)" }}>Completion (basis points)</p>
          <p className="font-mono text-sm font-semibold" style={{ color: "var(--text)" }}>
            {stats.completionBps.toLocaleString()} / 10,000 bps
          </p>
        </div>
        <div
          className="text-xs px-2.5 py-1 rounded-full font-medium"
          style={{
            background: stats.completionBps >= 10000 ? "rgba(0,212,170,0.15)" : "rgba(108,99,255,0.15)",
            color: stats.completionBps >= 10000 ? "#00D4AA" : "#6C63FF",
          }}
        >
          {stats.completionBps >= 10000 ? "Fully funded" : `${(stats.completionBps / 100).toFixed(1)}%`}
        </div>
      </div>
    </div>
  );
}
