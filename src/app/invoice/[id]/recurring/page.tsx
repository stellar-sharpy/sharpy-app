"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { sharpyClient } from "../../../../lib/client";
import { formatAmount, formatDeadline } from "../../../../lib/utils";
import type { Invoice } from "../../../../lib/utils";

export default function RecurringPage() {
  const { id } = useParams<{ id: string }>();
  const [chain, setChain] = useState<{ id: number; invoice: Invoice }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const build = async () => {
      const results: { id: number; invoice: Invoice }[] = [];
      let current: number | null = Number(id);
      while (current) {
        try {
          const inv = await sharpyClient.getInvoice(current);
          results.push({ id: current, invoice: inv });
          current = await sharpyClient.getNextRecurring(current);
        } catch { break; }
      }
      setChain(results);
      setLoading(false);
    };
    build();
  }, [id]);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <p className="mono text-xs mb-1">Invoice #{id}</p>
        <h1 className="font-display text-2xl font-bold text-[#F1F2F6]">Recurring Chain</h1>
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="card h-16 animate-pulse" />)}</div>
      ) : chain.length === 0 ? (
        <div className="card p-12 text-center text-[#4B5563] text-sm">No recurring chain found.</div>
      ) : (
        <div className="space-y-3">
          {chain.map(({ id: cid, invoice }, i) => {
            const total = invoice.amounts.reduce((a, b) => a + b, 0n);
            return (
              <Link key={cid} href={`/invoice/${cid}`}
                className="card p-4 flex items-center justify-between hover:border-[#2E3040] transition-colors">
                <div className="flex items-center gap-4">
                  <span className="text-xs text-[#4B5563] font-mono w-5">{i + 1}</span>
                  <div>
                    <p className="text-sm font-medium text-[#F1F2F6]">Invoice #{cid}</p>
                    <p className="text-xs text-[#4B5563]">Due {formatDeadline(invoice.deadline)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-[#9CA3AF]">{formatAmount(total)} tokens</span>
                  <span className={`badge badge-${invoice.status.toLowerCase()}`}>{invoice.status}</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
