"use client";
import { useState, useEffect, useCallback } from "react";
import { sharpyClient } from "../lib/client";
import { formatAmount, parseAmount } from "../lib/utils";
import { getTokenByAddress } from "../lib/tokens";
import type { Invoice } from "../lib/utils";

interface Props {
  invoiceId: number;
  invoice: Invoice;
  defaultAmount?: string;
}

/**
 * PayoutPreview — shows per-recipient payout breakdown before signing.
 * Calls previewPayout on-chain (read-only simulation) and renders a table.
 * Updates debounced on amount change.
 */
export default function PayoutPreview({ invoiceId, invoice, defaultAmount = "" }: Props) {
  const [amount, setAmount] = useState(defaultAmount);
  const [payouts, setPayouts] = useState<bigint[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const total = invoice.amounts.reduce((a, b) => a + b, 0n);
  const tokenSymbol = getTokenByAddress(invoice.tokens[0] ?? "")?.symbol ?? "tokens";

  const fetchPreview = useCallback(
    async (amt: string) => {
      const parsed = parseAmount(amt);
      if (!parsed || parsed <= 0n) {
        setPayouts(null);
        setError("");
        return;
      }
      setLoading(true);
      setError("");
      try {
        const result = await sharpyClient.previewPayout(invoiceId, parsed);
        setPayouts(result);
      } catch (e: any) {
        setError(e.message ?? "Preview failed");
        setPayouts(null);
      } finally {
        setLoading(false);
      }
    },
    [invoiceId]
  );

  // Debounce 400ms
  useEffect(() => {
    const t = setTimeout(() => fetchPreview(amount), 400);
    return () => clearTimeout(t);
  }, [amount, fetchPreview]);

  const pct = (amt: bigint, denom: bigint) =>
    denom > 0n ? ((Number(amt) / Number(denom)) * 100).toFixed(1) : "0.0";

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ border: "1px solid var(--border)" }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ background: "var(--surface-2)", borderBottom: "1px solid var(--border)" }}
      >
        <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>
          Payout Preview
        </p>
        <span className="text-xs" style={{ color: "var(--muted)" }}>
          {invoice.recipients.length} recipient{invoice.recipients.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Amount input */}
      <div className="px-4 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
        <label className="text-xs mb-1.5 block" style={{ color: "var(--muted)" }}>
          Simulate payment amount
        </label>
        <input
          type="text"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder={`Max ${formatAmount(total - invoice.funded)} ${tokenSymbol}`}
          className="input text-sm w-full"
        />
      </div>

      {/* Table */}
      <div className="divide-y" style={{ borderColor: "var(--border)" }}>
        {loading ? (
          <div className="px-4 py-4 space-y-2">
            {invoice.recipients.map((_, i) => (
              <div key={i} className="h-8 rounded-lg animate-pulse" style={{ background: "var(--surface-2)" }} />
            ))}
          </div>
        ) : error ? (
          <p className="px-4 py-3 text-xs text-red-400">{error}</p>
        ) : payouts ? (
          payouts.map((payout, i) => {
            const addr = invoice.recipients[i] ?? "";
            const share = pct(payout, parseAmount(amount) ?? 0n);
            return (
              <div key={i} className="flex items-center justify-between px-4 py-2.5">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                    style={{ background: "rgba(108,99,255,0.15)", color: "#6C63FF" }}
                  >
                    {i + 1}
                  </span>
                  <span className="mono text-xs truncate" style={{ color: "var(--text-secondary)" }}>
                    {addr.slice(0, 6)}…{addr.slice(-4)}
                  </span>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>
                    {formatAmount(payout)} {tokenSymbol}
                  </p>
                  <p className="text-xs" style={{ color: "var(--muted)" }}>{share}%</p>
                </div>
              </div>
            );
          })
        ) : (
          <p className="px-4 py-4 text-xs text-center" style={{ color: "var(--muted)" }}>
            Enter an amount above to preview the payout split.
          </p>
        )}
      </div>

      {/* Footer: total row */}
      {payouts && (
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{ background: "var(--surface-2)", borderTop: "1px solid var(--border)" }}
        >
          <span className="text-xs font-medium" style={{ color: "var(--muted)" }}>Total distributed</span>
          <span className="text-sm font-bold" style={{ color: "#00D4AA" }}>
            {formatAmount(payouts.reduce((a, b) => a + b, 0n))} {tokenSymbol}
          </span>
        </div>
      )}
    </div>
  );
}
