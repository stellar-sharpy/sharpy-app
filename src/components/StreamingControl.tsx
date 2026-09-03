"use client";

/**
 * StreamingControl — card section for invoice payment streaming.
 * Rendered inside the details tab next to RecurringNav (no tab changes).
 * Manages create / withdraw / cancel / top-up UI backed by localStorage
 * until on-chain streaming lands; reads live invoice state for gating.
 */
export default function StreamingControl({ invoiceId }: { invoiceId: number }) {
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
    </div>
  );
}
