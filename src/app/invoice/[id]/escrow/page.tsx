"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useWallet } from "../../../../components/WalletProvider";
import { sharpyClient, NETWORK } from "../../../../lib/client";
import { explorerUrl, truncateAddress } from "../../../../lib/utils";
import type { Invoice } from "../../../../lib/utils";

export default function EscrowPage() {
  const { id } = useParams<{ id: string }>();
  const invoiceId = Number(id);
  const { publicKey, signerReady, connect } = useWallet();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [releasing, setReleasing] = useState(false);
  const [txHash, setTxHash] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    sharpyClient.getInvoice(invoiceId).then(setInvoice).catch((e) => setError(e.message));
  }, [invoiceId]);

  const handleRelease = async () => {
    if (!publicKey || !signerReady) return;
    setReleasing(true); setError("");
    try {
      const { txHash } = await sharpyClient.releaseEscrow(publicKey, invoiceId);
      setTxHash(txHash);
      setInvoice(await sharpyClient.getInvoice(invoiceId));
    } catch (e: any) { setError(e.message); }
    finally { setReleasing(false); }
  };

  if (!invoice) return (
    <div className="max-w-lg mx-auto card p-8 animate-pulse h-48" />
  );

  return (
    <div className="max-w-lg mx-auto space-y-5">
      <div>
        <p className="mono text-xs mb-1">Invoice #{invoiceId}</p>
        <h1 className="font-display text-2xl font-bold text-[#F1F2F6]">Escrow</h1>
      </div>

      <div className="card p-6 space-y-5">
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3">
          <p className="text-xs text-amber-400">
            Escrow protection is active. Funds are locked for{" "}
            <strong>{invoice.escrowReleaseDelay / 3600} hours</strong> after full payment before release.
          </p>
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-[#4B5563]">Status</span>
          <span className={`badge badge-${invoice.status.toLowerCase()}`}>{invoice.status}</span>
        </div>

        {/* Arbitrator */}
        <div className="rounded-xl p-4 space-y-2" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
          <div className="flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1l2.5 3L13 5.5 10 8l0.5 4L7 10.2 3.5 12 4 8 1 5.5l3.5-1.5L7 1z" stroke="var(--muted)" strokeWidth="1.2" strokeLinejoin="round"/></svg>
            <p className="text-xs font-medium" style={{ color: "var(--text)" }}>Arbitrator</p>
            {invoice.arbitrator ? <span className="text-xs px-1.5 py-0.5 rounded-full bg-[#6C63FF]/15 text-[#6C63FF]">assigned</span> : <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: "var(--surface)", color: "var(--muted)", border: "1px solid var(--border)" }}>none</span>}
          </div>
          {invoice.arbitrator ? (
            <div className="flex items-center gap-2">
              <span className="mono text-xs" style={{ color: "var(--text-secondary)" }}>{truncateAddress(invoice.arbitrator)}</span>
              <a href={explorerUrl(NETWORK, invoice.arbitrator, "contract")} target="_blank" rel="noreferrer" className="text-xs text-[#6C63FF] underline">Explorer</a>
            </div>
          ) : (
            <p className="text-xs" style={{ color: "var(--muted)" }}>No arbitrator assigned. Escrow release is automatic after the delay. If assigned, the arbitrator can resolve disputes.</p>
          )}
        </div>

        {invoice.status === "Released" ? (
          <div className="text-sm text-[#00D4AA] bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3">
            Escrow has been released successfully.
          </div>
        ) : !publicKey ? (
          <button onClick={connect} className="btn-primary w-full py-3">Connect Wallet to Release</button>
        ) : !signerReady ? (
          <button onClick={connect} className="btn-primary w-full py-3">Reconnect Wallet</button>
        ) : (
          <button onClick={handleRelease} disabled={releasing} className="btn-primary w-full py-3">
            {releasing ? "Releasing..." : "Release Escrow"}
          </button>
        )}

        {error && <p className="text-sm text-red-400">{error}</p>}
        {txHash && (
          <a href={explorerUrl(NETWORK, txHash, "tx")} target="_blank" rel="noreferrer"
            className="text-xs text-[#6C63FF] hover:underline block">
            View transaction
          </a>
        )}
      </div>
    </div>
  );
}
