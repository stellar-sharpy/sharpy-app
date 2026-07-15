"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useWallet } from "../../../components/WalletProvider";
import { sharpyClient, NETWORK } from "../../../lib/client";
import { getTokenByAddress } from "../../../lib/tokens";
import { formatAmount, parseAmount, formatDeadline, fundingPercent, truncateAddress, explorerUrl } from "../../../lib/utils";
import type { Invoice } from "../../../lib/utils";
import { QRCodeSVG } from "qrcode.react";
import { CopyButton } from "../../../components/CopyButton";
import Tabs from "../../../components/Tabs";
import AuditLogTab from "../../../components/AuditLogTab";

type PayStep = "idle" | "signing" | "submitting" | "confirming" | "done";

const PAY_STEPS: { key: PayStep; label: string }[] = [
  { key: "signing", label: "Signing" },
  { key: "submitting", label: "Submitting" },
  { key: "confirming", label: "Confirming" },
  { key: "done", label: "Done" },
];

const INVOICE_TABS = [
  { id: "details", label: "Details" },
  { id: "audit-log", label: "Audit Log" },
];

export default function InvoicePage() {
  const { id } = useParams<{ id: string }>();
  const invoiceId = Number(id);
  const { publicKey, connect } = useWallet();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [payAmount, setPayAmount] = useState("");
  const [paying, setPaying] = useState(false);
  const [payStep, setPayStep] = useState<PayStep>("idle");
  const [error, setError] = useState("");
  const [txHash, setTxHash] = useState("");
  const [activeTab, setActiveTab] = useState("details");
  const invoiceUrl = typeof window !== "undefined" ? `${window.location.origin}/invoice/${invoiceId}` : "";

  const load = async () => {
    try { setInvoice(await sharpyClient.getInvoice(invoiceId)); }
    catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [invoiceId]);

  const handlePay = async () => {
    if (!publicKey || !payAmount) return;
    setPaying(true); setError(""); setPayStep("signing");
    try {
      await new Promise((r) => setTimeout(r, 1500));
      setPayStep("submitting");
      await new Promise((r) => setTimeout(r, 800));
      setPayStep("confirming");
      const { txHash } = await sharpyClient.pay(publicKey, invoiceId, parseAmount(payAmount));
      setPayStep("done");
      setTxHash(txHash);
      await load();
    } catch (e: any) {
      setError(e.message);
      setPayStep("idle");
    } finally {
      setPaying(false);
    }
  };

  if (loading) return (
    <div className="max-w-2xl mx-auto space-y-4">
      {[...Array(4)].map((_, i) => <div key={i} className="card h-20 animate-pulse" />)}
    </div>
  );
  if (!invoice) return <p className="text-red-400">{error || "Invoice not found."}</p>;

  const total = invoice.amounts.reduce((a, b) => a + b, 0n);
  const pct = fundingPercent(invoice.funded, invoice.amounts);
  const remaining = total - invoice.funded;
  const badgeClass = `badge badge-${invoice.status.toLowerCase()}`;
  const tokenSymbol = getTokenByAddress(invoice.tokens[0] ?? "")?.symbol ?? "tokens";
  const currentStepIndex = PAY_STEPS.findIndex((s) => s.key === payStep);

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="mono text-xs mb-1">Invoice #{invoiceId}</p>
          <h1 className="font-display text-2xl font-bold text-[#F1F2F6]">{formatAmount(total)} {tokenSymbol}</h1>
        </div>
        <span className={badgeClass}>{invoice.status}</span>
      </div>

      <Tabs tabs={INVOICE_TABS} activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === "details" ? (
        <>
          <div className="card p-6 space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-xs text-[#4B5563] mb-1">Creator</p><p className="mono">{truncateAddress(invoice.creator)}</p></div>
              <div><p className="text-xs text-[#4B5563] mb-1">Deadline</p><p className="text-sm text-[#F1F2F6]">{formatDeadline(invoice.deadline)}</p></div>
              <div><p className="text-xs text-[#4B5563] mb-1">Funded</p><p className="text-sm font-semibold text-[#00D4AA]">{formatAmount(invoice.funded)} {tokenSymbol}</p></div>
              <div><p className="text-xs text-[#4B5563] mb-1">Remaining</p><p className="text-sm text-[#F1F2F6]">{formatAmount(remaining)} {tokenSymbol}</p></div>
            </div>

            <div>
              <div className="flex justify-between text-xs text-[#4B5563] mb-2"><span>Funding progress</span><span>{pct}%</span></div>
              <div className="progress-bar"><div className="progress-fill" style={{ width: `${pct}%` }} /></div>
            </div>

            <div>
              <p className="text-xs text-[#4B5563] mb-3">Recipients</p>
              <div className="space-y-2">
                {invoice.recipients.map((addr, i) => (
                  <div key={i} className="flex justify-between items-center py-2 border-b border-[#1E2028] last:border-0">
                    <span className="mono">{truncateAddress(addr)}</span>
                    <span className="text-sm text-[#F1F2F6]">{formatAmount(invoice.amounts[i] ?? 0n)} {tokenSymbol}</span>
                  </div>
                ))}
              </div>
            </div>

            {invoice.escrowEnabled && (
              <div className="flex items-center justify-between bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3">
                <span className="text-xs text-amber-400">Escrow enabled - {invoice.escrowReleaseDelay / 3600}h release delay</span>
                {invoice.status === "Pending" && invoice.funded >= total && (
                  <Link href={`/invoice/${invoiceId}/escrow`} className="text-xs text-[#6C63FF] hover:underline">Manage</Link>
                )}
              </div>
            )}
          </div>

          <div className="card p-6 flex flex-col items-center gap-3">
            <p className="text-xs text-[#4B5563]">Scan to open this invoice</p>
            {invoiceUrl && (
              <div className="bg-white p-3 rounded-xl"><QRCodeSVG value={invoiceUrl} size={160} /></div>
            )}
            <p className="mono text-xs text-[#4B5563] break-all text-center">{invoiceUrl}</p>
          </div>

          {invoice.status === "Pending" && remaining > 0n && (
            <div className="card p-6 space-y-4">
              <h2 className="font-display font-semibold text-[#F1F2F6] text-sm">Make a Payment</h2>
              {!publicKey ? (
                <button onClick={connect} className="text-sm text-[#6C63FF] hover:underline">Connect wallet to pay</button>
              ) : paying ? (
                <div className="flex items-center gap-2 flex-wrap">
                  {PAY_STEPS.map((s, i) => (
                    <div key={s.key} className="flex items-center gap-2">
                      <span className={`text-xs font-medium ${i < currentStepIndex ? "text-[#00D4AA]" : i === currentStepIndex ? "text-[#6C63FF]" : "text-[#4B5563]"}`}>
                        {i === currentStepIndex && i < PAY_STEPS.length - 1 ? `${s.label}...` : s.label}
                      </span>
                      {i < PAY_STEPS.length - 1 && <span className="text-[#4B5563]">-</span>}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex gap-3">
                  <input value={payAmount} onChange={(e) => setPayAmount(e.target.value)} placeholder={`Up to ${formatAmount(remaining)} ${tokenSymbol}`} className="input flex-1" />
                  <button onClick={handlePay} disabled={paying} className="btn-primary px-6">Pay</button>
                </div>
              )}
              {error && <p className="text-sm text-red-400">{error}</p>}
              {txHash && (
                <p className="text-sm text-[#00D4AA]">Payment confirmed. <a href={explorerUrl(NETWORK, txHash, "tx")} target="_blank" rel="noreferrer" className="underline">View transaction</a></p>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="card p-6"><AuditLogTab invoiceId={invoiceId} /></div>
      )}

      <div className="flex gap-4 text-xs text-[#4B5563]">
        <Link href={`/verify/${invoiceId}`} className="hover:text-[#9CA3AF] transition-colors">Public Verification</Link>
        {invoice.escrowEnabled && <Link href={`/invoice/${invoiceId}/escrow`} className="hover:text-[#9CA3AF] transition-colors">Escrow</Link>}
        <Link href={`/invoice/${invoiceId}/recurring`} className="hover:text-[#9CA3AF] transition-colors">Recurring Chain</Link>
        <Link href={`/pay/${invoiceId}`} className="hover:text-[#9CA3AF] transition-colors">Share Payment Link</Link>
      </div>
    </div>
  );
}