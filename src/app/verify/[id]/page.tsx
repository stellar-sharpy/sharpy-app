import { sharpyClient } from "../../../lib/client";
import { formatAmount, statusColor, formatDeadline, fundingPercent, truncateAddress } from "../../../lib/utils";

export default async function VerifyPage({ params }: { params: { id: string } }) {
  const invoiceId = Number(params.id);
  let invoice;
  let error = "";
  try {
    invoice = await sharpyClient.getInvoice(invoiceId);
  } catch (e: any) {
    error = e.message;
  }

  if (error || !invoice) {
    return (
      <div className="max-w-lg mx-auto text-center py-20">
        <p className="text-red-600">{error || "Invoice not found."}</p>
      </div>
    );
  }

  const total = invoice.amounts.reduce((a, b) => a + b, 0n);
  const pct = fundingPercent(invoice.funded, invoice.amounts);

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900">Invoice Verification</h1>
        <p className="text-sm text-gray-500 mt-1">On-chain verification — no login required</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <span className="font-mono text-gray-500 text-sm">#{invoiceId}</span>
          <span className={`text-sm px-3 py-1 rounded-full font-medium ${statusColor(invoice.status)}`}>{invoice.status}</span>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div><p className="text-gray-400">Creator</p><p className="font-mono">{truncateAddress(invoice.creator)}</p></div>
          <div><p className="text-gray-400">Deadline</p><p>{formatDeadline(invoice.deadline)}</p></div>
          <div><p className="text-gray-400">Total</p><p className="font-semibold">{formatAmount(total)} USDC</p></div>
          <div><p className="text-gray-400">Funded</p><p className="font-semibold">{formatAmount(invoice.funded)} USDC</p></div>
        </div>

        <div>
          <div className="flex justify-between text-xs text-gray-400 mb-1"><span>Funding progress</span><span>{pct}%</span></div>
          <div className="h-2 bg-gray-100 rounded-full">
            <div className="h-2 bg-indigo-500 rounded-full" style={{ width: `${pct}%` }} />
          </div>
        </div>

        <div>
          <p className="text-xs text-gray-400 mb-2">Recipients</p>
          {invoice.recipients.map((addr, i) => (
            <div key={i} className="flex justify-between text-sm py-1.5 border-b border-gray-50 last:border-0">
              <span className="font-mono text-gray-600">{truncateAddress(addr)}</span>
              <span className="text-gray-700">{formatAmount(invoice.amounts[i] ?? 0n)} USDC</span>
            </div>
          ))}
        </div>

        {invoice.escrowEnabled && (
          <p className="text-xs text-yellow-600 bg-yellow-50 px-3 py-2 rounded-lg">
            🔒 Escrow — {invoice.escrowReleaseDelay / 3600}h release delay
          </p>
        )}
      </div>
    </div>
  );
}
