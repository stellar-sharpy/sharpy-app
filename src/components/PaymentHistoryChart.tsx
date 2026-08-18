"use client";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { formatAmount } from "../lib/utils";
import type { Invoice } from "../lib/utils";

interface Props {
  invoice: Invoice;
  tokenSymbol: string;
}

export default function PaymentHistoryChart({ invoice, tokenSymbol }: Props) {
  if (!invoice.payments || invoice.payments.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          No payments yet
        </p>
      </div>
    );
  }

  const data = invoice.payments.map((p, i) => ({
    name: `Payment ${i + 1}`,
    amount: Number(p.amount) / 1e7, // Convert to decimal
    payer: p.payer.slice(0, 8),
  }));

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium" style={{ color: "var(--text)" }}>
        Payment History ({invoice.payments.length} payment{invoice.payments.length !== 1 ? "s" : ""})
      </p>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data}>
          <XAxis
            dataKey="name"
            tick={{ fill: "var(--muted)", fontSize: 11 }}
            stroke="var(--border)"
          />
          <YAxis
            tick={{ fill: "var(--muted)", fontSize: 11 }}
            stroke="var(--border)"
          />
          <Tooltip
            contentStyle={{
              background: "var(--surface-2)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              color: "var(--text)",
            }}
            formatter={(value: number) => [`${value.toFixed(2)} ${tokenSymbol}`, "Amount"]}
          />
          <Bar dataKey="amount" fill="#6C63FF" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
