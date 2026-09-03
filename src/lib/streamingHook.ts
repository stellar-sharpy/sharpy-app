import { useCallback, useEffect, useState } from "react";
import { sharpyClient } from "./client";

/**
 * useStreaming — lightweight hook wrapping streaming-related reads.
 * On-chain streaming is not yet deployed, so the hook exposes the live
 * invoice funding state plus localStorage-backed schedule helpers.
 * Components call `sharpyClient` directly for reads to stay type-safe.
 */

export interface StreamSchedule {
  ratePerDay: string;
  durationDays: string;
  recipient: string;
  createdAt: number;
}

function keyFor(invoiceId: number): string {
  return `streaming_config_${invoiceId}`;
}

export function useStreaming(invoiceId: number) {
  const [schedule, setSchedule] = useState<StreamSchedule | null>(null);
  const [funded, setFunded] = useState<bigint | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(keyFor(invoiceId));
      if (raw) setSchedule(JSON.parse(raw));
      else setSchedule(null);
    } catch {
      setSchedule(null);
    }
  }, [invoiceId]);

  useEffect(() => {
    let cancelled = false;
    sharpyClient
      .getInvoice(invoiceId)
      .then((inv) => {
        if (!cancelled) setFunded(inv.funded);
      })
      .catch(() => {
        if (!cancelled) setFunded(null);
      });
    return () => {
      cancelled = true;
    };
  }, [invoiceId]);

  const refresh = useCallback(() => {
    try {
      const raw = localStorage.getItem(keyFor(invoiceId));
      setSchedule(raw ? JSON.parse(raw) : null);
    } catch {
      setSchedule(null);
    }
  }, [invoiceId]);

  const clear = useCallback(() => {
    try {
      localStorage.removeItem(keyFor(invoiceId));
    } catch {
      /* ignore */
    }
    setSchedule(null);
  }, [invoiceId]);

  const hasActiveSchedule = schedule !== null;

  return { schedule, funded, refresh, clear, hasActiveSchedule };
}
