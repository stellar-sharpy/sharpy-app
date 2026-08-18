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
import PayoutPreview from "../../../components/PayoutPreview";

const FACILITATOR_URL = "https://channels.openzeppelin.com/x402/testnet";
const NETWORK_CAIP2 = `stellar:${NETWORK === "testnet" ? "testnet" : "pubnet"}`;

type PayStep = "idle" | "signing" | "submitting" | "confirming" | "done";
type PayMode = "wallet" | "x402" | "cctp";

// CCTP source chain configs
const CCTP_CHAINS = [
  { name: "Arbitrum", domain: 3, usdcAddress: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831" },
  { name: "Ethereum", domain: 0, usdcAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48" },
  { name: "Base",     domain: 6, usdcAddress: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" },
] as const;

const CCTP_FORWARDER_TESTNET = "CA66Q2WFBND6V4UEB7RD4SAXSVIWMD6RA4X3U32ELVFGXV5PJK4T4VSZ";
const CCTP_FORWARDER_MAINNET = "CBZL2IH7F6BIDAA3WBNXYKIXSATJGMSW7K5P5MJ6STX5RXN47TZJDF5T";

type CctpStatus = "idle" | "polling" | "attested" | "completing" | "done";

export default function PayPage() {
  const { id } = useParams<{ id: string }>();
  const invoiceId = Number(id);
  const { publicKey, signerReady, connect } = useWallet();
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

  // CCTP state
  const [cctpChainIdx, setCctpChainIdx] = useState(0);
  const [cctpEvmTxHash, setCctpEvmTxHash] = useState("");
  const [cctpStatus, setCctpStatus] = useState<CctpStatus>("idle");
  const [cctpCompleteTxHash, setCctpCompleteTxHash] = useState("");
  const [cctpError, setCctpError] = useState("");
  const [cctpHookData, setCctpHookData] = useState("");
  const [hookDataCopied, setHookDataCopied] = useState(false);
  const [forwarderCopied, setForwarderCopied] = useState(false);

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

  // Build hook data whenever payer address is available
  useEffect(() => {
    if (publicKey) {
      try {
        const hd = sharpyClient.buildCctpHookData(publicKey);
        setCctpHookData(hd);
      } catch {
        setCctpHookData("");
      }
    }
  }, [publicKey]);

  const cctpForwarder = NETWORK === "testnet" ? CCTP_FORWARDER_TESTNET : CCTP_FORWARDER_MAINNET;

  // Standard wallet pay
  const handleWalletPay = async () => {
    if (!publicKey || !signerReady || !payAmount) return;
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
    if (!publicKey || !signerReady || !payAmount) return;
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
          if ("error" in result && result.error) throw new Error(String(result.error));
          const signed = result.signedAuthEntry;
          if (!signed) throw new Error("Auth entry signing returned null");
          const base64 = Buffer.isBuffer(signed)
            ? signed.toString("base64")
            : Buffer.from(signed as unknown as Uint8Array).toString("base64");
          return {
            signedAuthEntry: base64,
            signerAddress: result.signerAddress ?? publicKey,
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

  // CCTP: poll attestation then complete inbound
  const handleCctpComplete = async () => {
    if (!publicKey || !signerReady || !cctpEvmTxHash.trim()) return;
    setCctpError("");
    const chain = CCTP_CHAINS[cctpChainIdx];

    try {
      // Step 1: poll for Circle attestation
      setCctpStatus("polling");
      const { message, attestation } = await sharpyClient.pollCctpAttestation(
        cctpEvmTxHash.trim(),
        chain.domain,
        { intervalMs: 5_000, maxAttempts: 60 }
      );

      // Step 2: submit completeCctpInbound via Freighter
      setCctpStatus("completing");
      const { txHash } = await sharpyClient.completeCctpInbound(publicKey, message, attestation);

      setCctpCompleteTxHash(txHash);
      setCctpStatus("done");

      // Persist completion record so /invoice/[id] can show the banner
      try {
        const storageKey = `cctp_completions_${invoiceId}`;
        const existing = JSON.parse(localStorage.getItem(storageKey) ?? "[]");
        const record = {
          sourceChain: chain.name,
          evmTxHash: cctpEvmTxHash.trim(),
          stellarTxHash: txHash,
          completedAt: Math.floor(Date.now() / 1000),
        };
        if (!existing.some((e: any) => e.evmTxHash === record.evmTxHash)) {
          localStorage.setItem(storageKey, JSON.stringify([...existing, record]));
        }
      } catch {
        // localStorage not critical — swallow errors
      }

      await load();
    } catch (e: any) {
      setCctpError(e.message ?? "CCTP completion failed.");
      setCctpStatus("idle");
    }
  };

  const copyApiUrl = () => {
    navigator.clipboard.writeText(`${window.location.origin}/api/x402/${invoiceId}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyHookData = () => {
    navigator.clipboard.writeText(cctpHookData);
    setHookDataCopied(true);
    setTimeout(() => setHookDataCopied(false), 2000);
  };

  const copyForwarder = () => {
    navigator.clipboard.writeText(cctpForwarder);
    setForwarderCopied(true);
    setTimeout(() => setForwarderCopied(false), 2000);
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

  const selectedChain = CCTP_CHAINS[cctpChainIdx];

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
          {/* CCTP done state */}
          {mode === "cctp" && cctpStatus === "done" ? (
            <div className="text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto text-xl text-[#00D4AA]">✓</div>
              <p className="font-display font-semibold text-[#00D4AA]">Cross-chain payment complete!</p>
              <p className="text-xs" style={{ color: "var(--muted)" }}>USDC bridged via Circle CCTP and forwarded to Stellar.</p>
              {cctpCompleteTxHash && (
                <a href={explorerUrl(NETWORK, cctpCompleteTxHash, "tx")} target="_blank" rel="noreferrer"
                  className="text-xs text-[#6C63FF] underline block">View on Stellar Explorer</a>
              )}
              <button onClick={() => router.push(`/invoice/${invoiceId}`)} className="btn-ghost text-sm w-full">
                View Invoice
              </button>
            </div>
          ) : step === "done" && mode !== "cctp" ? (
            /* Wallet / x402 done state */
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
              {/* Mode toggle — 3 tabs */}
              <div className="flex rounded-xl overflow-hidden border" style={{ borderColor: "var(--border)" }}>
                {(["wallet", "x402", "cctp"] as PayMode[]).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className={`flex-1 py-2 text-sm font-medium transition-colors ${mode === m ? "bg-[#6C63FF] text-white" : ""}`}
                    style={mode !== m ? { color: "var(--muted)" } : {}}
                  >
                    {m === "wallet" ? "Wallet" : m === "x402" ? "x402 / Agent" : "Cross-chain"}
                  </button>
                ))}
              </div>

              {/* x402 info banner */}
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

              {/* CCTP cross-chain UI */}
              {mode === "cctp" && (
                <div className="space-y-4">
                  <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl px-4 py-3 space-y-1">
                    <p className="text-xs font-medium" style={{ color: "var(--text)" }}>Pay with USDC from any EVM chain</p>
                    <p className="text-xs" style={{ color: "var(--muted)" }}>
                      Bridge via Circle CCTP — burn USDC on EVM, receive USDC on Stellar automatically.
                    </p>
                  </div>

                  {/* Chain selector */}
                  <div className="space-y-1.5">
                    <p className="text-xs font-medium" style={{ color: "var(--muted)" }}>Source chain</p>
                    <div className="flex gap-2">
                      {CCTP_CHAINS.map((chain, i) => (
                        <button
                          key={chain.name}
                          onClick={() => setCctpChainIdx(i)}
                          className={`flex-1 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                            cctpChainIdx === i
                              ? "border-[#6C63FF] bg-[#6C63FF]/10 text-[#6C63FF]"
                              : "border-[var(--border)]"
                          }`}
                          style={cctpChainIdx !== i ? { color: "var(--muted)" } : {}}
                        >
                          {chain.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Step 1: burn instructions */}
                  <div className="space-y-3 rounded-xl border p-4" style={{ borderColor: "var(--border)" }}>
                    <p className="text-xs font-semibold" style={{ color: "var(--text)" }}>
                      Step 1 — Burn USDC on {selectedChain.name}
                    </p>

                    <div className="space-y-1">
                      <p className="text-xs" style={{ color: "var(--muted)" }}>USDC contract ({selectedChain.name})</p>
                      <div className="flex items-center gap-2">
                        <code className="text-xs mono flex-1 truncate bg-[#111318] px-2 py-1 rounded" style={{ color: "var(--muted-2)" }}>
                          {selectedChain.usdcAddress}
                        </code>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs" style={{ color: "var(--muted)" }}>
                        CctpForwarder address — set as both <code className="font-mono">mintRecipient</code> and <code className="font-mono">destinationCaller</code>
                      </p>
                      <div className="flex items-center gap-2">
                        <code className="text-xs mono flex-1 truncate bg-[#111318] px-2 py-1 rounded" style={{ color: "var(--muted-2)" }}>
                          {cctpForwarder}
                        </code>
                        <button onClick={copyForwarder} className="text-xs text-[#6C63FF] hover:underline shrink-0">
                          {forwarderCopied ? "Copied!" : "Copy"}
                        </button>
                      </div>
                    </div>

                    {publicKey && cctpHookData ? (
                      <div className="space-y-1">
                        <p className="text-xs" style={{ color: "var(--muted)" }}>
                          Hook data — pass as <code className="font-mono">hookData</code> in the burn call (forwards USDC to your Stellar address)
                        </p>
                        <div className="flex items-center gap-2">
                          <code className="text-xs mono flex-1 truncate bg-[#111318] px-2 py-1 rounded" style={{ color: "var(--muted-2)" }}>
                            0x{cctpHookData}
                          </code>
                          <button onClick={copyHookData} className="text-xs text-[#6C63FF] hover:underline shrink-0">
                            {hookDataCopied ? "Copied!" : "Copy"}
                          </button>
                        </div>
                        <p className="text-xs" style={{ color: "var(--muted)" }}>
                          Forwards to: <span className="mono">{truncateAddress(publicKey)}</span>
                        </p>
                      </div>
                    ) : !publicKey ? (
                      <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
                        <p className="text-xs text-amber-400">Connect your Stellar wallet to generate hook data.</p>
                      </div>
                    ) : null}
                  </div>

                  {/* Step 2: paste EVM tx hash + complete */}
                  <div className="space-y-3 rounded-xl border p-4" style={{ borderColor: "var(--border)" }}>
                    <p className="text-xs font-semibold" style={{ color: "var(--text)" }}>
                      Step 2 — Complete on Stellar
                    </p>
                    <p className="text-xs" style={{ color: "var(--muted)" }}>
                      After your EVM burn transaction is confirmed, paste the hash below. Sharpy will poll Circle&apos;s attestation service and complete the transfer via Freighter.
                    </p>

                    <div className="space-y-2">
                      <label className="text-xs font-medium" style={{ color: "var(--muted)" }}>EVM transaction hash</label>
                      <input
                        value={cctpEvmTxHash}
                        onChange={(e) => { setCctpEvmTxHash(e.target.value); setCctpError(""); }}
                        placeholder="0x..."
                        className="input font-mono text-sm"
                        disabled={cctpStatus === "polling" || cctpStatus === "completing"}
                      />
                    </div>

                    {/* Status indicator */}
                    {cctpStatus !== "idle" && cctpStatus !== "done" && (
                      <div className="flex items-center gap-3 text-xs" style={{ color: "var(--muted)" }}>
                        {(["polling", "completing"] as const).map((s, i) => (
                          <div key={s} className="flex items-center gap-1">
                            <div className={`w-1.5 h-1.5 rounded-full ${
                              cctpStatus === s ? "bg-[#6C63FF] animate-pulse" :
                              (s === "completing" && (cctpStatus === "attested" || cctpStatus === "completing")) ? "bg-[#00D4AA]" :
                              "bg-[var(--border)]"
                            }`} />
                            <span className={cctpStatus === s ? "text-[#6C63FF]" : ""}>
                              {s === "polling" ? "Awaiting attestation" : "Completing on Stellar"}
                            </span>
                            {i < 1 && <span className="mx-1">→</span>}
                          </div>
                        ))}
                      </div>
                    )}

                    {cctpError && <p className="text-xs text-red-400">{cctpError}</p>}

                    {!publicKey ? (
                      <button onClick={connect} className="btn-primary w-full py-3 text-sm">
                        Connect Wallet
                      </button>
                    ) : !signerReady ? (
                      <button onClick={connect} className="btn-primary w-full py-3 text-sm">
                        Reconnect Wallet
                      </button>
                    ) : (
                      <button
                        onClick={handleCctpComplete}
                        disabled={!cctpEvmTxHash.trim() || cctpStatus === "polling" || cctpStatus === "completing"}
                        className="btn-primary w-full py-3 text-sm"
                      >
                        {cctpStatus === "polling"
                          ? "Waiting for attestation..."
                          : cctpStatus === "completing"
                            ? "Completing via Freighter..."
                            : "Complete cross-chain transfer"}
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Wallet + x402 shared amount input */}
              {(mode === "wallet" || mode === "x402") && (
                <>
                  {!publicKey ? (
                    <div className="text-center space-y-3">
                      <p className="text-sm" style={{ color: "var(--muted)" }}>Connect your wallet to pay.</p>
                      <button onClick={connect} className="btn-primary w-full py-3">Connect Wallet</button>
                    </div>
                  ) : !signerReady ? (
                    <div className="text-center space-y-3">
                      <p className="text-sm" style={{ color: "var(--muted)" }}>Wallet session expired. Please reconnect.</p>
                      <button onClick={connect} className="btn-primary w-full py-3">Reconnect Wallet</button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium" style={{ color: "var(--text)" }}>Amount (USDC)</label>
                        <input
                          value={payAmount}
                          onChange={(e) => setPayAmount(e.target.value)}
                          placeholder={`Up to ${formatAmount(remaining)}`}
                          className="input mt-1.5"
                          disabled={paying}
                        />
                      </div>

                      {/* Payout preview */}
                      {invoice && <PayoutPreview invoiceId={invoiceId} invoice={invoice} defaultAmount={payAmount} />}

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
                </>
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
