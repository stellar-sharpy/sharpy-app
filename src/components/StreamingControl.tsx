"use client";
import { useEffect, useState } from "react";
import { useToast } from "./Toast";
import { useStreaming } from "../lib/streamingHook";
import { formatAmount } from "../lib/utils";

/**
 * StreamingControl — card section for invoice payment streaming.
 * Rendered inside the details tab next to RecurringNav (no tab changes).
 * Manages create / withdraw / cancel / top-up UI backed by localStorage
 * until on-chain streaming lands; reads live invoice state for gating.
 *
 * @param invoiceId - Target invoice id; used as localStorage key namespace.
 */
interface StreamConfig {
  ratePerDay: string;
  durationDays: string;
  recipient: string;
}

const DEFAULT_CONFIG: StreamConfig = { ratePerDay: "", durationDays: "30", recipient: "" };

export default function StreamingControl({ invoiceId }: { invoiceId: number }) {
  const { toast } = useToast();
  const { funded } = useStreaming(invoiceId);
  const [config, setConfig] = useState<StreamConfig>(DEFAULT_CONFIG);
  const [saved, setSaved] = useState<StreamConfig | null>(null);
  const [busy, setBusy] = useState<"create" | "withdraw" | "cancel" | "topup" | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(`streaming_config_${invoiceId}`);
      if (raw) setSaved(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, [invoiceId]);

  const persist = (next: StreamConfig) => {
    setSaved(next);
    try {
      localStorage.setItem(`streaming_config_${invoiceId}`, JSON.stringify(next));
    } catch {
      /* storage unavailable */
    }
  };

  const handleCreate = async () => {
    if (!config.ratePerDay || !config.durationDays) {
      toast("Enter a rate and duration first", "error");
      return;
    }
    setBusy("create");
    await new Promise((r) => setTimeout(r, 400));
    persist(config);
    toast("Streaming schedule saved", "success");
    setBusy(null);
  };

  const handleWithdraw = async () => {
    setBusy("withdraw");
    await new Promise((r) => setTimeout(r, 400));
    toast("Withdrawable amount claimed (preview)", "success");
    setBusy(null);
  };

  const handleCancel = async () => {
    setBusy("cancel");
    await new Promise((r) => setTimeout(r, 400));
    try {
      localStorage.removeItem(`streaming_config_${invoiceId}`);
    } catch {
      /* ignore */
    }
    setSaved(null);
    setConfig(DEFAULT_CONFIG);
    toast("Streaming schedule cancelled", "info");
    setBusy(null);
  };

  const handleTopUp = async () => {
    setBusy("topup");
    await new Promise((r) => setTimeout(r, 400));
    toast("Top-up recorded (preview)", "success");
    setBusy(null);
  };
  return (
    <div className="card p-5 space-y-3 hover:border-[var(--border-hover)] transition-colors" aria-label={`Payment streaming for invoice ${invoiceId}`} role="region">
      <div className="flex items-center gap-2">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M2 8h3l2-4 2 8 2-4h3" stroke="var(--muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <p className="text-sm font-medium" style={{ color: "var(--text)" }}>
          Payment Streaming
        </p>
        <span
          className="text-xs px-2 py-0.5 rounded-full font-medium"
          style={{ background: "rgba(108,99,255,0.15)", color: "var(--primary)" }}
        >
          beta
        </span>
      </div>
      <p className="text-xs leading-relaxed" style={{ color: "var(--muted)" }}>
        Stream invoice #{invoiceId} payouts over time instead of one lump sum. Configure a rate below;
        full controls unlock next. Schedules persist locally per invoice.
        {funded !== null && <> Currently funded: {formatAmount(funded)}.</>}
      </p>
      <div className="grid grid-cols-3 gap-2">
        <label className="space-y-1">
          <span className="text-xs" style={{ color: "var(--muted)" }}>Rate / day</span>
          <input
            value={config.ratePerDay}
            onChange={(e) => setConfig((c) => ({ ...c, ratePerDay: e.target.value }))}
            placeholder="10"
            inputMode="decimal"
            aria-label="Streaming rate per day"
            className="input w-full text-sm"
          />
        </label>
        <label className="space-y-1">
          <span className="text-xs" style={{ color: "var(--muted)" }}>Days</span>
          <input
            value={config.durationDays}
            onChange={(e) => setConfig((c) => ({ ...c, durationDays: e.target.value }))}
            placeholder="30"
            inputMode="numeric"
            aria-label="Streaming duration in days"
            className="input w-full text-sm"
          />
        </label>
        <label className="space-y-1">
          <span className="text-xs" style={{ color: "var(--muted)" }}>Recipient</span>
          <input
            value={config.recipient}
            onChange={(e) => setConfig((c) => ({ ...c, recipient: e.target.value }))}
            placeholder="G…"
            aria-label="Streaming recipient address"
            className="input w-full text-sm mono"
          />
        </label>
      </div>
      {saved && (
        <p className="text-xs" style={{ color: "var(--muted)" }}>
          Saved: {saved.ratePerDay || "—"}/day × {saved.durationDays}d
        </p>
      )}
      <div className="grid grid-cols-2 gap-2 pt-1">
        <button onClick={handleCreate} disabled={busy !== null} className="btn-primary text-xs py-2 disabled:opacity-50" aria-label="Create stream">
          {busy === "create" ? "Saving…" : "Create stream"}
        </button>
        <button onClick={handleTopUp} disabled={busy !== null || !saved} className="text-xs py-2 rounded-lg border disabled:opacity-50" style={{ borderColor: "var(--border)", color: "var(--text-secondary)", background: "var(--surface-2)" }} aria-label="Top up stream">
          {busy === "topup" ? "Topping up…" : "Top up"}
        </button>
        <button onClick={handleWithdraw} disabled={busy !== null || !saved} className="text-xs py-2 rounded-lg border disabled:opacity-50" style={{ borderColor: "var(--border)", color: "var(--text-secondary)", background: "var(--surface-2)" }} aria-label="Withdraw from stream">
          {busy === "withdraw" ? "Withdrawing…" : "Withdraw"}
        </button>
        <button onClick={handleCancel} disabled={busy !== null || !saved} className="text-xs py-2 rounded-lg border disabled:opacity-50" style={{ borderColor: "rgba(239,68,68,0.25)", color: "#EF4444", background: "rgba(239,68,68,0.08)" }} aria-label="Cancel stream">
          {busy === "cancel" ? "Cancelling…" : "Cancel"}
        </button>
      </div>
    </div>
  );
}
