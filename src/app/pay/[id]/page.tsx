"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useWallet } from "../../../components/WalletProvider";
import { sharpyClient, NETWORK } from "../../../lib/client";
import {
  formatAmount,
  parseAmount,
  formatDeadline,
  fundingPercent,
  truncateAddress,
  explorerUrl,
  isExpired,
} from "../../../lib/utils";
import type { Invoice } from "../../../lib/utils";
import { ExactStellarScheme } from "@x402/stellar/exact/client";
import { signAuthEntry } from "@stellar/freighter-api";

const FACILITATOR_URL = "https://channels.openzeppelin.com/x402/testnet";
const NETWORK_CAIP2 = `stellar:${NETWORK === "testnet" ? "testnet" : "pubnet"}`;

type PayStep = "idle" | "signing" | "submitting" | "confirming" | "done";
type PayMode = "wallet" | "x402";

export default function PayPage() {
  const { id } = useParams<{ id: string }>();
  const invoiceId = Number(id);
  const { publicKey, connect } = useWallet();
  const router = useRouter();

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [payAmount, setPayAmount] = useState("");
  const [paying, setPaying] = useState(false);
  const [step, setStep] = useState<PayStep>("idle");
  const [txHash, setTxHash] = useState("");
  const [mode, setMode] = useState<PayMode>("wallet");
  const [x402Receipt, setX402Receipt] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  const load = async () => {
    try {
      setInvoice(await sharpyClient.getInvoice(invoiceId));
    } catch {
      setError("Invoice not found.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [invoiceId]);

  // Standard wallet pay
  const handleWalletPay = async () => {
    if (!publicKey || !payAmount) return;
    setError(""); setPaying(true);
    try {
      setStep("signing");
      await new Promise((r) => setTimeout(r, 400));
      setStep("submitting");
      const { txHash } = await sharpyClient.pay(publicKey, invoiceId, parseAmount(payAmount));
      setStep("confirming");
      await new Promise((r) => setTimeout(r, 800));
      setStep("done");
      setTxHash(txHash);
      await load();
    } catch (e: any) {
      setError(e.message ?? "Payment failed.");
      setStep("idle");
    } finally {
      setPaying(false);
    }
  };

  // x402 agent/HTTP pay
  const handleX402Pay = async () => {
    if (!publicKey || !payAmount) return;
    setError(""); setPaying(true);
    try {
      setStep("signing");

      // 1. Fetch x402 payment requirements from our API
      const reqRes = await fetch(`/api/x402/${invoiceId}`);
      const requirements = await reqRes.json();
      if (reqRes.status !== 402) throw new Error("Unexpected response from payment endpoint");
      const accept = requirements.accepts?.[0];
      if (!accept) throw new Error("No payment scheme available");

      // 2. Build Freighter signer conforming to ClientStellarSigner interface
      const freighterSigner = {
        address: publicKey,
        signAuthEntry: async (entryXdr: string) => {
          const result = await signAuthEntry(entryXdr, { networkPassphrase: accept.network });
          if ("error" in result) throw new Error(String(result.error));
          const buf = result as unknown as Buffer | null;
          if (!buf) throw new Error("Auth entry signing returned null");
          return {
            signedAuthEntry: Buffer.isBuffer(buf) ? buf.toString("base64") : String(buf),
            signerAddress: publicKey,
          };
        },
      };

      // 3. Build signed payment payload via ExactStellarScheme
      const scheme = new ExactStellarScheme(freighterSigner, {
        url: process.env.NEXT_PUBLIC_RPC_URL,
      });

      const paymentRequirements = {
        ...accept,
        amount: parseAmount(payAmount).toString(),
        network: NETWORK_CAIP2,
      };

      const payload = await scheme.createPaymentPayload(2, paymentRequirements);

      setStep("submitting");

      // 4. Submit to our API route with X-Payment header
      const settleRes = await fetch(`/api/x402/${invoiceId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Payment": JSON.stringify(payload),
        },
      });

      if (!settleRes.ok) {
        const err = await settleRes.json();
        throw new Error(err.error ?? "Settlement failed");
      }

      const result = await settleRes.json();
      setStep("confirming");
      await new Promise((r) => setTimeout(r, 600));
      setStep("done");
      setX402Receipt(result.receipt);
      await load();
    } catch (e: any) {
      setError(e.message ?? "x402 payment failed.");
      setStep("idle");
    } finally {
      setPaying(false);
    }
  };

  const copyApiUrl = () => {
    navigator.clipboard.writeText(`${window.location.origin}/api/x402/${invoiceId}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="max-w-lg mx-auto space-y-4 pt-10">
        {[...Array(4)].map((_, i) => <div key={i} className="card h-16 animate-pulse" />)}
      </div>
    );
  }

  if (error && !invoice) {
    return (
      <div className="max-w-lg mx-auto text-center py-32">
        <p className="text-red-400 mb-4">{error}</p>
        <Link href="/" className="text-[#6C63FF] text-sm hover:underline">Back to home</Link>
      </div>
    );
  }

  if (!invoice) return null;

  const total = invoice.amounts.reduce((a, b) => a + b, 0n);
  const remaining = total - invoice.funded;
  const pct = fundingPercent(invoice.funded, invoice.amounts);
  const expired = isExpired(invoice.deadline);
  const canPay = invoice.status === "Pending" && remaining > 0n && !expired;
  const stepLabels: Record<PayStep, string> = {
    idle: "", signing: "Signing...", submitting: "Submitting...", confirming: "Confirming...", done: "Done!"
  };

  return (
    <div className="max-w-lg mx-auto space-y-5 pt-4">

      {/* Header */}
      <div className="text-center space-y-1">
        <p className="text-xs uppercase tracking-widest" style={{ color: "var(--muted)" }}>Payment Request</p>
        <h1 className="font-display text-3xl font-bold" style={{ color: "var(--text)" }}>
          {formatAmount(total)} USDC
        </h1>
        <p className="text-sm" style={{ color: "var(--muted)" }}>Invoice #{invoiceId}</p>
      </div>

      {/* Invoice card */}
      <div className="card p-6 space-y-4">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs mb-1" style={{ color: "var(--muted)" }}>From</p>
            <p className="mono">{truncateAddress(invoice.creator)}</p>
          </div>
          <div>
            <p className="text-xs mb-1" style={{ color: "var(--muted)" }}>Due</p>
            <p style={{ color: "var(--text)" }}>{formatDeadline(invoice.deadline)}</p>
          </div>
          <div>
            <p className="text-xs mb-1" style={{ color: "var(--muted)" }}>Funded</p>
            <p className="font-semibold text-[#00D4AA]">{formatAmount(invoice.funded)} USDC</p>
          </div>
          <div>
            <p className="text-xs mb-1" style={{ color: "var(--muted)" }}>Remaining</p>
            <p style={{ color: "var(--text)" }}>{formatAmount(remaining)} USDC</p>
          </div>
        </div>

        <div>
          <div className="flex justify-between text-xs mb-1.5" style={{ color: "var(--muted)" }}>
            <span>Progress</span><span>{pct}%</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${pct}%` }} />
          </div>
        </div>

        <div>
          <p className="text-xs mb-2" style={{ color: "var(--muted)" }}>Split between</p>
          {invoice.recipients.map((addr: string, i: number) => (
            <div key={i} className="flex justify-between text-sm py-1.5 border-b last:border-0" style={{ borderColor: "var(--border)" }}>
              <span className="mono">{truncateAddress(addr)}</span>
              <span style={{ color: "var(--text)" }}>{formatAmount(invoice.amounts[i] ?? 0n)} USDC</span>
            </div>
          ))}
        </div>

        {invoice.escrowEnabled && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2">
            <p className="text-xs text-amber-400">Escrow protected — {invoice.escrowReleaseDelay / 3600}h release delay</p>
          </div>
        )}

        {invoice.status !== "Pending" && (
          <div className={`badge badge-${invoice.status.toLowerCase()} text-center w-full py-2`}>
            Invoice {invoice.status}
          </div>
        )}
        {expired && invoice.status === "Pending" && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
            <p className="text-xs text-red-400">This invoice has expired</p>
          </div>
        )}
      </div>

      {/* Pay section */}
      {canPay && (
        <div className="card p-6 space-y-4">
          {step === "done" ? (
            <div className="text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto text-xl text-[#00D4AA]">✓</div>
              <p className="font-display font-semibold text-[#00D4AA]">Payment confirmed!</p>
              {txHash && (
                <a href={explorerUrl(NETWORK, txHash, "tx")} target="_blank" rel="noreferrer"
                  className="text-xs text-[#6C63FF] underline block">View on Stellar Explorer</a>
              )}
              {x402Receipt && (
                <p className="text-xs mono" style={{ color: "var(--muted)" }}>Receipt: {JSON.stringify(x402Receipt).slice(0, 60)}...</p>
              )}
              <button onClick={() => router.push(`/invoice/${invoiceId}`)} className="btn-ghost text-sm w-full">
                View Invoice
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Mode toggle */}
              <div className="flex rounded-xl overflow-hidden border" style={{ borderColor: "var(--border)" }}>
                <button onClick={() => setMode("wallet")}
                  className={`flex-1 py-2 text-sm font-medium transition-colors ${mode === "wallet" ? "bg-[#6C63FF] text-white" : ""}`}
                  style={mode !== "wallet" ? { color: "var(--muted)" } : {}}>
                  Wallet
                </button>
                <button onClick={() => setMode("x402")}
                  className={`flex-1 py-2 text-sm font-medium transition-colors ${mode === "x402" ? "bg-[#6C63FF] text-white" : ""}`}
                  style={mode !== "x402" ? { color: "var(--muted)" } : {}}>
                  x402 / Agent
                </button>
              </div>

              {mode === "x402" && (
                <div className="bg-[#6C63FF]/5 border border-[#6C63FF]/20 rounded-xl px-4 py-3 space-y-2">
                  <p className="text-xs font-medium" style={{ color: "var(--text)" }}>x402 Payment Endpoint</p>
                  <p className="text-xs" style={{ color: "var(--muted)" }}>
                    AI agents and HTTP clients can pay this invoice programmatically via the x402 protocol.
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="text-xs bg-[#111318] px-2 py-1 rounded font-mono flex-1 truncate" style={{ color: "var(--muted-2)" }}>
                      GET /api/x402/{invoiceId}
                    </code>
                    <button onClick={copyApiUrl} className="text-xs text-[#6C63FF] hover:underline shrink-0">
                      {copied ? "Copied!" : "Copy URL"}
                    </button>
                  </div>
                </div>
              )}

              {!publicKey ? (
                <div className="text-center space-y-3">
                  <p className="text-sm" style={{ color: "var(--muted)" }}>Connect your Freighter wallet to pay.</p>
                  <button onClick={connect} className="btn-primary w-full py-3">Connect Wallet</button>
                </div>
              ) : (
                <div className="space-y-3">
                  <label className="text-sm font-medium" style={{ color: "var(--text)" }}>Amount (USDC)</label>
                  <input
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    placeholder={`Up to ${formatAmount(remaining)}`}
                    className="input"
                    disabled={paying}
                  />

                  {error && <p className="text-xs text-red-400">{error}</p>}

                  {paying && (
                    <div className="flex items-center justify-between text-xs" style={{ color: "var(--muted)" }}>
                      {(["signing", "submitting", "confirming"] as const).map((s, i) => (
                        <div key={s} className="flex items-center gap-1">
                          <div className={`w-1.5 h-1.5 rounded-full ${
                            step === s ? "bg-[#6C63FF] animate-pulse" :
                            ["signing","submitting","confirming"].indexOf(step) > i ? "bg-[#00D4AA]" :
                            "bg-[var(--border)]"
                          }`} />
                          <span className={step === s ? "text-[#6C63FF]" : ""}>{s}</span>
                          {i < 2 && <span className="mx-1">→</span>}
                        </div>
                      ))}
                    </div>
                  )}

                  <button
                    onClick={mode === "wallet" ? handleWalletPay : handleX402Pay}
                    disabled={paying || !payAmount}
                    className="btn-primary w-full py-3"
                  >
                    {paying
                      ? (stepLabels[step] || "Processing...")
                      : mode === "x402"
                        ? `Pay via x402 ${payAmount ? `(${payAmount} USDC)` : ""}`
                        : `Pay ${payAmount ? `${payAmount} USDC` : ""}`
                    }
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* x402 agent info */}
      <div className="card p-4 space-y-2">
        <p className="text-xs font-medium" style={{ color: "var(--text)" }}>For AI Agents & APIs</p>
        <p className="text-xs" style={{ color: "var(--muted)" }}>
          This invoice supports the x402 payment protocol. Any HTTP client or AI agent can pay by sending a{" "}
          <code className="font-mono">GET</code> request to the endpoint below and following the 402 response.
        </p>
        <div className="flex items-center gap-2">
          <code className="text-xs mono flex-1 truncate">{typeof window !== "undefined" ? `${window.location.origin}/api/x402/${invoiceId}` : `/api/x402/${invoiceId}`}</code>
          <button onClick={copyApiUrl} className="text-xs text-[#6C63FF] hover:underline shrink-0">
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      </div>

      <div className="text-center text-xs" style={{ color: "var(--muted)" }}>
        <p>Powered by <Link href="/" className="text-[#6C63FF] hover:underline">Sharpy</Link> on Stellar</p>
        <Link href={`/verify/${invoiceId}`} className="hover:underline mt-1 block">Verify on-chain</Link>
      </div>
    </div>
  );
}
