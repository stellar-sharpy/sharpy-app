"use client";
import { formatAmount, formatDeadline } from "../lib/utils";
import { getTokenByAddress } from "../lib/tokens";
import type { Invoice } from "../lib/utils";

interface Props {
  invoices: (Invoice & { id: number })[];
  tabName: string;
}

function invoicesToCsv(invoices: (Invoice & { id: number })[]): string {
  const headers = ["Invoice ID", "Status", "Funded", "Total", "Token", "Recipients", "Amounts", "Deadline", "Escrow", "Creator"];
  const rows = invoices.map((inv) => {
    const total = inv.amounts.reduce((a, b) => a + b, 0n);
    const token = getTokenByAddress(inv.tokens[0] ?? "")?.symbol ?? inv.tokens[0] ?? "";
    const recipients = inv.recipients.join("; ");
    const amounts = inv.amounts.map((a) => formatAmount(a)).join("; ");
    return [
      String(inv.id),
      inv.status,
      formatAmount(inv.funded),
      formatAmount(total),
      token,
      `"${recipients}"`,
      `"${amounts}"`,
      new Date(inv.deadline * 1000).toISOString().slice(0, 10),
      inv.escrowEnabled ? `Yes (${(inv.escrowReleaseDelay ?? 0) / 3600}h)` : "No",
      inv.creator,
    ].join(",");
  });
  return [headers.join(","), ...rows].join("\n");
}

function invoicesToJson(invoices: (Invoice & { id: number })[]): string {
  return JSON.stringify(
    invoices.map((inv) => ({
      id: inv.id,
      status: inv.status,
      funded: formatAmount(inv.funded),
      total: formatAmount(inv.amounts.reduce((a, b) => a + b, 0n)),
      token: getTokenByAddress(inv.tokens[0] ?? "")?.symbol ?? inv.tokens[0],
      recipients: inv.recipients,
      amounts: inv.amounts.map((a) => formatAmount(a)),
      deadline: formatDeadline(inv.deadline),
      escrowEnabled: inv.escrowEnabled,
    })),
    null,
    2
  );
}

export default function TransactionHistoryExport({ invoices, tabName }: Props) {
  if (invoices.length === 0) return null;

  const download = (content: string, ext: string, mime: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sharpy-${tabName.toLowerCase()}-${new Date().toISOString().slice(0, 10)}.${ext}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs" style={{ color: "var(--muted)" }}>Export:</span>
      <button
        onClick={() => download(invoicesToCsv(invoices), "csv", "text/csv")}
        className="text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors hover:bg-[var(--surface-2)]"
        style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
        title="Export as CSV for accounting / QuickBooks"
      >
        CSV
      </button>
      <button
        onClick={() => download(invoicesToJson(invoices), "json", "application/json")}
        className="text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors hover:bg-[var(--surface-2)]"
        style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
        title="Export as JSON"
      >
        JSON
      </button>
      <span className="text-xs" style={{ color: "var(--muted-2)" }}>{invoices.length} records</span>
    </div>
  );
}
