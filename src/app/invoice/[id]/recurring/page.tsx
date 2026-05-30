"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { sharpyClient } from "../../../../lib/client";
import { formatAmount, formatDeadline, statusColor } from "../../../../lib/utils";
import type { Invoice } from "../../../../lib/utils";

export default function RecurringPage() {
  const { id } = useParams<{ id: string }>();
  const [chain, setChain] = useState<{ id: number; invoice: Invoice }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const buildChain = async () => {
      const results: { id: number; invoice: Invoice }[] = [];
      let currentId: number | null = Number(id);
      while (currentId) {
        try {
          const inv = await sharpyClient.getInvoice(currentId);
          results.push({ id: currentId, invoice: inv });
          currentId = await sharpyClient.getNextRecurring(currentId);
        } catch { break; }
      }
      setChain(results);
      setLoading(false);
    };
    buildChain();
  }, [id]);

  if (loading) return <p className="text-gray-500">Loading recurring chain...</p>;

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Recurring Chain — Invoice #{id}</h1>
      {chain.length === 0 ? (
        <p className="text-gray-500">No recurring chain found.</p>
      ) : (
        <div className="space-y-3">
          {chain.map(({ id: cid, invoice }, i) => {
            const total = invoice.amounts.reduce((a, b) => a + b, 0n);
            return (
              <Link key={cid} href={`/invoice/${cid}`}
                className="flex items-center justify-between bg-white border border-gray-200 rounded-xl p-4 hover:border-indigo-300">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-400 font-mono w-6">{i + 1}</span>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Invoice #{cid}</p>
                    <p className="text-xs text-gray-400">Due {formatDeadline(invoice.deadline)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-700">{formatAmount(total)} USDC</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${statusColor(invoice.status)}`}>{invoice.status}</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
