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

  return { invoice, loading, error, reload: load };
}
