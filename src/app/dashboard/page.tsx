"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useWallet } from "../../components/WalletProvider";
import { sharpyClient } from "../../lib/client";
import { formatAmount, statusColor, formatDeadline, fundingPercent, truncateAddress } from "../../lib/utils";
import type { Invoice } from "../../lib/utils";

export default function Dashboard() {
  const { publicKey, connect } = useWallet();
  const [invoices, setInvoices] = useState<(Invoice & { id: number })[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!publicKey) return;
    setLoading(true);
    // Fetch last 20 invoices by ID scan (simple approach for MVP)
    const fetchInvoices = async () => {
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
    fetchInvoices();
  }, [publicKey]);

  if (!publicKey) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500 mb-4">Connect your wallet to view your invoices.</p>
        <button onClick={connect} className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700">
          Connect Wallet
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <Link href="/invoice/new" className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700">
          + New Invoice
        </Link>
      </div>

      {loading ? (
        <p className="text-gray-500">Loading invoices...</p>
      ) : invoices.length === 0 ? (
        <p className="text-gray-500">No invoices found. <Link href="/invoice/new" className="text-indigo-600">Create one.</Link></p>
      ) : (
        <div className="space-y-3">
          {invoices.map((inv) => {
            const total = inv.amounts.reduce((a, b) => a + b, 0n);
            const pct = fundingPercent(inv.funded, inv.amounts);
            return (
              <Link key={inv.id} href={`/invoice/${inv.id}`}
                className="block bg-white border border-gray-200 rounded-xl p-4 hover:border-indigo-300 transition">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-sm text-gray-500">#{inv.id}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor(inv.status)}`}>{inv.status}</span>
                </div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-700">{formatAmount(total)} USDC</span>
                  <span className="text-gray-400">Due {formatDeadline(inv.deadline)}</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full">
                  <div className="h-1.5 bg-indigo-500 rounded-full" style={{ width: `${pct}%` }} />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
