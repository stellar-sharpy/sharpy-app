import { test, expect } from "@playwright/test";
import { validatePoolRows } from "../src/lib/pool-pay";
import { formatAmount, parseAmount } from "../src/lib/utils";

/**
 * Wallet-free coverage of pool-pay batch math and validation errors via the
 * exported validatePoolRows helper (same code path as the Pay button).
 */

test.describe("pool-pay batch validation", () => {
  test("sums batch totals with parseAmount/formatAmount round-trip", () => {
    const payments = validatePoolRows([
      { invoiceId: "7", amount: "10.00" },
      { invoiceId: "8", amount: "5.50" },
    ]);
    expect(payments).toHaveLength(2);
    const total = payments.reduce((a, p) => a + p.amount, 0n);
    expect(total).toBe(parseAmount("15.50"));
    expect(formatAmount(total)).toContain("15.5");
  });

  test("skips blank rows when summing the batch", () => {
    const payments = validatePoolRows([
      { invoiceId: "7", amount: "10.00" },
      { invoiceId: "", amount: "" },
    ]);
    expect(payments).toHaveLength(1);
    expect(payments[0].invoiceId).toBe(7);
  });

  test("rejects an empty batch", () => {
    expect(() => validatePoolRows([{ invoiceId: "", amount: "" }])).toThrow("Add at least one payment");
  });

  test("rejects non-numeric and fractional invoice IDs", () => {
    expect(() => validatePoolRows([{ invoiceId: "abc", amount: "1" }])).toThrow("Invalid invoice ID");
    expect(() => validatePoolRows([{ invoiceId: "3.5", amount: "1" }])).toThrow("Invalid invoice ID");
    expect(() => validatePoolRows([{ invoiceId: "0", amount: "1" }])).toThrow("Invalid invoice ID");
  });

  test("rejects missing, non-numeric, and non-positive amounts", () => {
    expect(() => validatePoolRows([{ invoiceId: "7", amount: "" }])).toThrow("Invalid amount for #7");
    expect(() => validatePoolRows([{ invoiceId: "7", amount: "abc" }])).toThrow("Invalid amount for #7");
    expect(() => validatePoolRows([{ invoiceId: "7", amount: "0" }])).toThrow("Invalid amount for #7");
  });
});
