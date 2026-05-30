export { formatAmount, parseAmount, truncateAddress, isExpired, deadlineFromDays, explorerUrl, isValidAddress } from "@stellar-sharpy/sdk";
export type { Invoice, RecipientAmount, SplitRule } from "@stellar-sharpy/sdk";

export function statusColor(status: string): string {
  switch (status) {
    case "Pending": return "text-yellow-600 bg-yellow-50";
    case "Released": return "text-green-600 bg-green-50";
    case "Refunded": return "text-blue-600 bg-blue-50";
    case "Cancelled": return "text-red-600 bg-red-50";
    default: return "text-gray-600 bg-gray-50";
  }
}

export function formatDeadline(ts: number): string {
  return new Date(ts * 1000).toLocaleDateString(undefined, { dateStyle: "medium" });
}

export function fundingPercent(funded: bigint, amounts: bigint[]): number {
  const total = amounts.reduce((a, b) => a + b, 0n);
  if (total === 0n) return 0;
  return Math.min(100, Number((funded * 100n) / total));
}
