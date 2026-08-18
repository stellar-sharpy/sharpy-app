"use client";
import type { Invoice } from "../lib/utils";

interface Props {
  invoice: Invoice;
}

/**
 * VerifiedBadge — green checkmark badge shown on fully-funded invoices.
 * Displays "Fully Funded" with a checkmark icon.
 */
export default function VerifiedBadge({ invoice }: Props) {
  const total = invoice.amounts.reduce((a, b) => a + b, 0n);
  const isFullyFunded = invoice.funded >= total && total > 0n;

  if (!isFullyFunded) return null;

  return (
    <div
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
      style={{
        background: "rgba(16,185,129,0.12)",
        color: "#10B981",
        border: "1px solid rgba(16,185,129,0.25)",
      }}
    >
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path
          d="M2 7.5l3.5 3.5L12 3"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      Fully Funded
    </div>
  );
}
