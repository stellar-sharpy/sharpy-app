"use client";
import { useState } from "react";
import { formatAmount } from "../lib/utils";

interface Props {
  invoiceId: number;
  amount: string;
  recipientCount: number;
  deadline: number;
  url: string;
}

export default function ShareCard({ invoiceId, amount, recipientCount, deadline, url }: Props) {
  const [copied, setCopied] = useState(false);
  const deadlineStr = new Date(deadline * 1000).toLocaleDateString(undefined, { dateStyle: "medium" });
  const text = `Pay ${amount} to ${recipientCount} recipient${recipientCount !== 1 ? "s" : ""} by ${deadlineStr} via Sharpy: ${url}`;

  const copy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareTwitter = () => {
    const u = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    window.open(u, "_blank");
  };

  return (
    <div className="card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>Share invoice</p>
        <span className="text-xs px-2 py-1 rounded-full" style={{ background: "rgba(108,99,255,0.12)", color: "#6C63FF" }}>Invoice #{invoiceId}</span>
      </div>

      {/* OG preview card */}
      <div className="rounded-xl overflow-hidden border" style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}>
        <div className="h-24 bg-gradient-to-br from-[#6C63FF] to-[#00D4AA] flex items-center justify-center p-4">
          <div className="text-center">
            <p className="text-white font-display font-bold text-lg">{amount} • {recipientCount} recipient{recipientCount !== 1 ? "s" : ""}</p>
            <p className="text-white/80 text-xs mt-1">Pay via Sharpy on Stellar</p>
          </div>
        </div>
        <div className="p-3 flex items-center justify-between">
          <p className="text-xs mono truncate flex-1 mr-2" style={{ color: "var(--muted)" }}>{url}</p>
          <button onClick={copy} className="text-xs px-3 py-1.5 rounded-lg bg-[#6C63FF] text-white font-medium shrink-0">
            {copied ? "Copied ✓" : "Copy link"}
          </button>
        </div>
      </div>

      <div className="flex gap-2">
        <button onClick={shareTwitter} className="flex-1 text-xs py-2 rounded-lg border font-medium" style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}>Share on X</button>
        <button onClick={copy} className="flex-1 text-xs py-2 rounded-lg bg-[#6C63FF] text-white font-medium">Copy URL</button>
      </div>

      <p className="text-xs text-center" style={{ color: "var(--muted)" }}>
        Link unfurls with rich preview on Twitter, Slack, Discord via Open Graph tags
      </p>
    </div>
  );
}
