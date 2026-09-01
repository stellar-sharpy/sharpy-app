"use client";
import Link from "next/link";

interface SharpyButtonProps {
  invoiceId: number;
  amount?: string;
  label?: string;
  theme?: "light" | "dark" | "auto";
  size?: "sm" | "md" | "lg";
  className?: string;
}

/**
 * SharpyButton — embeddable payment button for external sites.
 * Renders a styled CTA that links to the Sharpy pay page.
 * Example embed:
 *   <iframe src="https://sharpy.example/widget/42?label=Pay+with+Sharpy" />
 * Or direct React usage:
 *   <SharpyButton invoiceId={42} amount="10 USDC" />
 */
export default function SharpyButton({ invoiceId, amount, label, theme = "auto", size = "md", className }: SharpyButtonProps) {
  const text = label ?? (amount ? `Pay ${amount} with Sharpy` : "Pay with Sharpy");
  const sizeClasses = size === "sm" ? "px-3 py-1.5 text-xs" : size === "lg" ? "px-8 py-3.5 text-base" : "px-5 py-2.5 text-sm";
  const themeStyles =
    theme === "light"
      ? { background: "#111318", color: "#F1F2F6", border: "1px solid #1E2028" }
      : theme === "dark"
      ? { background: "#F1F2F6", color: "#111318", border: "1px solid #E5E7EB" }
      : { background: "linear-gradient(135deg, #6C63FF, #00D4AA)", color: "#fff", border: "1px solid transparent" };

  return (
    <Link
      href={`/pay/${invoiceId}`}
      target="_blank"
      rel="noreferrer"
      className={`inline-flex items-center gap-2 rounded-full font-semibold transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-[#6C63FF]/20 ${sizeClasses} ${className ?? ""}`}
      style={themeStyles}
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M8 1.5L13.5 4.5v7L8 14.5 2.5 11.5v-7L8 1.5z" stroke="currentColor" strokeWidth="1.3" fill="currentColor" fillOpacity="0.12" />
        <path d="M5 8l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {text}
    </Link>
  );
}

export function SharpyButtonEmbedCode({ invoiceId }: { invoiceId: number }) {
  const snippet = `<iframe src="\${typeof window !== "undefined" ? window.location.origin : ""}/widget/${invoiceId}" width="220" height="48" frameborder="0"></iframe>`;
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium" style={{ color: "var(--text)" }}>Embed this invoice</p>
      <div className="rounded-lg p-3 flex items-center gap-2" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
        <code className="text-xs mono flex-1 truncate" style={{ color: "var(--muted)" }}>{snippet}</code>
        <button onClick={() => navigator.clipboard.writeText(snippet)} className="text-xs text-[#6C63FF] hover:underline shrink-0">Copy</button>
      </div>
    </div>
  );
}
