import { useCallback, useEffect, useState } from "react";
import { sharpyClient } from "./client";
import type { Invoice } from "./utils";

/**
 * useInvoice — fetch a single invoice with loading / error states.
 * Wraps `sharpyClient.getInvoice` so pages share one typed data path.
 *
 * @param invoiceId - Target invoice id (NaN-safe: skips fetch when invalid).
 */
export function useInvoice(invoiceId: number) {
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!Number.isFinite(invoiceId)) {
      setError("Invalid invoice id");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      setInvoice(await sharpyClient.getInvoice(invoiceId));
    } catch (e: unknown) {
      setInvoice(null);
      setError(e instanceof Error ? e.message : "Failed to load invoice");
    } finally {
      setLoading(false);
    }
  }, [invoiceId]);

  useEffect(() => {
    void load();
  }, [load]);

  const reset = useCallback(() => {
    setInvoice(null);
    setError("");
    setLoading(false);
  }, []);

  return { invoice, loading, error, reload: load, reset };
}

/** Stats shape returned by `sharpyClient.getInvoiceStats`. */
export interface InvoiceStats {
  funded: bigint;
  total: bigint;
  paymentCount: number;
  uniquePayers: number;
  completionBps: number;
}

/**
 * useInvoiceStats — fetch funding stats for an invoice card or header.
 * Returns null stats until loaded; errors are swallowed to keep cards resilient.
 */
export function useInvoiceStats(invoiceId: number) {
  const [stats, setStats] = useState<InvoiceStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    sharpyClient
      .getInvoiceStats(invoiceId)
      .then((s) => {
        if (!cancelled) setStats(s);
      })
      .catch(() => {
        if (!cancelled) setStats(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [invoiceId]);

  return { stats, loading };
}
}
