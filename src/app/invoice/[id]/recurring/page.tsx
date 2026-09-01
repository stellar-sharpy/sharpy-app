"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { sharpyClient, NETWORK } from "../../../../lib/client";
import { formatAmount, formatDeadline } from "../../../../lib/utils";
import { getTokenByAddress } from "../../../../lib/tokens";
import type { Invoice } from "../../../../lib/utils";

function formatInterval(secs: number): string {
  if (secs % 2592000 === 0) return `${secs / 2592000} month${secs !== 2592000 ? "s" : ""}`;
  if (secs % 86400 === 0) return `${secs / 86400} day${secs !== 86400 ? "s" : ""}`;
  if (secs % 3600 === 0) return `${secs / 3600} hour${secs !== 3600 ? "s" : ""}`;
  return `${secs}s`;
}

export default function RecurringPage() {
  const { id } = useParams<{ id: string }>();
  const [chain, setChain] = useState<{ id: number; invoice: Invoice }[]>([]);
  const [loading, setLoading] = useState(true);
  const [params, setParams] = useState<{ interval: number; maxRecurrences: number; currentRecurrence: number } | null>(null);

  useEffect(() => {
    const build = async () => {
      const results: { id: number; invoice: Invoice }[] = [];
      let current: number | null = Number(id);
      // Walk forward through the recurring chain
      while (current) {
        try {
          const inv = await sharpyClient.getInvoice(current);
          results.push({ id: current, invoice: inv });
          current = await sharpyClient.getNextRecurring(current);
        } catch { break; }
        if (results.length > 50) break; // Safety limit
      }
      setChain(results);
      setLoading(false);
    };
    sharpyClient.getRecurringParams(Number(id)).then(setParams).catch(() => {});
    build();
  }, [id]);

  const now = Math.floor(Date.now() / 1000);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Link
          href={`/invoice/${id}`}
          className="text-xs text-[#6C63FF] hover:underline mb-2 block"
        >
          ← Back to Invoice #{id}
        </Link>
        <h1 className="font-display text-2xl font-bold" style={{ color: "var(--text)" }}>
          Recurring Chain
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
          {chain.length > 0
            ? `${chain.length} invoice${chain.length !== 1 ? "s" : ""} in this recurring series`
            : "Loading…"}
        </p>
        {params && (
          <div className="mt-4 grid grid-cols-3 gap-3 card p-4">
            <div>
              <p className="text-xs" style={{ color: "var(--muted)" }}>Interval</p>
              <p className="text-sm font-semibold mt-0.5" style={{ color: "var(--text)" }}>{formatInterval(params.interval)}</p>
            </div>
            <div>
              <p className="text-xs" style={{ color: "var(--muted)" }}>Max recurrences</p>
              <p className="text-sm font-semibold mt-0.5" style={{ color: "var(--text)" }}>{params.maxRecurrences === 0 ? "∞ unlimited" : String(params.maxRecurrences)}</p>
            </div>
            <div>
              <p className="text-xs" style={{ color: "var(--muted)" }}>Current</p>
              <p className="text-sm font-semibold mt-0.5" style={{ color: "#6C63FF" }}>#{params.currentRecurrence}</p>
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card h-24 animate-pulse" />
          ))}
        </div>
      ) : chain.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            No recurring chain found for this invoice.
          </p>
        </div>
      ) : (
        <div className="relative">
          {/* Timeline vertical line */}
          <div
            className="absolute left-5 top-0 bottom-0 w-0.5"
            style={{ background: "var(--border)" }}
          />

          {/* Timeline nodes */}
          <div className="space-y-5">
            {chain.map(({ id: cid, invoice }, i) => {
              const total = invoice.amounts.reduce((a, b) => a + b, 0n);
              const tokenSymbol = getTokenByAddress(invoice.tokens[0] ?? "")?.symbol ?? "tokens";
              const expired = invoice.deadline < now;
              const isCurrent = cid === Number(id);
              const statusColor =
                invoice.status === "Released" ? "#00D4AA" :
                invoice.status === "Pending" && !expired ? "#6C63FF" :
                invoice.status === "Pending" && expired ? "#FB923C" :
                invoice.status === "Refunded" ? "#4B5563" :
                "#EF4444";

              return (
                <div key={cid} className="relative flex items-start gap-4">
                  {/* Timeline dot */}
                  <div className="relative z-10 shrink-0">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm"
                      style={{
                        background: isCurrent ? statusColor : "var(--surface-2)",
                        border: `2px solid ${statusColor}`,
                        color: isCurrent ? "#fff" : statusColor,
                      }}
                    >
                      {i + 1}
                    </div>
                  </div>

                  {/* Card */}
                  <Link
                    href={`/invoice/${cid}`}
                    className="card flex-1 p-5 hover:border-[var(--border-hover)] transition-colors"
                    style={{
                      borderColor: isCurrent ? statusColor : "var(--border)",
                    }}
                  >
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div>
                        <p className="mono text-xs mb-1" style={{ color: "var(--muted)" }}>
                          Invoice #{cid}
                          {isCurrent && (
                            <span className="ml-2 text-[#00D4AA]">• Current</span>
                          )}
                        </p>
                        <p className="font-display text-xl font-bold" style={{ color: "var(--text)" }}>
                          {formatAmount(total)} {tokenSymbol}
                        </p>
                      </div>
                      <span className={`badge badge-${invoice.status.toLowerCase()}`}>
                        {invoice.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <p style={{ color: "var(--muted)" }}>Deadline</p>
                        <p className="font-medium mt-0.5" style={{ color: "var(--text-secondary)" }}>
                          {formatDeadline(invoice.deadline)}
                        </p>
                      </div>
                      <div>
                        <p style={{ color: "var(--muted)" }}>Funded</p>
                        <p className="font-medium mt-0.5" style={{ color: "#00D4AA" }}>
                          {formatAmount(invoice.funded)} / {formatAmount(total)}
                        </p>
                      </div>
                      <div>
                        <p style={{ color: "var(--muted)" }}>Recipients</p>
                        <p className="font-medium mt-0.5" style={{ color: "var(--text-secondary)" }}>
                          {invoice.recipients.length}
                        </p>
                      </div>
                      <div>
                        <p style={{ color: "var(--muted)" }}>Status</p>
                        <p
                          className="font-medium mt-0.5"
                          style={{
                            color: statusColor,
                          }}
                        >
                          {expired && invoice.status === "Pending" ? "Expired" : invoice.status}
                        </p>
                      </div>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
