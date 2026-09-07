"use client";
import { useState } from "react";
import Link from "next/link";
import { useWallet } from "../../components/WalletProvider";
import { sharpyClient, NETWORK } from "../../lib/client";
import { formatAmount, parseAmount, explorerUrl } from "../../lib/utils";
import { CopyButton } from "../../components/CopyButton";

interface Row { id: string; invoiceId: string; amount: string; }

export default function PoolPayPage() {
  const { publicKey, signerReady, connect } = useWallet();
  const [rows, setRows] = useState<Row[]>([{ id: "1", invoiceId: "", amount: "" }]);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");
  const [txHash, setTxHash] = useState("");

  const add = () => setRows((r) => [...r, { id: Math.random().toString(36).slice(2), invoiceId: "", amount: "" }]);
  const remove = (id: string) => setRows((r) => r.filter((x) => x.id !== id));
  const update = (id: string, field: keyof Row, val: string) => setRows((r) => r.map((x) => x.id === id ? { ...x, [field]: val } : x));

  const handlePay = async () => {
    if (!publicKey || !signerReady) return;
    setError("");
    const payments = rows.map((r) => {
      const iid = Number(r.invoiceId);
      if (!iid || isNaN(iid)) throw new Error(`Invalid invoice ID: ${r.invoiceId}`);
      if (!r.amount || isNaN(Number(r.amount))) throw new Error(`Invalid amount for #${r.invoiceId}`);
      return { invoiceId: iid, amount: parseAmount(r.amount) };
    });
    if (payments.length === 0) throw new Error("Add at least one payment");
    setPaying(true);
    try {
      const { txHash: h } = await sharpyClient.poolPay(publicKey, payments);
      setTxHash(h);
    } catch (e: any) { setError(e.message ?? "pool_pay failed"); }
    finally { setPaying(false); }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6 animate-fade-up">
      <div>
        <h1 className="font-display text-2xl font-bold" style={{ color: "var(--text)" }}>Pool Pay</h1>
        <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>Pay multiple invoices in one transaction — same token, gas efficient.</p>
      </div>

      {!publicKey ? (
        <div className="card p-8 text-center space-y-3">
          <p className="text-sm" style={{ color: "var(--muted)" }}>Connect wallet to pool pay.</p>
          <button onClick={connect} className="btn-primary">Connect Wallet</button>
        </div>
      ) : !signerReady ? (
        <div className="card p-8 text-center space-y-3">
          <p className="text-sm" style={{ color: "var(--muted)" }}>Session expired.</p>
          <button onClick={connect} className="btn-primary">Reconnect</button>
        </div>
      ) : (
        <div className="card p-6 space-y-4">
          {rows.map((r, i) => (
            <div key={r.id} className="flex gap-2 items-end">
              <div className="flex-1">
                <label className="text-xs" style={{ color: "var(--muted)" }}>Invoice #{i + 1} ID</label>
                <input value={r.invoiceId} onChange={(e) => update(r.id, "invoiceId", e.target.value)} placeholder="e.g. 42" className="input mt-1 text-sm" />
              </div>
              <div className="flex-1">
                <label className="text-xs" style={{ color: "var(--muted)" }}>Amount (USDC)</label>
                <input value={r.amount} onChange={(e) => update(r.id, "amount", e.target.value)} placeholder="10.00" className="input mt-1 text-sm" />
              </div>
              {rows.length > 1 && (
                <button onClick={() => remove(r.id)} className="mb-1 text-xs px-2 py-1 rounded-lg border text-red-400" style={{ borderColor: "rgba(239,68,68,0.25)" }}>✕</button>
              )}
            </div>
          ))}
          <button onClick={add} className="text-xs text-[#6C63FF] hover:underline">+ Add invoice</button>
          {error && <p className="text-xs text-red-400" role="alert">{error}</p>}
          {txHash ? (
            <div className="rounded-xl p-4 bg-emerald-500/10 border border-emerald-500/20 space-y-3" role="status" aria-label="Pool pay confirmed">
              <p className="text-sm font-medium text-emerald-400">Pool pay confirmed — {rows.length} invoice{rows.length > 1 ? "s" : ""} in one transaction</p>
              <ul className="space-y-1">
                {rows.map((r) => (
                  <li key={r.id} className="flex justify-between text-xs" style={{ color: "var(--muted)" }}>
                    <span className="mono">Invoice #{r.invoiceId}</span>
                    <span>{(() => { try { return `${formatAmount(parseAmount(r.amount))} USDC`; } catch { return r.amount; } })()}</span>
                  </li>
                ))}
              </ul>
              <div className="flex items-center gap-2 text-xs">
                <span className="mono" style={{ color: "var(--muted)" }}>{txHash.slice(0, 12)}…</span>
                <CopyButton value={txHash} label="transaction hash" />
                <a href={explorerUrl(NETWORK, txHash, "tx")} target="_blank" rel="noreferrer" className="text-[#6C63FF] hover:underline">Explorer</a>
                <Link href="/dashboard" className="underline ml-auto">Dashboard</Link>
              </div>
            </div>
          ) : (
            <button onClick={handlePay} disabled={paying} className="btn-primary w-full py-3 disabled:opacity-50">{paying ? "Paying..." : `Pay ${rows.length} invoice${rows.length>1?"s":""} in one tx`}</button>
          )}
          {rows.length > 0 && (
            <p className="text-xs text-center" style={{ color: "var(--muted)" }}>Total amount: {(() => { try { return formatAmount(rows.reduce((a, r) => a + (r.amount ? parseAmount(r.amount) : 0n), 0n)); } catch { return "—"; } })()} USDC</p>
          )}
        </div>
      )}

      <div className="text-xs" style={{ color: "var(--muted)" }}>
        <Link href="/dashboard" className="text-[#6C63FF] hover:underline">← Back to dashboard</Link>
      </div>
    </div>
  );
}
