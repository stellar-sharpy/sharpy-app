"use client";
import { useEffect, useState } from "react";
import { sharpyClient, NETWORK, CONTRACT_ID } from "../lib/client";
import { truncateAddress, explorerUrl } from "../lib/utils";

export default function ContractInfo() {
  const [treasury, setTreasury] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    sharpyClient.getTreasury()
      .then(setTreasury)
      .catch(() => setTreasury(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="card p-4 animate-pulse h-20" />;

  return (
    <div className="card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div className="space-y-1">
        <p className="text-xs font-medium" style={{ color: "var(--text)" }}>Protocol Contract</p>
        <p className="mono text-xs" style={{ color: "var(--muted)" }}>{CONTRACT_ID.slice(0,12)}… • {NETWORK}</p>
        {treasury && (
          <p className="text-xs" style={{ color: "var(--muted)" }}>
            Treasury: <span className="mono">{truncateAddress(treasury)}</span>
            {" "}<a href={explorerUrl(NETWORK, treasury, "contract")} target="_blank" rel="noreferrer" className="text-[#6C63FF] underline">view</a>
          </p>
        )}
      </div>
      <div className="flex items-center gap-2">
        <a href={`https://stellar.expert/explorer/${NETWORK}/contract/${CONTRACT_ID}`} target="_blank" rel="noreferrer" className="text-xs px-3 py-2 rounded-lg border" style={{ borderColor: "var(--border)", color: "var(--text-secondary)", background: "var(--surface-2)" }}>
          Explorer ↗
        </a>
        <span className="text-xs px-2 py-1 rounded-full" style={{ background: "rgba(0,212,170,0.12)", color: "#00D4AA", border: "1px solid rgba(0,212,170,0.25)" }}>
          Soroban v22
        </span>
      </div>
    </div>
  );
}

export function VersionBadge({ invoiceId }: { invoiceId: number }) {
  const [version, setVersion] = useState<number | null>(null);
  useEffect(() => {
    sharpyClient.getInvoiceVersion(invoiceId).then(setVersion).catch(() => {});
  }, [invoiceId]);
  if (version === null) return null;
  return (
    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(108,99,255,0.12)", color: "#6C63FF", border: "1px solid rgba(108,99,255,0.2)" }}>
      v{version}
    </span>
  );
}
