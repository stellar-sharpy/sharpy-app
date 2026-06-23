"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useWallet } from "@/components/WalletProvider";
import { sharpyClient } from "@/lib/client";
import {
  formatAmount,
  truncateAddress,
  statusColor,
  fundingPercent,
  type Invoice,
} from "@/lib/utils";

const CANCEL_STEPS = [
  { label: "Confirm", icon: "🗑️" },
  { label: "Signing", icon: "✍️" },
  { label: "Submitting", icon: "⛓️" },
  { label: "Confirming", icon: "🔎" },
  { label: "Done", icon: "✅" },
];

export default function CancelInvoicePage() {
  const { id } = useParams<{ id: string }>();
  const invoiceId = id;
  const router = useRouter();
  const { publicKey } = useWallet();

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [cancelStep, setCancelStep] = useState("idle");
  const [error, setError] = useState("");
  const [txHash, setTxHash] = useState("");
  const [confirmText, setConfirmText] = useState("");

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

  useEffect(() => {
    load();
  }, [invoiceId]);

  const handleCancel = async () => {
    if (!publicKey || !invoice) return;
    if (confirmText !== "CANCEL") {
      setError('Please type "CANCEL" to confirm');
      return;
    }

    setCancelling(true);
    setError("");
    setCancelStep("signing");

    try {
      // Visual feedback for wallet popup
      await new Promise((r) => setTimeout(r, 1500));
      setCancelStep("submitting");
      await new Promise((r) => setTimeout(r, 800));
      setCancelStep("confirming");

      // Call SDK cancel method
      // Note: If the SDK method name differs (e.g., cancel, cancelInvoice, revokeInvoice),
      // update this line accordingly.
      const result = await (sharpyClient as any).cancelInvoice?.(publicKey, invoiceId) ??
                     await (sharpyClient as any).cancel?.(publicKey, invoiceId);

      setCancelStep("done");
      if (result?.txHash) {
        setTxHash(result.txHash);
      }
      await load();
    } catch (e: any) {
      setError(e.message);
      setCancelStep("idle");
    } finally {
      setCancelling(false);
    }
  };

  const currentStepIndex = CANCEL_STEPS.findIndex((s) =>
    s.label.toLowerCase() === cancelStep.toLowerCase()
  );
  const isCreator = publicKey && invoice?.creator === publicKey;
  const canCancel =
    invoice &&
    invoice.status === "Pending" &&
    isCreator &&
    invoice.funded === 0n;

  if (loading) {
    return (
      <main className="max-w-2xl mx-auto px-4 py-12">
        <div className="card p-8 space-y-4 animate-pulse">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-4 bg-[var(--surface-2)] rounded w-full" />
          ))}
        </div>
      </main>
    );
  }

  if (!invoice) {
    return (
      <main className="max-w-2xl mx-auto px-4 py-12">
        <div className="card p-8 text-center">
          <p className="text-[var(--muted)]">{error || "Invoice not found."}</p>
          <Link href="/dashboard" className="btn-primary mt-4 inline-block">
            Back to Dashboard
          </Link>
        </div>
      </main>
    );
  }

  const total = invoice.amounts.reduce((a, b) => a + b, 0n);
  const pct = fundingPercent(invoice.funded, invoice.amounts);
  const tokenSymbol = "USDC"; // Adjust based on your token lookup

  return (
    <main className="max-w-2xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="mb-8">
        <Link
          href={`/invoice/${invoiceId}`}
          className="text-sm text-[var(--muted)] hover:text-[var(--text)] transition-colors"
        >
          ← Back to Invoice
        </Link>
        <h1 className="text-3xl font-bold font-[family-name:var(--font-display)] mt-4">
          Cancel Invoice
        </h1>
        <p className="text-[var(--muted)] mt-1">
          Invoice #{invoiceId}
        </p>
      </div>

      {/* Invoice Summary Card */}
      <div className="card p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm text-[var(--muted)]">Amount</p>
            <p className="text-xl font-semibold">
              {formatAmount(total)} {tokenSymbol}
            </p>
          </div>
          <span className={`badge ${statusColor(invoice.status)}`}>
            {invoice.status}
          </span>
        </div>

        <div className="progress-bar mb-4">
          <div
            className="progress-fill"
            style={{ width: `${pct}%` }}
          />
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-[var(--muted)]">Creator</p>
            <p className="mono">{truncateAddress(invoice.creator)}</p>
          </div>
          <div>
            <p className="text-[var(--muted)]">Funded</p>
            <p className="mono">
              {formatAmount(invoice.funded)} {tokenSymbol}
            </p>
          </div>
        </div>
      </div>

      {/* Status Messages */}
      {invoice.status === "Cancelled" && (
        <div className="card p-6 mb-6 bg-red-500/5 border-red-500/20">
          <p className="text-red-500 font-medium">
            This invoice has already been cancelled.
          </p>
          <Link href={`/invoice/${invoiceId}`} className="btn-primary mt-4 inline-block">
            View Invoice
          </Link>
        </div>
      )}

      {invoice.status !== "Pending" && invoice.status !== "Cancelled" && (
        <div className="card p-6 mb-6">
          <p className="text-[var(--muted)]">
            Only pending invoices can be cancelled. This invoice is currently{" "}
            <strong>{invoice.status}</strong>.
          </p>
          <Link href={`/invoice/${invoiceId}`} className="btn-primary mt-4 inline-block">
            View Invoice
          </Link>
        </div>
      )}

      {invoice.funded > 0n && (
        <div className="card p-6 mb-6 bg-amber-500/5 border-amber-500/20">
          <p className="text-amber-500 font-medium">
            Cannot cancel: invoice has received funding
          </p>
          <p className="text-sm text-[var(--muted)] mt-1">
            {formatAmount(invoice.funded)} {tokenSymbol} has already been paid toward this invoice.
            Cancel is only available for unfunded invoices.
          </p>
          <Link href={`/invoice/${invoiceId}`} className="btn-primary mt-4 inline-block">
            View Invoice
          </Link>
        </div>
      )}

      {!isCreator && publicKey && (
        <div className="card p-6 mb-6">
          <p className="text-[var(--muted)]">
            Only the invoice creator can cancel this invoice. You are connected as{" "}
            <span className="mono">{truncateAddress(publicKey)}</span>.
          </p>
          <Link href={`/invoice/${invoiceId}`} className="btn-primary mt-4 inline-block">
            View Invoice
          </Link>
        </div>
      )}

      {!publicKey && (
        <div className="card p-6 mb-6 text-center">
          <p className="text-[var(--muted)] mb-4">
            Connect your wallet to cancel this invoice
          </p>
          <p className="text-sm text-[var(--muted-2)]">
            Only the creator ({truncateAddress(invoice.creator)}) can perform this action
          </p>
        </div>
      )}

      {/* Cancel Form */}
      {canCancel && (
        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-2 text-red-500">
            ⚠️ Cancel this invoice?
          </h2>
          <p className="text-[var(--muted)] text-sm mb-6">
            This action cannot be undone. The invoice will be marked as cancelled
            and recipients will no longer be able to pay.
          </p>

          {cancelling ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                {CANCEL_STEPS.map((s, i) => (
                  <div key={s.label} className="flex flex-col items-center flex-1">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm mb-1 transition-colors ${
                        i < currentStepIndex
                          ? "bg-green-500 text-white"
                          : i === currentStepIndex
                          ? "bg-[var(--primary)] text-white"
                          : "bg-[var(--surface-2)] text-[var(--muted)]"
                      }`}
                    >
                      {i < currentStepIndex ? "✓" : s.icon}
                    </div>
                    <span className="text-[10px] text-[var(--muted)] text-center">
                      {i === currentStepIndex && i < CANCEL_STEPS.length - 1
                        ? `${s.label}…`
                        : s.label}
                    </span>
                    {i < CANCEL_STEPS.length - 1 && (
                      <div className="hidden sm:block absolute w-full h-px top-4 left-1/2 -z-10" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Type <strong>CANCEL</strong> to confirm
                </label>
                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="CANCEL"
                  className="input"
                  disabled={cancelling}
                />
              </div>

              <div className="flex gap-3">
                <Link
                  href={`/invoice/${invoiceId}`}
                  className="btn-ghost flex-1 text-center"
                >
                  Keep Invoice
                </Link>
                <button
                  onClick={handleCancel}
                  disabled={confirmText !== "CANCEL"}
                  className="btn-primary flex-1 bg-red-500 hover:bg-red-600 disabled:opacity-40"
                >
                  Cancel Invoice
                </button>
              </div>
            </div>
          )}

          {error && (
            <p className="text-red-500 text-sm mt-4">{error}</p>
          )}

          {txHash && (
            <div className="mt-4 p-4 bg-green-500/5 border border-green-500/20 rounded-xl">
              <p className="text-green-500 text-sm font-medium">
                Invoice cancelled successfully
              </p>
              <a
                href={`https://stellar.expert/explorer/testnet/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-[var(--primary)] hover:underline mt-1 inline-block"
              >
                View transaction →
              </a>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="mt-8 flex gap-4 text-sm">
        <Link href={`/invoice/${invoiceId}`} className="text-[var(--muted)] hover:text-[var(--text)]">
          Invoice Details
        </Link>
        {invoice.escrowEnabled && (
          <Link href={`/invoice/${invoiceId}/escrow`} className="text-[var(--muted)] hover:text-[var(--text)]">
            Escrow
          </Link>
        )}
        {invoice.recurringParent && (
          <Link href={`/invoice/${invoiceId}/recurring`} className="text-[var(--muted)] hover:text-[var(--text)]">
            Recurring Chain
          </Link>
        )}

        {/* Footer links */}
       <div className="mt-8 flex gap-4 text-sm">
         <Link href={`/verify/${invoiceId}`} className="text-[var(--muted)] hover:text-[var(--text)]">
           Public Verification
         </Link>
         {invoice.escrowEnabled && (
           <Link href={`/invoice/${invoiceId}/escrow`} className="text-[var(--muted)] hover:text-[var(--text)]">
             Escrow
           </Link>
         )}
         {invoice.recurringParent && (
           <Link href={`/invoice/${invoiceId}/recurring`} className="text-[var(--muted)] hover:text-[var(--text)]">
             Recurring Chain
           </Link>
         )}
+        {/* Only show cancel link to creator for pending unfunded invoices */}
+        {isCreator && invoice.status === "Pending" && invoice.funded === 0n && (
+          <Link href={`/invoice/${invoiceId}/cancel`} className="text-red-500 hover:text-red-400">
+            Cancel Invoice
+          </Link>
+        )}
       </div>
       
      </div>
    </main>
  );
}