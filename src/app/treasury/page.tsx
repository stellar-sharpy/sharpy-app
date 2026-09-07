"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { sharpyClient, NETWORK, CONTRACT_ID } from "../../lib/client";
import { truncateAddress } from "../../lib/utils";
import { CopyButton } from "../../components/CopyButton";

export default function TreasuryPage() {
  const [treasury, setTreasury] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    sharpyClient.getTreasury()
      .then((t) => { setTreasury(t); setError(null); })
      .catch(() => { setTreasury(null); setError("Could not load the treasury address from the contract."); })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold" style={{ color: "var(--text)" }}>Treasury</h1>
        <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>Protocol treasury for contract <span className="mono">{truncateAddress(CONTRACT_ID)}</span> on {NETWORK}.</p>
      </div>

      <div className="card p-4 space-y-2">
        <p className="text-xs font-medium" style={{ color: "var(--text)" }}>Treasury address</p>
        {loading && <div className="h-6 rounded animate-pulse" role="status" aria-label="Loading treasury address" style={{ background: "var(--surface-2)" }} />}
        {!loading && error && <p className="text-sm" role="alert" style={{ color: "#E5484D" }}>{error}</p>}
        {!loading && !error && treasury && (
          <div className="flex items-center gap-2">
            <p className="mono text-sm break-all" style={{ color: "var(--text)" }}>{treasury}</p>
            <CopyButton value={treasury} label="treasury address" />
          </div>
        )}
        {!loading && !error && treasury && (
          <a href={`https://stellar.expert/explorer/testnet/account/${treasury}`} target="_blank" rel="noreferrer" className="text-xs text-[#6C63FF] hover:underline">
            View on Explorer
          </a>
        )}
      </div>

      <Link href="/dashboard" className="text-xs text-[#6C63FF] hover:underline" aria-label="Back to dashboard">← Back to dashboard</Link>
    </div>
  );
}
