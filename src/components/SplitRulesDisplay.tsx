"use client";
import { formatAmount } from "../lib/utils";
import { getTokenByAddress } from "../lib/tokens";
import type { SplitRule } from "../lib/utils";

interface Props {
  splitRules: any[];
  recipients: string[];
  tokenAddress?: string;
}

function ruleLabel(rule: SplitRule): string {
  if (rule.type === "Fixed") return `Fixed: ${rule.amount} stroops`;
  if (rule.type === "Percentage") return `${(rule.bps / 100).toFixed(1)}% of funded`;
  if (rule.type === "Tiered") return `${(rule.bps / 100).toFixed(1)}% if > ${rule.threshold} stroops`;
  return "Unknown";
}

function ruleBadgeClass(rule: SplitRule): string {
  if (rule.type === "Fixed") return "badge-fixed";
  if (rule.type === "Percentage") return "badge-percentage";
  if (rule.type === "Tiered") return "badge-tiered";
  return "";
}

export default function SplitRulesDisplay({ splitRules, recipients, tokenAddress }: Props) {
  if (!splitRules || splitRules.length === 0) return null;

  const tokenSymbol = getTokenByAddress(tokenAddress ?? "")?.symbol ?? "tokens";

  return (
    <div className="space-y-2">
      <p className="text-xs text-[#4B5563] font-medium">Split Rules</p>
      <div
        className="rounded-xl overflow-hidden"
        style={{ border: "1px solid var(--border)" }}
      >
        {splitRules.map((rule: any, i: number) => {
          const addr = recipients[i] ?? "Unknown";
          const parsed: SplitRule = 
            rule.type === "Fixed" ? { type: "Fixed", amount: rule.amount } :
            rule.type === "Percentage" ? { type: "Percentage", bps: rule.bps } :
            rule.type === "Tiered" ? { type: "Tiered", threshold: rule.threshold, bps: rule.bps } :
            { type: "Fixed", amount: 0n };

          return (
            <div
              key={i}
              className="flex items-center justify-between px-4 py-3"
              style={{
                background: i % 2 === 0 ? "var(--surface)" : "var(--surface-2)",
                borderTop: i > 0 ? "1px solid var(--border)" : "none",
              }}
            >
              <div className="flex items-center gap-3">
                <span
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                  style={{ background: "rgba(108,99,255,0.15)", color: "#6C63FF" }}
                >
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <p className="mono text-xs truncate" style={{ color: "var(--text)" }}>
                    {addr.slice(0, 8)}…{addr.slice(-6)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span
                  className={`text-xs px-2.5 py-1 rounded-full font-medium ${ruleBadgeClass(parsed)}`}
                  style={{
                    background: parsed.type === "Fixed" ? "rgba(16,185,129,0.1)" :
                                parsed.type === "Percentage" ? "rgba(108,99,255,0.1)" :
                                "rgba(251,146,60,0.1)",
                    color: parsed.type === "Fixed" ? "#10B981" :
                           parsed.type === "Percentage" ? "#6C63FF" :
                           "#FB923C",
                  }}
                >
                  {parsed.type}
                </span>
                <span className="text-xs mono" style={{ color: "var(--muted)" }}>
                  {parsed.type === "Fixed" && `${formatAmount(parsed.amount)} ${tokenSymbol}`}
                  {parsed.type === "Percentage" && `${(parsed.bps / 100).toFixed(1)}%`}
                  {parsed.type === "Tiered" && `${(parsed.bps / 100).toFixed(1)}% > ${formatAmount(parsed.threshold)}`}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
