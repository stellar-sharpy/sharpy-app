import { parseAmount } from "./utils";

export interface PoolPayment {
  invoiceId: number;
  amount: bigint;
}

export interface PoolRowInput {
  invoiceId: string;
  amount: string;
}

/**
 * Pure row validation for pool-pay batches — extracted so E2E/unit specs can
 * cover batch math and error cases without a connected wallet signer.
 * Throws a human-readable Error for the first invalid row.
 */
export function validatePoolRows(rows: PoolRowInput[]): PoolPayment[] {
  const filled = rows.filter((r) => r.invoiceId.trim() !== "" || r.amount.trim() !== "");
  const payments = filled.map((r) => {
    const iid = Number(r.invoiceId);
    if (!iid || isNaN(iid) || !Number.isInteger(iid) || iid < 1) throw new Error(`Invalid invoice ID: ${r.invoiceId}`);
    if (!r.amount || isNaN(Number(r.amount)) || Number(r.amount) <= 0) throw new Error(`Invalid amount for #${r.invoiceId}`);
    return { invoiceId: iid, amount: parseAmount(r.amount) };
  });
  if (payments.length === 0) throw new Error("Add at least one payment");
  return payments;
}
