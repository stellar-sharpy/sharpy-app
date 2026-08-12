"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useWallet } from "../../components/WalletProvider";
import { sharpyClient, NETWORK, CONTRACT_ID } from "../../lib/client";
import { getTokenByAddress } from "../../lib/tokens";
import { formatAmount, formatDeadline, fundingPercent, truncateAddress } from "../../lib/utils";
import type { Invoice } from "../../lib/utils";

const STATUSES = ["Pending", "Released", "Refunded", "Cancelled"] as const;

// External link icon
function ExternalIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
      <path d="M6.5 1H10v3.5M4.5 6.5l5-5M1.5 3.5A1 1 0 012.5 2.5H3M1.5 3.5V9a.5.5 0 00.5.5H7.5a.5.5 0 00.5-.5V6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function InvoiceCard({ inv }: { inv: Invoice & { id: number } }) {
  const total = inv.amounts.reduce((a, b) => a + b, 0n);
  const pct = fundingPercent(inv.funded, inv.amounts);
  const token = getTokenByAddress(inv.tokens[0] ?? "");
  const tokenSymbol = token?.symbol ?? "tokens";
  const remaining = total - inv.funded;
  const isPending = inv.status === "Pending";
  const badgeClass = `badge badge-${inv.status.toLowerCase()}`;

  return (
    <div className="card p-5 flex flex-col gap-4 hover:border-[var(--border-hover)] transition-colors">

      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="mono text-xs mb-0.5">Invoice #{inv.id}</p>
          <p className="font-display font-bold text-xl leading-tight" style={{ color: "var(--text)" }}>
            {formatAmount(total)} <span style={{ color: "var(--muted-2)" }} className="font-normal text-base">{tokenSymbol}</span>
          </p>
        </div>
        <span className={badgeClass}>{inv.status}</span>
      </div>

      {/* Progress */}
      <div>
        <div className="flex justify-between text-xs mb-1.5" style={{ color: "var(--muted)" }}>
          <span>{formatAmount(inv.funded)} funded</span>
          <span>{pct}%</span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {/* Meta row */}
      <div className="flex items-center justify-between text-xs" style={{ color: "var(--muted)" }}>
        <span>{inv.recipients.length} recipient{inv.recipients.length !== 1 ? "s" : ""}</span>
        <span>Due {formatDeadline(inv.deadline)}</span>
      </div>

      {inv.escrowEnabled && (
        <div className="flex items-center gap-1.5 text-xs text-amber-400 -mt-1">
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><rect x="1.5" y="5" width="8" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.2"/><path d="M3.5 5V3.5a2 2 0 014 0V5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
          Escrow · {(inv.escrowReleaseDelay ?? 0) / 3600}h delay
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1 border-t" style={{ borderColor: "var(--border)" }}>
        <Link
          href={`/invoice/${inv.id}`}
          className="flex-1 text-center text-xs font-medium py-2 rounded-lg transition-colors"
          style={{ color: "var(--text-secondary)", background: "var(--surface-2)" }}
        >
          View
        </Link>

        {isPending && remaining > 0n && (
          <Link
            href={`/pay/${inv.id}`}
            className="flex-1 text-center text-xs font-medium py-2 rounded-lg btn-primary"
          >
            Pay
          </Link>
        )}

        <a
          href={`https://stellar.expert/explorer/${NETWORK}/contract/${CONTRACT_ID}`}
          target="_blank"
          rel="noreferrer"
          title="View on Stellar Explorer"
          className="flex items-center justify-center p-2 rounded-lg transition-colors border"
          style={{ color: "var(--muted)", background: "var(--surface-2)", borderColor: "var(--border)" }}
        >
          <ExternalIcon />
        </a>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { publicKey, connect } = useWallet();
  const [invoices, setInvoices] = useState<(Invoice & { id: number })[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");

  useEffect(() => {
    if (!publicKey) return;
    setLoading(true);
    const fetch = async () => {
      try {
        const createdIds = await sharpyClient.getInvoicesByCreator(publicKey);
        const allInvoices = await Promise.all(
          createdIds.map(async (id) => {
            try {
              const inv = await sharpyClient.getInvoice(id);
              return { ...inv, id };
            } catch {
              return null;
            }
          })
        );
        const results = allInvoices
          .filter((inv): inv is Invoice & { id: number } => inv !== null)
          .sort((a, b) => b.deadline - a.deadline);
        setInvoices(results);
      } catch (error) {
        console.error("Failed to load invoices:", error);
        setInvoices([]);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [publicKey]);

  const filtered = invoices.filter((inv) => {
    if (search && !String(inv.id).includes(search)) return false;
    if (statusFilter !== "All" && inv.status !== statusFilter) return false;
    return true;
  });

  if (!publicKey) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <p style={{ color: "var(--muted)" }}>Connect your wallet to view your invoices.</p>
        <button onClick={connect} className="btn-primary">Connect Wallet</button>
      </div>
    );
  }

  return (
    <div className="animate-fade-up">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold" style={{ color: "var(--text)" }}>Dashboard</h1>
          <p className="text-sm mt-1 mono" style={{ color: "var(--muted)" }}>{truncateAddress(publicKey)}</p>
        </div>
        <Link href="/invoice/new" className="btn-primary text-sm">+ New Invoice</Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <input
          type="text"
          placeholder="Search by invoice #"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input flex-1 min-w-[140px] text-sm"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="input text-sm w-auto"
        >
          <option value="All">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card p-5 h-52 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-16 text-center">
          <p className="mb-3" style={{ color: "var(--muted)" }}>
            {invoices.length === 0 ? "No invoices yet." : "No invoices match your filters."}
          </p>
          {invoices.length === 0 && (
            <Link href="/invoice/new" className="text-sm" style={{ color: "var(--primary)" }}>
              Create your first invoice
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((inv) => (
            <InvoiceCard key={inv.id} inv={inv} />
          ))}
        </div>
      )}
    </div>
  );
}
