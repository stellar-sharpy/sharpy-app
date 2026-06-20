"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "../../../components/WalletProvider";
import { sharpyClient, DEFAULT_TOKEN, NETWORK } from "../../../lib/client";
import { parseAmount, deadlineFromDays, isValidAddress } from "../../../lib/utils";
import TokenSelector from "../../../components/TokenSelector";
import { Token, getTokenAddress, TOKENS } from "../../../lib/tokens";

interface Recipient { address: string; amount: string; }

export default function NewInvoice() {
  const { publicKey, connect } = useWallet();
  const router = useRouter();
  const [recipients, setRecipients] = useState<Recipient[]>([{ address: "", amount: "" }]);
  const [selectedToken, setSelectedToken] = useState<Token>(TOKENS[0]);
  const [tokenAddress, setTokenAddress] = useState<string>(DEFAULT_TOKEN);
  const [deadlineDays, setDeadlineDays] = useState(7);
  const [escrow, setEscrow] = useState(false);
  const [escrowDelay, setEscrowDelay] = useState(24);
  const [recurring, setRecurring] = useState(false);
  const [intervalDays, setIntervalDays] = useState(30);
  const [maxRec, setMaxRec] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const addRecipient = () => setRecipients([...recipients, { address: "", amount: "" }]);
  const updateRecipient = (i: number, field: keyof Recipient, val: string) =>
    setRecipients(recipients.map((r, idx) => idx === i ? { ...r, [field]: val } : r));
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
          creator: publicKey, recipients: recipientList, token: tokenAddress, deadline,
          recurrenceInterval: intervalDays * 86400, maxRecurrences: maxRec,
        });
        invoiceId = res.invoiceId;
      } else {
        const res = await sharpyClient.createInvoice({
          creator: publicKey, recipients: recipientList, token: tokenAddress, deadline,
          escrowEnabled: escrow, escrowReleaseDelay: escrow ? escrowDelay * 3600 : undefined,
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
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <p className="text-[#6B7280]">Connect your wallet to create an invoice.</p>
        <button onClick={connect} className="btn-primary">Connect Wallet</button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold text-[#F1F2F6]">New Invoice</h1>
        <p className="text-sm text-[#6B7280] mt-1">Configure recipients, split rules, and payment terms.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Recipients */}
        <div className="card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-semibold text-sm" style={{ color: "var(--text)" }}>Recipients</h2>
            <TokenSelector
              value={tokenAddress}
              onChange={(addr, token) => { setTokenAddress(addr); setSelectedToken(token); }}
            />
          </div>
          {recipients.map((r, i) => (
            <div key={i} className="flex flex-col sm:flex-row gap-2">
              <input value={r.address} onChange={(e) => updateRecipient(i, "address", e.target.value)}
                placeholder="G... stellar address" className="input flex-1 font-mono text-xs" />
              <div className="flex gap-2">
                <input value={r.amount} onChange={(e) => updateRecipient(i, "amount", e.target.value)}
                  placeholder={selectedToken.symbol} className="input flex-1 sm:w-28" />
                {recipients.length > 1 && (
                  <button type="button" onClick={() => removeRecipient(i)}
                    className="text-[#4B5563] hover:text-[#EF4444] transition-colors text-lg leading-none px-2">×</button>
                )}
              </div>
            </div>
          ))}
          <button type="button" onClick={addRecipient} className="text-sm text-[#6C63FF] hover:text-[#5A52E8] transition-colors">
            + Add recipient
          </button>
        </div>

        {/* Terms */}
        <div className="card p-6 space-y-4">
          <h2 className="font-display font-semibold text-[#F1F2F6] text-sm">Payment Terms</h2>
          <div className="flex items-center gap-3">
            <label className="text-sm text-[#9CA3AF] w-24 shrink-0">Deadline</label>
            <input type="number" min={1} value={deadlineDays} onChange={(e) => setDeadlineDays(Number(e.target.value))}
              className="input w-24" />
            <span className="text-sm text-[#4B5563]">days from now</span>
          </div>
        </div>

        {/* Options */}
        <div className="card p-6 space-y-5">
          <h2 className="font-display font-semibold text-[#F1F2F6] text-sm">Options</h2>

          {/* Escrow toggle */}
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer group">
              <div className={`w-9 h-5 rounded-full transition-colors relative ${escrow ? "bg-[#6C63FF]" : "bg-[#1E2028]"}`}
                onClick={() => setEscrow(!escrow)}>
                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${escrow ? "translate-x-4" : "translate-x-0.5"}`} />
              </div>
              <span className="text-sm text-[#9CA3AF] group-hover:text-[#F1F2F6] transition-colors">Enable Escrow</span>
            </label>
            {escrow && (
              <div className="flex items-center gap-3 pl-12">
                <input type="number" min={1} value={escrowDelay} onChange={(e) => setEscrowDelay(Number(e.target.value))}
                  className="input w-24" />
                <span className="text-sm text-[#4B5563]">hour release delay</span>
              </div>
            )}
          </div>

          {/* Recurring toggle */}
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer group">
              <div className={`w-9 h-5 rounded-full transition-colors relative ${recurring ? "bg-[#6C63FF]" : "bg-[#1E2028]"}`}
                onClick={() => setRecurring(!recurring)}>
                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${recurring ? "translate-x-4" : "translate-x-0.5"}`} />
              </div>
              <span className="text-sm text-[#9CA3AF] group-hover:text-[#F1F2F6] transition-colors">Recurring Invoice</span>
            </label>
            {recurring && (
              <div className="grid grid-cols-2 gap-3 pl-12">
                <div>
                  <label className="text-xs text-[#4B5563] mb-1 block">Interval (days)</label>
                  <input type="number" min={1} value={intervalDays} onChange={(e) => setIntervalDays(Number(e.target.value))} className="input" />
                </div>
                <div>
                  <label className="text-xs text-[#4B5563] mb-1 block">Max recurrences (0 = infinite)</label>
                  <input type="number" min={0} value={maxRec} onChange={(e) => setMaxRec(Number(e.target.value))} className="input" />
                </div>
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-xl">{error}</div>
        )}

        <button type="submit" disabled={loading} className="btn-primary w-full py-3">
          {loading ? "Creating invoice..." : "Create Invoice"}
        </button>
      </form>
    </div>
  );
}
