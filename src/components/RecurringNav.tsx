"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { sharpyClient } from "../lib/client";

export default function RecurringNav({ invoiceId }: { invoiceId: number }) {
  const [nextId, setNextId] = useState<number | null>(null);
  const [params, setParams] = useState<{ interval: number; maxRecurrences: number } | null>(null);

  useEffect(() => {
    sharpyClient.getNextRecurring(invoiceId).then(setNextId).catch(() => {});
    sharpyClient.getRecurringParams(invoiceId).then(setParams).catch(() => {});
  }, [invoiceId]);

  if (nextId === null && !params) return null;

  return (
    <div className="card p-4 flex items-center justify-between">
      <div className="space-y-0.5">
        <p className="text-xs font-medium" style={{ color: "var(--text)" }}>Recurring invoice</p>
        {params && <p className="text-xs" style={{ color: "var(--muted)" }}>Every {params.interval / 86400} days · {params.maxRecurrences === 0 ? "unlimited" : `max ${params.maxRecurrences}`} recurrences</p>}
        {nextId !== null ? <p className="text-xs text-[#6C63FF]">Next: Invoice #{nextId}</p> : <p className="text-xs" style={{ color: "var(--muted)" }}>No next invoice yet — triggers on release.</p>}
      </div>
      <div className="flex gap-2">
        <Link href={`/invoice/${invoiceId}/recurring`} className="text-xs px-3 py-2 rounded-lg border" style={{ borderColor: "var(--border)", color: "var(--text-secondary)", background: "var(--surface-2)" }}>View chain</Link>
        {nextId !== null && <Link href={`/invoice/${nextId}`} className="text-xs px-3 py-2 rounded-lg btn-primary">Go to next</Link>}
      </div>
    </div>
  );
}
