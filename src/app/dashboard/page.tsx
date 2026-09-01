"use client";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useWallet } from "../../components/WalletProvider";
import { sharpyClient, NETWORK, CONTRACT_ID } from "../../lib/client";
import { getTokenByAddress } from "../../lib/tokens";
import { formatAmount, formatDeadline, fundingPercent, truncateAddress } from "../../lib/utils";
import type { Invoice } from "../../lib/utils";
import ContractInfo from "../../components/ContractInfo";
import TransactionHistoryExport from "../../components/TransactionHistoryExport";

const STATUSES = ["Pending", "Released", "Refunded", "Cancelled"] as const;
type DashboardTab = "Created" | "Paid";

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
            {formatAmount(total)}{" "}
            <span style={{ color: "var(--muted-2)" }} className="font-normal text-base">{tokenSymbol}</span>
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

      {/* Meta */}
      <div className="flex items-center justify-between text-xs" style={{ color: "var(--muted)" }}>
        <span>{inv.recipients.length} recipient{inv.recipients.length !== 1 ? "s" : ""}</span>
        <span>Due {formatDeadline(inv.deadline)}</span>
      </div>

      {inv.escrowEnabled && (
        <div className="flex items-center gap-1.5 text-xs text-amber-400 -mt-1">
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
            <rect x="1.5" y="5" width="8" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.2"/>
            <path d="M3.5 5V3.5a2 2 0 014 0V5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
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
          <Link href={`/pay/${inv.id}`} className="flex-1 text-center text-xs font-medium py-2 rounded-lg btn-primary">
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

function NewInvoiceDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="btn-primary text-sm flex items-center gap-2"
        aria-haspopup="true"
        aria-expanded={open}
      >
        + New Invoice
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={`transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        >
          <path d="M2 4l4 4 4-4" />
        </svg>
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-1.5 z-50 w-52 rounded-xl shadow-xl overflow-hidden"
          style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
          role="menu"
        >
          <Link
            href="/invoice/new"
            onClick={() => setOpen(false)}
            role="menuitem"
            className="flex items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-[var(--surface-2)]"
            style={{ color: "var(--text)" }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M8 2v12M2 8h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            <div>
              <p className="font-medium">Single Invoice</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                One invoice with recipients
              </p>
            </div>
          </Link>

          <div style={{ borderTop: "1px solid var(--border)" }} />

          <Link
            href="/invoice/batch"
            onClick={() => setOpen(false)}
            role="menuitem"
            className="flex items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-[var(--surface-2)]"
            style={{ color: "var(--text)" }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <rect x="1" y="1" width="6" height="6" rx="1.2" stroke="currentColor" strokeWidth="1.5" />
              <rect x="9" y="1" width="6" height="6" rx="1.2" stroke="currentColor" strokeWidth="1.5" />
              <rect x="1" y="9" width="6" height="6" rx="1.2" stroke="currentColor" strokeWidth="1.5" />
              <rect x="9" y="9" width="6" height="6" rx="1.2" stroke="currentColor" strokeWidth="1.5" />
            </svg>
            <div>
              <p className="font-medium">
                Batch Invoices{" "}
                <span
                  className="text-xs px-1.5 py-0.5 rounded-full ml-1"
                  style={{ background: "rgba(108,99,255,0.15)", color: "var(--primary)" }}
                >
                  up to 10
                </span>
              </p>
              <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                Multiple invoices, one tx
              </p>
            </div>
          </Link>
        </div>
      )}
    </div>
  );
}

async function fetchInvoiceList(ids: number[]): Promise<(Invoice & { id: number })[]> {
  const results = await Promise.all(
    ids.map(async (id) => {
      try {
        const inv = await sharpyClient.getInvoice(id);
        return { ...inv, id };
      } catch {
        return null;
      }
    })
  );
  return results
    .filter((inv): inv is Invoice & { id: number } => inv !== null)
    .sort((a, b) => b.deadline - a.deadline);
}

export default function Dashboard() {
  const { publicKey, connect } = useWallet();
  const [tab, setTab] = useState<DashboardTab>("Created");
  const [createdInvoices, setCreatedInvoices] = useState<(Invoice & { id: number })[]>([]);
  const [paidInvoices, setPaidInvoices] = useState<(Invoice & { id: number })[]>([]);
  const [loadingCreated, setLoadingCreated] = useState(false);
  const [loadingPaid, setLoadingPaid] = useState(false);
  const [paidLoaded, setPaidLoaded] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");

  // Load "Created" invoices on wallet connect
  useEffect(() => {
    if (!publicKey) return;
    setLoadingCreated(true);
    sharpyClient.getInvoicesByCreator(publicKey)
      .then(fetchInvoiceList)
      .then(setCreatedInvoices)
      .catch(() => setCreatedInvoices([]))
      .finally(() => setLoadingCreated(false));
  }, [publicKey]);

  // Lazy-load "Paid" invoices when tab is first opened
  useEffect(() => {
    if (!publicKey || tab !== "Paid" || paidLoaded || loadingPaid) return;
    setLoadingPaid(true);
    sharpyClient.getInvoicesByPayer(publicKey)
      .then(fetchInvoiceList)
      .then((invs) => { setPaidInvoices(invs); setPaidLoaded(true); })
      .catch(() => { setPaidInvoices([]); setPaidLoaded(true); })
      .finally(() => setLoadingPaid(false));
  }, [publicKey, tab, paidLoaded, loadingPaid]);

  const activeInvoices = tab === "Created" ? createdInvoices : paidInvoices;
  const isLoading = tab === "Created" ? loadingCreated : loadingPaid;

  const filtered = activeInvoices.filter((inv) => {
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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold" style={{ color: "var(--text)" }}>Dashboard</h1>
          <p className="text-sm mt-1 mono" style={{ color: "var(--muted)" }}>{truncateAddress(publicKey)}</p>
        </div>
        <Link href="/invoice/new" className="btn-primary text-sm">+ New Invoice</Link>
      </div>

      <div className="flex justify-end mb-2">
        <Link href="/pool-pay" className="text-xs px-3 py-1.5 rounded-lg border hover:bg-[var(--surface-2)]" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>Pool Pay → pay many in one tx</Link>
      </div>
      <div className="mb-6"><ContractInfo /></div>

      {/* Tabs: Created / Paid */}
      <div className="flex gap-1 mb-6 p-1 rounded-xl w-fit" style={{ background: "var(--surface-2)" }}>
        {(["Created", "Paid"] as DashboardTab[]).map((t) => {
          const count = t === "Created" ? createdInvoices.length : paidInvoices.length;
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="px-5 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                background: tab === t ? "var(--surface)" : "transparent",
                color: tab === t ? "var(--text)" : "var(--muted)",
                boxShadow: tab === t ? "0 1px 4px rgba(0,0,0,0.3)" : "none",
              }}
            >
              {t}
              {count > 0 && (
                <span
                  className="ml-2 text-xs px-1.5 py-0.5 rounded-full"
                  style={{ background: "var(--primary-dim, rgba(108,99,255,0.15))", color: "var(--primary)" }}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Filters + Export */}
      <div className="flex flex-wrap gap-3 mb-3">
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
      {filtered.length > 0 && (
        <div className="flex justify-end mb-4">
          <TransactionHistoryExport invoices={filtered} tabName={tab} />
        </div>
      )}

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card p-5 h-52 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-16 text-center">
          {activeInvoices.length === 0 ? (
            /* Empty state with illustration */
            <div className="max-w-xs mx-auto space-y-6">
              {tab === "Created" ? (
                <svg
                  width="120"
                  height="120"
                  viewBox="0 0 120 120"
                  fill="none"
                  className="mx-auto opacity-40"
                >
                  <circle cx="60" cy="60" r="50" stroke="var(--border)" strokeWidth="2" />
                  <path
                    d="M40 60h40M60 40v40"
                    stroke="var(--muted)"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                  <path
                    d="M35 75l10 10 20-30"
                    stroke="var(--primary)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity="0.5"
                  />
                </svg>
              ) : (
                <svg
                  width="120"
                  height="120"
                  viewBox="0 0 120 120"
                  fill="none"
                  className="mx-auto opacity-40"
                >
                  <rect
                    x="30"
                    y="40"
                    width="60"
                    height="45"
                    rx="4"
                    stroke="var(--border)"
                    strokeWidth="2"
                  />
                  <path d="M30 55h60" stroke="var(--border)" strokeWidth="2" />
                  <circle
                    cx="60"
                    cy="68"
                    r="8"
                    stroke="var(--muted)"
                    strokeWidth="2"
                    fill="none"
                  />
                  <path
                    d="M52 76a10 10 0 0016 0"
                    stroke="var(--muted)"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              )}
              <div>
                <p className="mb-2 font-medium" style={{ color: "var(--text)" }}>
                  {tab === "Created" ? "No invoices created yet" : "No payments made yet"}
                </p>
                <p className="text-sm" style={{ color: "var(--muted)" }}>
                  {tab === "Created"
                    ? "Create your first invoice to start accepting payments"
                    : "Pay an invoice to see it appear here"}
                </p>
              </div>
              {tab === "Created" && (
                <Link href="/invoice/new" className="btn-primary inline-block text-sm px-6 py-2.5">
                  Create Invoice
                </Link>
              )}
            </div>
          ) : (
            /* No matches for filters */
            <div className="space-y-3">
              <p style={{ color: "var(--muted)" }}>No invoices match your filters.</p>
              <button
                onClick={() => { setSearch(""); setStatusFilter("All"); }}
                className="text-sm underline"
                style={{ color: "var(--primary)" }}
              >
                Clear filters
              </button>
            </div>
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
