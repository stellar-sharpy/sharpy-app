"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useWallet } from "../../../components/WalletProvider";
import { sharpyClient, TOKEN, NETWORK } from "../../../lib/client";
import { formatAmount, parseAmount, statusColor, formatDeadline, fundingPercent, truncateAddress, explorerUrl } from "../../../lib/utils";
import type { Invoice } from "../../../lib/utils";

export default function InvoicePage() {
  const { id } = useParams<{ id: string }>();
  const invoiceId = Number(id);
  const { publicKey, connect } = useWallet();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [payAmount, setPayAmount] = useState("");
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");
  const [txHash, setTxHash] = useState("");

  const load = async () => {
    try {
      const inv = await sharpyClient.getInvoice(invoiceId);
      setInvoice(inv);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [invoiceId]);

  const handlePay = async () => {
    if (!publicKey || !payAmount) return;
    setPaying(true);
    setError("");
    try {
      const { txHash } = await sharpyClient.pay(publicKey, invoiceId, parseAmount(payAmount));
      setTxHash(txHash);
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setPaying(false);
    }
  };

  if (loading) return <p className="text-gray-500">Loading invoice...</p>;
  if (error && !invoice) return <p className="text-red-600">{error}</p>;
  if (!invoice) return null;

  const total = invoice.amounts.reduce((a, b) => a + b, 0n);
  const pct = fundingPercent(invoice.funded, invoice.amounts);
  const remaining = total - invoice.funded;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Invoice #{invoiceId}</h1>
        <span className={`text-sm px-3 py-1 rounded-full font-medium ${statusColor(invoice.status)}`}>{invoice.status}</span>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><p className="text-gray-500">Creator</p><p className="font-mono">{truncateAddress(invoice.creator)}</p></div>
          <div><p className="text-gray-500">Deadline</p><p>{formatDeadline(invoice.deadline)}</p></div>
          <div><p className="text-gray-500">Total</p><p className="font-semibold">{formatAmount(total)} USDC</p></div>
          <div><p className="text-gray-500">Funded</p><p className="font-semibold">{formatAmount(invoice.funded)} USDC</p></div>
        </div>

        <div>
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Progress</span><span>{pct}%</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full">
            <div className="h-2 bg-indigo-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
          </div>
        </div>

        <div>
          <p className="text-sm text-gray-500 mb-2">Recipients</p>
          {invoice.recipients.map((addr, i) => (
            <div key={i} className="flex justify-between text-sm py-1 border-b border-gray-50 last:border-0">
              <span className="font-mono text-gray-700">{truncateAddress(addr)}</span>
              <span>{formatAmount(invoice.amounts[i] ?? 0n)} USDC</span>
            </div>
          ))}
        </div>

        {invoice.escrowEnabled && (
          <div className="flex items-center justify-between text-sm bg-yellow-50 px-3 py-2 rounded-lg">
            <span className="text-yellow-700">🔒 Escrow enabled — {invoice.escrowReleaseDelay / 3600}h delay</span>
            {invoice.status === "Pending" && invoice.funded >= total && (
              <Link href={`/invoice/${invoiceId}/escrow`} className="text-indigo-600 hover:underline">Manage</Link>
            )}
          </div>
        )}
      </div>

      {/* Pay section */}
      {invoice.status === "Pending" && remaining > 0n && (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="font-semibold text-gray-900 mb-3">Make a payment</h2>
          {!publicKey ? (
            <button onClick={connect} className="text-sm text-indigo-600 hover:underline">Connect wallet to pay</button>
          ) : (
            <div className="flex gap-3">
              <input value={payAmount} onChange={(e) => setPayAmount(e.target.value)}
                placeholder={`Up to ${formatAmount(remaining)} USDC`}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              <button onClick={handlePay} disabled={paying}
                className="bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50">
                {paying ? "Paying..." : "Pay"}
              </button>
            </div>
          )}
          {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
          {txHash && (
            <p className="text-sm text-green-600 mt-2">
              ✅ Paid!{" "}
              <a href={explorerUrl(NETWORK, txHash, "tx")} target="_blank" rel="noreferrer" className="underline">View tx</a>
            </p>
          )}
        </div>
      )}

      <div className="flex gap-3 text-sm">
        <Link href={`/verify/${invoiceId}`} className="text-gray-500 hover:text-indigo-600">🔍 Public verification</Link>
        {invoice.escrowEnabled && <Link href={`/invoice/${invoiceId}/escrow`} className="text-gray-500 hover:text-indigo-600">🔒 Escrow</Link>}
        <Link href={`/invoice/${invoiceId}/recurring`} className="text-gray-500 hover:text-indigo-600">🔁 Recurring chain</Link>
      </div>
    </div>
  );
}
