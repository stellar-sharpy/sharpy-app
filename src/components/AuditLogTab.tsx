"use client";

import { useEffect, useState } from "react";
import { sharpyClient } from "../lib/client";
import { truncateAddress } from "../lib/utils";

interface AuditLogEntry {
  action: string;
  actor: string;
  timestamp: number;
}

interface AuditLogTabProps {
  invoiceId: number;
}

export default function AuditLogTab({ invoiceId }: AuditLogTabProps) {
  const [log, setLog] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetch = async () => {
      try {
        const entries = await sharpyClient.getAuditLog(invoiceId);
        setLog(entries);
      } catch (e: any) {
        setError(e.message || "Failed to load audit log");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [invoiceId]);

  if (loading) {
    return (
      <div className="space-y-2 py-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-10 rounded animate-pulse bg-[#1E2028]" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8 text-center">
        <p className="text-sm text-red-400">{error}</p>
      </div>
    );
  }

  if (log.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-sm text-[#4B5563]">No audit entries found for this invoice.</p>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {log.map((entry, i) => (
        <div
          key={i}
          className="flex items-center justify-between py-3 border-b border-[#1E2028] last:border-0"
        >
          <div className="flex items-center gap-3 min-w-0">
            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-[#6C63FF]/10 text-[#6C63FF] shrink-0">
              {entry.action}
            </span>
            <p className="mono text-xs truncate text-[#F1F2F6]">
              {truncateAddress(entry.actor)}
            </p>
          </div>
          <span className="text-xs shrink-0 ml-3 text-[#4B5563]">
            {new Date(entry.timestamp * 1000).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
      ))}
    </div>
  );
}
