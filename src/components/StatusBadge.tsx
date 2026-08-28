"use client";

type InvoiceStatus = "Pending" | "Released" | "Refunded" | "Cancelled";

interface StatusBadgeProps {
  status: InvoiceStatus;
  /** If true, renders a larger pill-style badge */
  large?: boolean;
  /** Show an animated pulse dot for Pending status */
  animated?: boolean;
}

const STATUS_CONFIG: Record<InvoiceStatus, { label: string; color: string; bg: string; border: string; dot: string }> = {
  Pending: {
    label: "Pending",
    color: "#6C63FF",
    bg: "rgba(108,99,255,0.12)",
    border: "rgba(108,99,255,0.25)",
    dot: "#6C63FF",
  },
  Released: {
    label: "Released",
    color: "#00D4AA",
    bg: "rgba(0,212,170,0.12)",
    border: "rgba(0,212,170,0.25)",
    dot: "#00D4AA",
  },
  Refunded: {
    label: "Refunded",
    color: "#FB923C",
    bg: "rgba(251,146,60,0.12)",
    border: "rgba(251,146,60,0.25)",
    dot: "#FB923C",
  },
  Cancelled: {
    label: "Cancelled",
    color: "#6B7280",
    bg: "rgba(107,114,128,0.12)",
    border: "rgba(107,114,128,0.25)",
    dot: "#6B7280",
  },
};

/**
 * StatusBadge — animated invoice status pill.
 * Replaces the raw CSS badge class with a typed, self-contained component.
 * Pending badges optionally render a pulsing dot.
 */
export default function StatusBadge({ status, large = false, animated = true }: StatusBadgeProps) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.Pending;
  const isPending = status === "Pending";

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full font-medium"
      style={{
        color: cfg.color,
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
        padding: large ? "0.35rem 0.85rem" : "0.2rem 0.6rem",
        fontSize: large ? "0.8rem" : "0.7rem",
        lineHeight: 1.4,
      }}
    >
      {isPending && animated ? (
        <span
          className="inline-block rounded-full animate-pulse"
          style={{ width: 6, height: 6, background: cfg.dot, flexShrink: 0 }}
        />
      ) : (
        <span
          className="inline-block rounded-full"
          style={{ width: 6, height: 6, background: cfg.dot, flexShrink: 0 }}
        />
      )}
      {cfg.label}
    </span>
  );
}
