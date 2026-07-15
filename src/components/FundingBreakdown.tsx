import { formatAmount, truncateAddress } from "../lib/utils";
import type { Invoice } from "../lib/utils";

interface FundingBreakdownProps {
  invoice: Invoice;
  tokenSymbol: string;
}

export default function FundingBreakdown({ invoice, tokenSymbol }: FundingBreakdownProps) {
  const total = invoice.amounts.reduce((a, b) => a + b, 0n);
  const funded = invoice.funded;
  const remaining = total - funded;
  const pct = total === 0n ? 0 : Math.min(100, Number((funded * 100n) / total));

  const recipientBreakdown = invoice.recipients.map((addr, i) => {
    const share = invoice.amounts[i] ?? 0n;
    const sharePct = total === 0n ? 0 : Number((share * 100n) / total);
    const fundedShare = total === 0n ? 0n : (funded * share) / total;
    return {
      address: addr,
      share,
      sharePct,
      isFullyFunded: fundedShare >= share,
    };
  });

  return (
    <div className="space-y-5">
      {/* Funding Overview */}
      <div className="flex items-center gap-4">
        <div className="relative w-20 h-20 shrink-0">
          <svg className="w-20 h-20 -rotate-90" viewBox="0 0 36 36">
            <path
              className="text-[#1E2028]"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
            />
            <path
              className="text-[#00D4AA]"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeDasharray={`${pct}, 100`}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm font-bold text-[#F1F2F6]">{pct}%</span>
          </div>
        </div>
        <div className="flex-1 space-y-1">
          <p className="text-sm font-semibold text-[#F1F2F6]">
            {formatAmount(funded)} <span className="text-[#4B5563] font-normal">/ {formatAmount(total)} {tokenSymbol}</span>
          </p>
          <p className="text-xs text-[#4B5563]">
            {remaining > 0n ? `${formatAmount(remaining)} ${tokenSymbol} remaining` : "Fully funded"}
          </p>
          <div className="progress-bar h-2">
            <div
              className="progress-fill h-2 rounded-full transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Recipient Breakdown */}
      <div>
        <p className="text-xs font-medium text-[#4B5563] mb-3 uppercase tracking-wider">Recipient Breakdown</p>
        <div className="space-y-2">
          {recipientBreakdown.map((r, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-[#1E2028] last:border-0">
              <div className="flex items-center gap-2 min-w-0">
                <span className={`w-2 h-2 rounded-full shrink-0 ${r.isFullyFunded ? "bg-[#00D4AA]" : "bg-[#4B5563]"}`} />
                <span className="mono text-xs truncate">{truncateAddress(r.address)}</span>
              </div>
              <div className="text-right shrink-0 ml-2">
                <p className="text-xs text-[#F1F2F6]">
                  {formatAmount(r.share)} {tokenSymbol}
                </p>
                <p className="text-[10px] text-[#4B5563]">
                  {r.sharePct.toFixed(1)}% share
                  {r.isFullyFunded && <span className="text-[#00D4AA] ml-1">funded</span>}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Funding Stats */}
      <div className="grid grid-cols-3 gap-2 pt-2">
        <div className="text-center p-2 rounded-lg bg-[#111318]">
          <p className="text-xs text-[#4B5563]">Total</p>
          <p className="text-sm font-semibold text-[#F1F2F6]">{formatAmount(total)}</p>
        </div>
        <div className="text-center p-2 rounded-lg bg-[#111318]">
          <p className="text-xs text-[#4B5563]">Funded</p>
          <p className="text-sm font-semibold text-[#00D4AA]">{formatAmount(funded)}</p>
        </div>
        <div className="text-center p-2 rounded-lg bg-[#111318]">
          <p className="text-xs text-[#4B5563]">Remaining</p>
          <p className="text-sm font-semibold text-[#F1F2F6]">{formatAmount(remaining)}</p>
        </div>
      </div>
    </div>
  );
}