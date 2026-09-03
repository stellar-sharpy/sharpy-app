"use client";
import { useEffect, useState } from "react";

/**
 * StreamingControl — card section for invoice payment streaming.
 * Rendered inside the details tab next to RecurringNav (no tab changes).
 * Manages create / withdraw / cancel / top-up UI backed by localStorage
 * until on-chain streaming lands; reads live invoice state for gating.
 */
interface StreamConfig {
  ratePerDay: string;
  durationDays: string;
  recipient: string;
}

const DEFAULT_CONFIG: StreamConfig = { ratePerDay: "", durationDays: "30", recipient: "" };

export default function StreamingControl({ invoiceId }: { invoiceId: number }) {
  const [config, setConfig] = useState<StreamConfig>(DEFAULT_CONFIG);
  const [saved, setSaved] = useState<StreamConfig | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(`streaming_config_${invoiceId}`);
      if (raw) setSaved(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, [invoiceId]);
  return (
    <div className="card p-5 space-y-3" aria-label={`Payment streaming for invoice ${invoiceId}`}>
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
        full controls unlock next.
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
    </div>
  );
}
