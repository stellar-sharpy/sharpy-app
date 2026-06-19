"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useWallet } from "../../components/WalletProvider";
import { sharpyClient } from "../../lib/client";
import { formatAmount, statusColor, formatDeadline, fundingPercent, truncateAddress } from "../../lib/utils";
import type { Invoice } from "../../lib/utils";

const STATUSES = ["Pending", "Released", "Refunded", "Cancelled"] as const;

export default function Dashboard() {
  const { publicKey, connect } = useWallet();
  const [invoices, setInvoices] = useState<(Invoice & { id: number })[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [roleFilter, setRoleFilter] = useState<"All" | "Sent" | "Received">("All");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    if (!publicKey) return;
    setLoading(true);
    const fetch = async () => {
      const results: (Invoice & { id: number })[] = [];
      for (let id = 1; id <= 20; id++) {
        try {
          const inv = await sharpyClient.getInvoice(id);
          if (inv.creator === publicKey || inv.recipients.includes(publicKey)) {
            results.push({ ...inv, id });
          }
        } catch {}
      }
      setInvoices(results);
      setLoading(false);
    };
    fetch();
  }, [publicKey]);

  const fromTs = dateFrom ? new Date(dateFrom).getTime() / 1000 : null;
  const toTs = dateTo ? new Date(dateTo).getTime() / 1000 + 86399 : null;

  const filtered = invoices.filter((inv) => {
    if (search && !String(inv.id).includes(search)) return false;
    if (statusFilter !== "All" && inv.status !== statusFilter) return false;
    if (roleFilter === "Sent" && inv.creator !== publicKey) return false;
    if (roleFilter === "Received" && inv.creator === publicKey) return false;
    if (fromTs && inv.deadline < fromTs) return false;
    if (toTs && inv.deadline > toTs) return false;
    return true;
  });

  if (!publicKey) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <p className="text-[#6B7280]">Connect your wallet to view your invoices.</p>
        <button onClick={connect} className="btn-primary">Connect Wallet</button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#F1F2F6]">Dashboard</h1>
          <p className="text-sm text-[#6B7280] mt-1 mono">{truncateAddress(publicKey)}</p>
        </div>
        <Link href="/invoice/new" className="btn-primary text-sm">+ New Invoice</Link>
      </div>

      {/* Search & filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <input
          type="text"
          placeholder="Search by invoice #"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input flex-1 min-w-[140px] text-sm"
        />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input text-sm">
          <option value="All">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value as typeof roleFilter)} className="input text-sm">
          <option value="All">Sent & Received</option>
          <option value="Sent">Sent</option>
          <option value="Received">Received</option>
        </select>
        <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="input text-sm" title="From date" />
        <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="input text-sm" title="To date" />
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card p-5 animate-pulse h-20" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-16 text-center">
          <p className="text-[#6B7280] mb-3">{invoices.length === 0 ? "No invoices found." : "No invoices match your filters."}</p>
          {invoices.length === 0 && <Link href="/invoice/new" className="text-[#6C63FF] text-sm hover:underline">Create your first invoice</Link>}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((inv) => {
            const total = inv.amounts.reduce((a, b) => a + b, 0n);
            const pct = fundingPercent(inv.funded, inv.amounts);
            const badgeClass = `badge badge-${inv.status.toLowerCase()}`;
            return (
              <Link key={inv.id} href={`/invoice/${inv.id}`}
                className="card p-5 flex flex-col gap-3 hover:border-[#2E3040] transition-colors block">
                <div className="flex items-center justify-between">
                  <span className="mono text-xs">Invoice #{inv.id}</span>
                  <span className={badgeClass}>{inv.status}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-[#F1F2F6]">{formatAmount(total)} USDC</span>
                  <span className="text-[#4B5563]">Due {formatDeadline(inv.deadline)}</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${pct}%` }} />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
