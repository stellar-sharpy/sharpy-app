"use client";
import { useState, useMemo } from "react";
import { formatAmount } from "../lib/utils";
import { getTokenByAddress } from "../lib/tokens";
import type { Invoice } from "../lib/utils";

export interface FilterState {
  query: string;
  status: string;
  minAmount: string;
  maxAmount: string;
  sortBy: "deadline" | "amount" | "funded";
  sortDir: "asc" | "desc";
}

const DEFAULT_FILTERS: FilterState = {
  query: "",
  status: "All",
  minAmount: "",
  maxAmount: "",
  sortBy: "deadline",
  sortDir: "desc",
};

function applyFilters(invoices: (Invoice & { id: number })[], f: FilterState): (Invoice & { id: number })[] {
  let res = [...invoices];
  const q = f.query.trim().toLowerCase();
  if (q) {
    res = res.filter((inv) => {
      const idMatch = String(inv.id).includes(q);
      const creatorMatch = inv.creator.toLowerCase().includes(q);
      const recipientMatch = inv.recipients.some((r) => r.toLowerCase().includes(q));
      const amountMatch = inv.amounts.some((a) => formatAmount(a).includes(q));
      const statusMatch = inv.status.toLowerCase().includes(q);
      const tokenMatch = getTokenByAddress(inv.tokens[0] ?? "")?.symbol.toLowerCase().includes(q);
      return idMatch || creatorMatch || recipientMatch || amountMatch || statusMatch || !!tokenMatch;
    });
  }
  if (f.status !== "All") res = res.filter((inv) => inv.status === f.status);
  const min = f.minAmount ? parseFloat(f.minAmount) : null;
  const max = f.maxAmount ? parseFloat(f.maxAmount) : null;
  if (min !== null && !isNaN(min)) {
    res = res.filter((inv) => {
      const total = Number(inv.amounts.reduce((a, b) => a + b, 0n)) / 1e7;
      return total >= min;
    });
  }
  if (max !== null && !isNaN(max)) {
    res = res.filter((inv) => {
      const total = Number(inv.amounts.reduce((a, b) => a + b, 0n)) / 1e7;
      return total <= max;
    });
  }
  res.sort((a, b) => {
    let cmp = 0;
    if (f.sortBy === "deadline") cmp = a.deadline - b.deadline;
    else if (f.sortBy === "amount") {
      const ta = Number(a.amounts.reduce((x, y) => x + y, 0n));
      const tb = Number(b.amounts.reduce((x, y) => x + y, 0n));
      cmp = ta - tb;
    } else if (f.sortBy === "funded") cmp = Number(a.funded - b.funded);
    return f.sortDir === "asc" ? cmp : -cmp;
  });
  return res;
}

export function useInvoiceFilters(invoices: (Invoice & { id: number })[], filters: FilterState) {
  return useMemo(() => applyFilters(invoices, filters), [invoices, filters]);
}

const STATUSES = ["All", "Pending", "Released", "Refunded", "Cancelled"] as const;

export default function InvoiceSearchFilter({
  filters,
  onChange,
  resultCount,
  totalCount,
}: {
  filters: FilterState;
  onChange: (f: FilterState) => void;
  resultCount: number;
  totalCount: number;
}) {
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const activeCount = [
    filters.status !== "All",
    filters.minAmount !== "",
    filters.maxAmount !== "",
    filters.sortBy !== "deadline" || filters.sortDir !== "desc",
  ].filter(Boolean).length;

  const update = (patch: Partial<FilterState>) => onChange({ ...filters, ...patch });

  return (
    <div className="card p-4 space-y-3">
      {/* Primary search row */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2" width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="var(--muted)" strokeWidth="1.5"><circle cx="6" cy="6" r="4" /><path d="M9 9l3 3" strokeLinecap="round"/></svg>
          <input
            value={filters.query}
            onChange={(e) => update({ query: e.target.value })}
            placeholder="Search by invoice #, address, amount, status, token..."
            className="input pl-9 text-sm"
          />
        </div>
        <select value={filters.status} onChange={(e) => update({ status: e.target.value })} className="input text-sm w-auto min-w-[130px]">
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <button
          onClick={() => setAdvancedOpen((o) => !o)}
          className="px-3 py-2 rounded-xl text-xs font-medium border flex items-center gap-1.5 shrink-0"
          style={{ borderColor: activeCount ? "#6C63FF" : "var(--border)", color: activeCount ? "#6C63FF" : "var(--muted)", background: activeCount ? "rgba(108,99,255,0.08)" : "var(--surface)" }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M1 3h10M3 6h6M4 9h4" strokeLinecap="round"/></svg>
          Filters {activeCount ? `(${activeCount})` : ""}
        </button>
      </div>

      {/* Advanced panel */}
      {advancedOpen && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t" style={{ borderColor: "var(--border)" }}>
          <div>
            <label className="text-xs mb-1 block" style={{ color: "var(--muted)" }}>Min amount</label>
            <input type="number" min="0" step="0.01" placeholder="0.00" value={filters.minAmount} onChange={(e) => update({ minAmount: e.target.value })} className="input text-sm" />
          </div>
          <div>
            <label className="text-xs mb-1 block" style={{ color: "var(--muted)" }}>Max amount</label>
            <input type="number" min="0" step="0.01" placeholder="∞" value={filters.maxAmount} onChange={(e) => update({ maxAmount: e.target.value })} className="input text-sm" />
          </div>
          <div>
            <label className="text-xs mb-1 block" style={{ color: "var(--muted)" }}>Sort by</label>
            <select value={filters.sortBy} onChange={(e) => update({ sortBy: e.target.value as any })} className="input text-sm">
              <option value="deadline">Deadline</option>
              <option value="amount">Total amount</option>
              <option value="funded">Funded</option>
            </select>
          </div>
          <div>
            <label className="text-xs mb-1 block" style={{ color: "var(--muted)" }}>Direction</label>
            <select value={filters.sortDir} onChange={(e) => update({ sortDir: e.target.value as any })} className="input text-sm">
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </div>
          <div className="col-span-2 sm:col-span-4 flex justify-between items-center pt-1">
            <p className="text-xs" style={{ color: "var(--muted)" }}>{resultCount} of {totalCount} invoices</p>
            <button onClick={() => onChange({ ...DEFAULT_FILTERS, query: filters.query ? "" : filters.query })} className="text-xs text-[#6C63FF] hover:underline">Reset filters</button>
          </div>
        </div>
      )}
      {!advancedOpen && (
        <p className="text-xs" style={{ color: "var(--muted)" }}>{resultCount} results {filters.query || filters.status !== "All" ? `for current filters` : ""}</p>
      )}
    </div>
  );
}

export { DEFAULT_FILTERS };
