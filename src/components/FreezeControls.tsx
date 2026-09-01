"use client";
import { useState } from "react";
import { useWallet } from "./WalletProvider";
import { sharpyClient } from "../lib/client";

export default function FreezeControls({ invoiceId, frozen: initialFrozen, onUpdate }: { invoiceId: number; frozen?: boolean; onUpdate?: () => void }) {
  const { publicKey, signerReady, connect } = useWallet();
  const [frozen, setFrozen] = useState(initialFrozen ?? false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [txHash, setTxHash] = useState("");

  const handleToggle = async () => {
    if (!publicKey || !signerReady) return;
    setLoading(true); setError("");
    try {
      const res = frozen ? await sharpyClient.unfreezeInvoice(publicKey, invoiceId) : await sharpyClient.freezeInvoice(publicKey, invoiceId);
      setTxHash(res.txHash);
      setFrozen(!frozen);
      onUpdate?.();
    } catch (e: any) {
      setError(e.message ?? "Operation failed");
    } finally { setLoading(false); }
  };

  return (
    <div className="card p-4 space-y-3" style={{ borderColor: frozen ? "rgba(239,68,68,0.3)" : "var(--border)" }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${frozen ? "bg-red-500 animate-pulse" : "bg-emerald-500"}`} />
          <p className="text-sm font-medium" style={{ color: "var(--text)" }}>{frozen ? "Frozen" : "Active"} — Admin controls</p>
        </div>
        {frozen && <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">Payments paused</span>}
      </div>
      <p className="text-xs" style={{ color: "var(--muted)" }}>
        {frozen ? "This invoice is frozen. Admin must unfreeze before payments can resume." : "Admin can freeze this invoice to temporarily pause payments."}
      </p>
      {!publicKey ? (
        <button onClick={connect} className="btn-ghost text-xs w-full">Connect wallet</button>
      ) : !signerReady ? (
        <button onClick={connect} className="btn-ghost text-xs w-full">Reconnect wallet</button>
      ) : (
        <button onClick={handleToggle} disabled={loading} className={`w-full py-2 rounded-lg text-sm font-medium border transition-colors disabled:opacity-50 ${frozen ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20" : "bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20"}`}>
          {loading ? (frozen ? "Unfreezing..." : "Freezing...") : frozen ? "Unfreeze Invoice" : "Freeze Invoice"}
        </button>
      )}
      {error && <p className="text-xs text-red-400">{error}</p>}
      {txHash && <p className="text-xs text-emerald-400">Tx: {txHash.slice(0,12)}…</p>}
    </div>
  );
}
