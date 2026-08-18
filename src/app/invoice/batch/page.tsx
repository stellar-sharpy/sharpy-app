"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useWallet } from "../../../components/WalletProvider";
import { useToast } from "../../../components/Toast";
import { sharpyClient, DEFAULT_TOKEN, NETWORK } from "../../../lib/client";
import { parseAmount, deadlineFromDays, isValidAddress } from "../../../lib/utils";
import TokenSelector from "../../../components/TokenSelector";
import { Token, getTokenAddress, TOKENS } from "../../../lib/tokens";

const MAX_INVOICES = 10;

interface RecipientRow {
  /** Comma-separated Stellar addresses */
  addresses: string;
  /** Comma-separated amounts, one per address */
  amounts: string;
}

interface InvoiceRow {
  id: string;
  recipients: RecipientRow;
  tokenAddress: string;
  selectedToken: Token;
  deadlineDays: number;
}

function makeInvoiceRow(): InvoiceRow {
  return {
    id: Math.random().toString(36).slice(2),
    recipients: { addresses: "", amounts: "" },
    tokenAddress: DEFAULT_TOKEN,
    selectedToken: TOKENS[0],
    deadlineDays: 7,
  };
}

function parseRecipients(
  addresses: string,
  amounts: string
): { address: string; amount: bigint }[] | string {
  const addrs = addresses
    .split(",")
    .map((a) => a.trim())
    .filter(Boolean);
  const amts = amounts
    .split(",")
    .map((a) => a.trim())
    .filter(Boolean);

  if (addrs.length === 0) return "At least one recipient address is required.";
  if (addrs.length !== amts.length)
    return `Address count (${addrs.length}) and amount count (${amts.length}) must match.`;

  for (const addr of addrs) {
    if (!isValidAddress(addr)) return `Invalid Stellar address: ${addr}`;
  }
  for (const amt of amts) {
    if (!amt || isNaN(Number(amt)) || Number(amt) <= 0)
      return `Invalid amount: "${amt}". All amounts must be positive numbers.`;
  }

  return addrs.map((address, i) => ({
    address,
    amount: parseAmount(amts[i]),
  }));
}

export default function BatchCreateInvoice() {
  const { publicKey, signerReady, connect } = useWallet();
  const { toast } = useToast();
  const router = useRouter();

  const [invoices, setInvoices] = useState<InvoiceRow[]>([makeInvoiceRow()]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [createdIds, setCreatedIds] = useState<number[]>([]);

  // ── Mutators ────────────────────────────────────────────────────────────────

  const addInvoice = () => {
    if (invoices.length >= MAX_INVOICES) return;
    setInvoices((prev) => [...prev, makeInvoiceRow()]);
  };

  const removeInvoice = (id: string) => {
    setInvoices((prev) => prev.filter((inv) => inv.id !== id));
  };

  const updateInvoice = <K extends keyof InvoiceRow>(
    id: string,
    field: K,
    value: InvoiceRow[K]
  ) => {
    setInvoices((prev) =>
      prev.map((inv) => (inv.id === id ? { ...inv, [field]: value } : inv))
    );
  };

  const updateRecipients = (
    id: string,
    field: keyof RecipientRow,
    value: string
  ) => {
    setInvoices((prev) =>
      prev.map((inv) =>
        inv.id === id
          ? { ...inv, recipients: { ...inv.recipients, [field]: value } }
          : inv
      )
    );
  };

  // ── Submit ───────────────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!publicKey) return;
    setError("");

    // Validate all rows first
    const parsed: { recipients: { address: string; amount: bigint }[]; token: string; deadline: number }[] = [];
    for (let i = 0; i < invoices.length; i++) {
      const inv = invoices[i];
      const result = parseRecipients(inv.recipients.addresses, inv.recipients.amounts);
      if (typeof result === "string") {
        setError(`Invoice ${i + 1}: ${result}`);
        return;
      }
      if (inv.deadlineDays < 1) {
        setError(`Invoice ${i + 1}: Deadline must be at least 1 day.`);
        return;
      }
      parsed.push({
        recipients: result,
        token: inv.tokenAddress,
        deadline: deadlineFromDays(inv.deadlineDays),
      });
    }

    setLoading(true);
    try {
      const { invoiceIds, txHash } = await sharpyClient.createBatch(publicKey, parsed);
      setCreatedIds(invoiceIds);
      toast(
        `${invoiceIds.length} invoice${invoiceIds.length !== 1 ? "s" : ""} created: #${invoiceIds.join(", #")}`,
        "success",
        8000
      );
      // Navigate to dashboard after a short delay so the toast is visible
      setTimeout(() => router.push("/dashboard"), 1200);
    } catch (err: any) {
      const msg = err.message ?? "Transaction failed.";
      setError(msg);
      toast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  // ── Gate: wallet not connected ───────────────────────────────────────────────

  if (!publicKey) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <p className="text-[#6B7280]">Connect your wallet to create batch invoices.</p>
        <button onClick={connect} className="btn-primary">
          Connect Wallet
        </button>
      </div>
    );
  }

  if (!signerReady) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <p className="text-[#6B7280]">Wallet session expired. Please reconnect to continue.</p>
        <button onClick={connect} className="btn-primary">
          Reconnect Wallet
        </button>
      </div>
    );
  }

  // ── Success state ────────────────────────────────────────────────────────────

  if (createdIds.length > 0) {
    return (
      <div className="max-w-2xl mx-auto animate-fade-up">
        <div className="card p-8 flex flex-col items-center gap-5 text-center">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center animate-success-pulse"
            style={{ background: "rgba(0,212,170,0.12)" }}
          >
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <path
                d="M6 14l5 5 11-11"
                stroke="#00D4AA"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <div>
            <h2 className="font-display text-xl font-bold mb-1" style={{ color: "var(--text)" }}>
              {createdIds.length} Invoice{createdIds.length !== 1 ? "s" : ""} Created
            </h2>
            <p className="text-sm" style={{ color: "var(--muted)" }}>
              All invoices were submitted in a single transaction.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 justify-center">
            {createdIds.map((id) => (
              <Link
                key={id}
                href={`/invoice/${id}`}
                className="px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
                style={{
                  background: "var(--surface-2)",
                  border: "1px solid var(--border)",
                  color: "var(--primary)",
                }}
              >
                Invoice #{id}
              </Link>
            ))}
          </div>

          <Link href="/dashboard" className="btn-primary mt-2">
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // ── Main form ────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-2xl mx-auto animate-fade-up">
      {/* Page header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <Link
            href="/invoice/new"
            className="text-sm transition-colors"
            style={{ color: "var(--muted)" }}
          >
            ← Single Invoice
          </Link>
        </div>
        <h1 className="font-display text-2xl font-bold text-[#F1F2F6]">
          Batch Invoice Creation
        </h1>
        <p className="text-sm text-[#6B7280] mt-1">
          Create up to {MAX_INVOICES} invoices in a single transaction. Each invoice can have
          multiple recipients, its own token, and its own deadline.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Invoice rows */}
        {invoices.map((inv, index) => (
          <div key={inv.id} className="card p-6 space-y-4">
            {/* Row header */}
            <div className="flex items-center justify-between">
              <h2 className="font-display font-semibold text-sm" style={{ color: "var(--text)" }}>
                Invoice {index + 1}
              </h2>
              <div className="flex items-center gap-3">
                <TokenSelector
                  value={inv.tokenAddress}
                  onChange={(addr, token) => {
                    updateInvoice(inv.id, "tokenAddress", addr);
                    updateInvoice(inv.id, "selectedToken", token);
                  }}
                />
                {invoices.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeInvoice(inv.id)}
                    title="Remove invoice"
                    className="text-[#4B5563] hover:text-[#EF4444] transition-colors text-lg leading-none px-1"
                    aria-label={`Remove invoice ${index + 1}`}
                  >
                    ×
                  </button>
                )}
              </div>
            </div>

            {/* Recipients — comma-separated addresses */}
            <div className="space-y-2">
              <label className="text-xs font-medium" style={{ color: "var(--muted-2)" }}>
                Recipient addresses{" "}
                <span className="font-normal" style={{ color: "var(--muted)" }}>
                  (comma-separated)
                </span>
              </label>
              <textarea
                value={inv.recipients.addresses}
                onChange={(e) =>
                  updateRecipients(inv.id, "addresses", e.target.value)
                }
                placeholder="G...address1, G...address2"
                rows={2}
                className="input font-mono text-xs resize-none"
                aria-label={`Invoice ${index + 1} recipient addresses`}
              />
            </div>

            {/* Amounts — comma-separated */}
            <div className="space-y-2">
              <label className="text-xs font-medium" style={{ color: "var(--muted-2)" }}>
                Amounts in {inv.selectedToken.symbol}{" "}
                <span className="font-normal" style={{ color: "var(--muted)" }}>
                  (one per address, comma-separated)
                </span>
              </label>
              <input
                type="text"
                value={inv.recipients.amounts}
                onChange={(e) =>
                  updateRecipients(inv.id, "amounts", e.target.value)
                }
                placeholder={`e.g. 10, 25.5, 100`}
                className="input"
                aria-label={`Invoice ${index + 1} amounts`}
              />
            </div>

            {/* Deadline */}
            <div className="flex items-center gap-3">
              <label className="text-xs font-medium shrink-0" style={{ color: "var(--muted-2)" }}>
                Deadline
              </label>
              <input
                type="number"
                min={1}
                value={inv.deadlineDays}
                onChange={(e) =>
                  updateInvoice(inv.id, "deadlineDays", Number(e.target.value))
                }
                className="input w-24"
                aria-label={`Invoice ${index + 1} deadline days`}
              />
              <span className="text-sm" style={{ color: "var(--muted)" }}>
                days from now
              </span>
            </div>
          </div>
        ))}

        {/* Add invoice button */}
        {invoices.length < MAX_INVOICES && (
          <button
            type="button"
            onClick={addInvoice}
            className="w-full card p-4 flex items-center justify-center gap-2 text-sm transition-colors hover:border-[var(--border-hover)]"
            style={{ color: "var(--primary)" }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M8 2v12M2 8h12"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
            Add Invoice{" "}
            <span style={{ color: "var(--muted)" }}>
              ({invoices.length}/{MAX_INVOICES})
            </span>
          </button>
        )}

        {/* Error banner */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full py-3 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <span className="btn-spinner" />
              Creating {invoices.length} invoice{invoices.length !== 1 ? "s" : ""}…
            </>
          ) : (
            <>
              Create {invoices.length} Invoice{invoices.length !== 1 ? "s" : ""}
            </>
          )}
        </button>

        {/* Explainer */}
        <p className="text-xs text-center" style={{ color: "var(--muted)" }}>
          All invoices are submitted in a single Stellar transaction, saving fees and
          confirming atomically.
        </p>
      </form>
    </div>
  );
}
