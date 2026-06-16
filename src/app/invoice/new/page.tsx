"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "../../../components/WalletProvider";
import { sharpyClient, TOKEN } from "../../../lib/client";
import { parseAmount, deadlineFromDays, isValidAddress } from "../../../lib/utils";

interface Recipient { address: string; amount: string; }

export default function NewInvoice() {
  const { publicKey, connect } = useWallet();
  const router = useRouter();
  const [recipients, setRecipients] = useState<Recipient[]>([{ address: "", amount: "" }]);
  const [deadlineDays, setDeadlineDays] = useState(7);
  const [escrow, setEscrow] = useState(false);
  const [escrowDelay, setEscrowDelay] = useState(24);
  const [recurring, setRecurring] = useState(false);
  const [intervalDays, setIntervalDays] = useState(30);
  const [maxRec, setMaxRec] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const addRecipient = () => setRecipients([...recipients, { address: "", amount: "" }]);
  const updateRecipient = (i: number, field: keyof Recipient, val: string) => {
    setRecipients(recipients.map((r, idx) => idx === i ? { ...r, [field]: val } : r));
  };
  const removeRecipient = (i: number) => setRecipients(recipients.filter((_, idx) => idx !== i));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!publicKey) return;
    setError("");

    for (const r of recipients) {
      if (!isValidAddress(r.address)) { setError(`Invalid address: ${r.address}`); return; }
      if (!r.amount || isNaN(Number(r.amount))) { setError("All amounts must be valid numbers."); return; }
    }

    setLoading(true);
    try {
      const recipientList = recipients.map((r) => ({ address: r.address, amount: parseAmount(r.amount) }));
      const deadline = deadlineFromDays(deadlineDays);

      let invoiceId: number;
      if (recurring) {
        const res = await sharpyClient.createRecurring({
          creator: publicKey,
          recipients: recipientList,
          token: TOKEN,
          deadline,
          recurrenceInterval: intervalDays * 86400,
          maxRecurrences: maxRec,
        });
        invoiceId = res.invoiceId;
      } else {
        const res = await sharpyClient.createInvoice({
          creator: publicKey,
          recipients: recipientList,
          token: TOKEN,
          deadline,
          escrowEnabled: escrow,
          escrowReleaseDelay: escrow ? escrowDelay * 3600 : undefined,
        });
        invoiceId = res.invoiceId;
      }
      router.push(`/invoice/${invoiceId}`);
    } catch (err: any) {
      setError(err.message ?? "Transaction failed.");
    } finally {
      setLoading(false);
    }
  };

  if (!publicKey) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500 mb-4">Connect your wallet to create an invoice.</p>
        <button onClick={connect} className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700">Connect Wallet</button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">New Invoice</h1>
      <form onSubmit={handleSubmit} className="space-y-6 bg-white border border-gray-200 rounded-xl p-6">

        {/* Recipients */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Recipients</label>
          {recipients.map((r, i) => (
            <div key={i} className="flex gap-2 mb-2">
              <input value={r.address} onChange={(e) => updateRecipient(i, "address", e.target.value)}
                placeholder="G... address" className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono" />
              <input value={r.amount} onChange={(e) => updateRecipient(i, "amount", e.target.value)}
                placeholder="Amount (USDC)" className="w-36 border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              {recipients.length > 1 && (
                <button type="button" onClick={() => removeRecipient(i)} className="text-red-400 hover:text-red-600 px-2">✕</button>
              )}
            </div>
          ))}
          <button type="button" onClick={addRecipient} className="text-sm text-indigo-600 hover:underline">+ Add recipient</button>
        </div>

        {/* Deadline */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Payment deadline</label>
          <div className="flex items-center gap-2">
            <input type="number" min={1} value={deadlineDays} onChange={(e) => setDeadlineDays(Number(e.target.value))}
              className="w-24 border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            <span className="text-sm text-gray-500">days from now</span>
          </div>
        </div>

        {/* Escrow */}
        <div className="flex items-center gap-3">
          <input type="checkbox" id="escrow" checked={escrow} onChange={(e) => setEscrow(e.target.checked)} className="rounded" />
          <label htmlFor="escrow" className="text-sm font-medium text-gray-700">Enable escrow</label>
          {escrow && (
            <div className="flex items-center gap-2 ml-4">
              <input type="number" min={1} value={escrowDelay} onChange={(e) => setEscrowDelay(Number(e.target.value))}
                className="w-20 border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              <span className="text-sm text-gray-500">hour delay</span>
            </div>
          )}
        </div>

        {/* Recurring */}
        <div>
          <div className="flex items-center gap-3">
            <input type="checkbox" id="recurring" checked={recurring} onChange={(e) => setRecurring(e.target.checked)} className="rounded" />
            <label htmlFor="recurring" className="text-sm font-medium text-gray-700">Recurring invoice</label>
          </div>
          {recurring && (
            <div className="mt-3 grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Interval (days)</label>
                <input type="number" min={1} value={intervalDays} onChange={(e) => setIntervalDays(Number(e.target.value))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Max recurrences (0 = infinite)</label>
                <input type="number" min={0} value={maxRec} onChange={(e) => setMaxRec(Number(e.target.value))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
            </div>
          )}
        </div>

        {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

        <button type="submit" disabled={loading}
          className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50">
          {loading ? "Creating..." : "Create Invoice"}
        </button>
      </form>
    </div>
  );
}
