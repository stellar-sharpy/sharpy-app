import { sharpyClient } from "../../../lib/client";
import { formatAmount, formatDeadline, fundingPercent, truncateAddress } from "../../../lib/utils";

export default async function VerifyPage({ params }: { params: { id: string } }) {
  const invoiceId = Number(params.id);
  let invoice;
  let error = "";
  try { invoice = await sharpyClient.getInvoice(invoiceId); }
  catch (e: any) { error = e.message; }

  if (error || !invoice) {
    return (
      <div className="max-w-lg mx-auto text-center py-32">
        <p className="text-red-400">{error || "Invoice not found."}</p>
      </div>
    );
  }

  const total = invoice.amounts.reduce((a, b) => a + b, 0n);
  const pct = fundingPercent(invoice.funded, invoice.amounts);

  return (
    <div className="max-w-lg mx-auto space-y-5">
      <div className="text-center">
        <p className="text-xs text-[#4B5563] mb-2 uppercase tracking-widest">On-chain Verification</p>
        <h1 className="font-display text-2xl font-bold text-[#F1F2F6]">Invoice #{invoiceId}</h1>
        <p className="text-xs text-[#4B5563] mt-1">No login required — data read directly from Stellar</p>
      </div>

      <div className="card p-6 space-y-5">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-[#F1F2F6]">{formatAmount(total)} USDC</span>
          <span className={`badge badge-${invoice.status.toLowerCase()}`}>{invoice.status}</span>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><p className="text-xs text-[#4B5563] mb-1">Creator</p><p className="mono">{truncateAddress(invoice.creator)}</p></div>
          <div><p className="text-xs text-[#4B5563] mb-1">Deadline</p><p className="text-[#F1F2F6]">{formatDeadline(invoice.deadline)}</p></div>
          <div><p className="text-xs text-[#4B5563] mb-1">Funded</p><p className="text-[#00D4AA] font-semibold">{formatAmount(invoice.funded)} USDC</p></div>
          <div><p className="text-xs text-[#4B5563] mb-1">Remaining</p><p className="text-[#F1F2F6]">{formatAmount(total - invoice.funded)} USDC</p></div>
        </div>

        <div>
          <div className="flex justify-between text-xs text-[#4B5563] mb-2"><span>Progress</span><span>{pct}%</span></div>
          <div className="progress-bar"><div className="progress-fill" style={{ width: `${pct}%` }} /></div>
        </div>

        <div>
          <p className="text-xs text-[#4B5563] mb-3">Recipients</p>
          <div className="space-y-2">
            {invoice.recipients.map((addr, i) => (
              <div key={i} className="flex justify-between items-center py-2 border-b border-[#1E2028] last:border-0">
                <span className="mono">{truncateAddress(addr)}</span>
                <span className="text-sm text-[#F1F2F6]">{formatAmount(invoice.amounts[i] ?? 0n)} USDC</span>
              </div>
            ))}
          </div>
        </div>

        {invoice.escrowEnabled && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3">
            <p className="text-xs text-amber-400">Escrow — {invoice.escrowReleaseDelay / 3600}h release delay</p>
          </div>
        )}
      </div>
    </div>
  );
}
