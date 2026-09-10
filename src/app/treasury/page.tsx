"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { sharpyClient, NETWORK, CONTRACT_ID } from "../../lib/client";
import { truncateAddress } from "../../lib/utils";
import { CopyButton } from "../../components/CopyButton";
import ContractInfo from "../../components/ContractInfo";

export default function TreasuryPage() {
  const [treasury, setTreasury] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // The vendored SDK (0.1.0) predates getTreasury; call it through a narrow
  // typed accessor so app code stays type-safe without touching packages/sdk.
  function getTreasuryAddress(): Promise<string> {
    const client = sharpyClient as unknown as { getTreasury: () => Promise<string> };
    return client.getTreasury();
  }

  function load() {
    setLoading(true);
    setError(null);
    getTreasuryAddress()
      .then((t: string) => { setTreasury(t); setError(null); })
      .catch(() => { setTreasury(null); setError("Could not load the treasury address from the contract."); })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold" style={{ color: "var(--text)" }}>Treasury</h1>
        <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>Protocol treasury for contract <span className="mono">{truncateAddress(CONTRACT_ID)}</span> on {NETWORK}.</p>
      </div>

      <ContractInfo />

      <div className="card p-4 space-y-2" aria-live="polite">
        <p className="text-xs font-medium" style={{ color: "var(--text)" }}>Treasury address</p>
        {loading && (
          <div className="space-y-2" role="status" aria-label="Loading treasury address">
            <div className="h-6 rounded animate-pulse" style={{ background: "var(--surface-2)" }} />
            <p className="text-xs" style={{ color: "var(--muted)" }}>Reading treasury address from the contract…</p>
          </div>
        )}
        {!loading && error && (
          <div className="space-y-2">
            <p className="text-sm" role="alert" style={{ color: "#E5484D" }}>{error}</p>
            <button onClick={load} className="btn-ghost text-xs px-3 py-1.5" aria-label="Retry loading treasury address">
              Retry
            </button>
          </div>
        )}
        {!loading && !error && !treasury && (
          <div className="space-y-2" role="status">
            <p className="text-sm" style={{ color: "var(--muted)" }}>No treasury address is set on this contract yet.</p>
            <button onClick={load} className="btn-ghost text-xs px-3 py-1.5" aria-label="Refresh treasury address">
              Refresh
            </button>
          </div>
        )}
        {!loading && !error && treasury && (
          <div className="flex items-start gap-2 min-w-0">
            <p className="mono text-sm break-all flex-1 min-w-0" style={{ color: "var(--text)" }}>{treasury}</p>
            <CopyButton value={treasury} label="treasury address" />
          </div>
        )}
        {!loading && !error && treasury && (
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            <a href={`https://stellar.expert/explorer/${NETWORK}/account/${treasury}`} target="_blank" rel="noreferrer" className="text-xs text-[#6C63FF] hover:underline" aria-label="View treasury account on Stellar Explorer">
              View treasury on Explorer
            </a>
            <a href={`https://stellar.expert/explorer/${NETWORK}/contract/${CONTRACT_ID}`} target="_blank" rel="noreferrer" className="text-xs text-[#6C63FF] hover:underline" aria-label="View Sharpy contract on Stellar Explorer">
              View contract on Explorer
            </a>
          </div>
        )}
      </div>

      <div className="card p-4 space-y-2">
        <p className="text-xs font-medium" style={{ color: "var(--text)" }}>How the treasury is funded</p>
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          Payers can attach an optional tip to any payment via <span className="mono">pay_with_tip</span>;
          tips settle straight to this address alongside the invoice payment.
        </p>
        <Link href="/dashboard" className="text-xs text-[#6C63FF] hover:underline" aria-label="Find an invoice to pay with a tip">
          Find an invoice to pay →
        </Link>
      </div>

      <Link href="/dashboard" className="text-xs text-[#6C63FF] hover:underline" aria-label="Back to dashboard">← Back to dashboard</Link>
    </div>
  );
}
