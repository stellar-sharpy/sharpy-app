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
    setTxHash("");
    try {
      const filled = rows.filter((r) => r.invoiceId.trim() !== "" || r.amount.trim() !== "");
      const skipped = rows.length - filled.length;
      const payments = filled.map((r) => {
        const iid = Number(r.invoiceId);
        if (!iid || isNaN(iid)) throw new Error(`Invalid invoice ID: ${r.invoiceId}`);
        if (!r.amount || isNaN(Number(r.amount))) throw new Error(`Invalid amount for #${r.invoiceId}`);
        return { invoiceId: iid, amount: parseAmount(r.amount) };
      });
      if (payments.length === 0) throw new Error("Add at least one payment");
      if (skipped > 0) setRows(filled);
      setPaying(true);
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
            <div key={r.id} className="flex flex-col sm:flex-row gap-2 sm:items-end">
              <div className="flex-1 min-w-0">
                <label className="text-xs" style={{ color: "var(--muted)" }}>Invoice #{i + 1} ID</label>
                <input value={r.invoiceId} disabled={paying || !!txHash} onChange={(e) => update(r.id, "invoiceId", e.target.value)} placeholder="e.g. 42" inputMode="numeric" className="input mt-1 text-sm disabled:opacity-50" aria-label={`Invoice ${i + 1} ID`} />
              </div>
              <div className="flex-1 min-w-0">
                <label className="text-xs" style={{ color: "var(--muted)" }}>Amount (USDC)</label>
                <input value={r.amount} disabled={paying || !!txHash} onChange={(e) => update(r.id, "amount", e.target.value)} placeholder="10.00" inputMode="decimal" className="input mt-1 text-sm disabled:opacity-50" aria-label={`Invoice ${i + 1} amount in USDC`} />
              </div>
              {txHash ? (
                <span className="mb-2 text-emerald-400 text-sm" role="img" aria-label={`Invoice ${r.invoiceId} paid`}>✓</span>
              ) : rows.length > 1 && (
                <button onClick={() => remove(r.id)} disabled={paying} className="mb-1 text-xs px-2 py-1 rounded-lg border text-red-400 disabled:opacity-50" style={{ borderColor: "rgba(239,68,68,0.25)" }} aria-label={`Remove invoice row ${i + 1}`}>✕</button>
              )}
            </div>
          ))}
          <button onClick={add} disabled={!!txHash} className="text-xs text-[#6C63FF] hover:underline disabled:opacity-50" aria-label="Add another invoice row">+ Add invoice</button>
          <div className="rounded-xl p-3 space-y-1" style={{ background: "var(--surface-2)" }} aria-label="Batch summary">
            <div className="flex justify-between text-xs" style={{ color: "var(--muted)" }}>
              <span>Invoices in batch</span>
              <span className="mono">{rows.length}</span>
            </div>
            <div className="flex justify-between text-sm font-medium" style={{ color: "var(--text)" }}>
              <span>Total</span>
              <span>{(() => { try { return `${formatAmount(rows.reduce((a, r) => a + (r.amount ? parseAmount(r.amount) : 0n), 0n))} USDC`; } catch { return "—"; } })()}</span>
            </div>
            <p className="text-xs" style={{ color: "var(--muted)" }}>Settles in a single transaction.</p>
          </div>
          {error && <p className="text-xs text-red-400" role="alert" aria-live="assertive">{error}</p>}
          {txHash ? (
            <div className="rounded-xl p-4 bg-emerald-500/10 border border-emerald-500/20 space-y-3" role="status" aria-live="polite" aria-label="Pool pay confirmed">
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
                <button
                  onClick={() => { setRows([{ id: "1", invoiceId: "", amount: "" }]); setTxHash(""); setError(""); }}
                  className="underline ml-auto"
                  style={{ color: "var(--muted)" }}
                  aria-label="Start a new batch"
                >
                  New batch
                </button>
                <Link href="/dashboard" className="underline">Dashboard</Link>
              </div>
            </div>
          ) : (
            <button onClick={handlePay} disabled={paying} className="btn-primary w-full py-3 disabled:opacity-50">{paying ? "Paying..." : `Pay ${rows.length} invoice${rows.length>1?"s":""} in one tx`}</button>
          )}
        </div>
      )}

      <div className="text-xs" style={{ color: "var(--muted)" }}>
        <Link href="/dashboard" className="text-[#6C63FF] hover:underline">← Back to dashboard</Link>
      </div>
    </div>
  );
}
