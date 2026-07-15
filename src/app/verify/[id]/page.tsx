import FundingBreakdown from "../../../components/FundingBreakdown";
import { headers } from "next/headers";
import { sharpyClient, CONTRACT_ID } from "../../../lib/client";
import { formatAmount, formatDeadline, fundingPercent, truncateAddress } from "../../../lib/utils";
import { getTokenByAddress } from "../../../lib/tokens";
import { CopyButton } from "../../../components/CopyButton";

export default async function VerifyPage({ params }: { params: { id: string } }) {
  const invoiceId = Number(params.id);
  let invoice;
  let fingerprint: string | null = null;
  let error = "";

  try {
    invoice = await sharpyClient.getInvoice(invoiceId);
    try { fingerprint = await sharpyClient.getInvoiceFingerprint(invoiceId); } catch {}
  } catch (e: any) {
    error = e.message;
  }

  if (error || !invoice) {
    return (
      <div className="max-w-lg mx-auto text-center py-32">
        <p className="text-red-400">{error || "Invoice not found."}</p>
      </div>
    );
  }

  const headersList = await headers();
  const host = headersList.get("host");
  const protocol = host?.startsWith("localhost") ? "http" : "https";
  const invoiceUrl = `${protocol}://${host}/invoice/${invoiceId}`;

  const total = invoice.amounts.reduce((a, b) => a + b, 0n);
  const tokenSymbol = getTokenByAddress(invoice.tokens[0] ?? "")?.symbol ?? "tokens";

  return (
    <div className="max-w-lg mx-auto space-y-5">
      <div className="text-center">
        <p className="text-xs text-[#4B5563] mb-2 uppercase tracking-widest">On-chain Verification</p>
        <h1 className="font-display text-2xl font-bold" style={{ color: "var(--text)" }}>Invoice #{invoiceId}</h1>
        <p className="text-xs text-[#4B5563] mt-1">No login required - data read directly from Stellar</p>
      </div>

      <div className="card p-4 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs text-[#4B5563] mb-1">Invoice URL</p>
            <p className="mono text-xs truncate">{invoiceUrl}</p>
          </div>
          <CopyButton value={invoiceUrl} label="invoice URL" />
        </div>
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs text-[#4B5563] mb-1">Contract Address</p>
            <p className="mono text-xs truncate">{CONTRACT_ID}</p>
          </div>
          <CopyButton value={CONTRACT_ID} label="contract address" />
        </div>
      </div>

      <div className="card p-6 space-y-5">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold" style={{ color: "var(--text)" }}>{formatAmount(total)} {tokenSymbol}</span>
          <span className={`badge badge-${invoice.status.toLowerCase()}`}>{invoice.status}</span>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><p className="text-xs text-[#4B5563] mb-1">Creator</p><p className="mono">{truncateAddress(invoice.creator)}</p></div>
          <div><p className="text-xs text-[#4B5563] mb-1">Deadline</p><p style={{ color: "var(--text)" }}>{formatDeadline(invoice.deadline)}</p></div>
          <div><p className="text-xs text-[#4B5563] mb-1">Funded</p><p className="text-[#00D4AA] font-semibold">{formatAmount(invoice.funded)} {tokenSymbol}</p></div>
          <div><p className="text-xs text-[#4B5563] mb-1">Remaining</p><p style={{ color: "var(--text)" }}>{formatAmount(total - invoice.funded)} {tokenSymbol}</p></div>
        </div>

        {/* Funding Breakdown - Issue #29 */}
        <FundingBreakdown invoice={invoice} tokenSymbol={tokenSymbol} />

        <div>
          <p className="text-xs text-[#4B5563] mb-3">Recipients</p>
          <div className="space-y-2">
            {invoice.recipients.map((addr, i) => (
              <div key={i} className="flex justify-between items-center py-2 border-b border-[#1E2028] last:border-0">
                <span className="mono">{truncateAddress(addr)}</span>
                <span className="text-sm" style={{ color: "var(--text)" }}>{formatAmount(invoice.amounts[i] ?? 0n)} {tokenSymbol}</span>
              </div>
            ))}
          </div>
        </div>

        {invoice.escrowEnabled && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3">
            <p className="text-xs text-amber-400">Escrow - {invoice.escrowReleaseDelay / 3600}h release delay</p>
          </div>
        )}
      </div>

      {fingerprint && (
        <div className="card p-4 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium" style={{ color: "var(--text)" }}>Content Fingerprint</p>
            <span className="text-xs bg-[#6C63FF]/10 text-[#6C63FF] border border-[#6C63FF]/20 px-2 py-0.5 rounded-full">
              Protocol 25/26
            </span>
          </div>
          <p className="text-xs text-[#4B5563]">
            SHA-256 hash of immutable invoice fields. Any change to terms produces a different hash.
          </p>
          <div className="flex items-center gap-2">
            <code className="mono text-xs flex-1 truncate">{fingerprint}</code>
            <CopyButton value={fingerprint} label="fingerprint" />
          </div>
        </div>
      )}
    </div>
  );
}