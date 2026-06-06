"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useWallet } from "../../../../components/WalletProvider";
import { sharpyClient, NETWORK } from "../../../../lib/client";
import { explorerUrl } from "../../../../lib/utils";
import type { Invoice } from "../../../../lib/utils";

export default function EscrowPage() {
  const { id } = useParams<{ id: string }>();
  const invoiceId = Number(id);
  const { publicKey, connect } = useWallet();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [releasing, setReleasing] = useState(false);
  const [txHash, setTxHash] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    sharpyClient.getInvoice(invoiceId).then(setInvoice).catch((e) => setError(e.message));
  }, [invoiceId]);

  const handleRelease = async () => {
    if (!publicKey) return;
    setReleasing(true); setError("");
    try {
      const { txHash } = await sharpyClient.releaseEscrow(publicKey, invoiceId);
      setTxHash(txHash);
      setInvoice(await sharpyClient.getInvoice(invoiceId));
    } catch (e: any) { setError(e.message); }
    finally { setReleasing(false); }
  };

  if (!invoice) return (
    <div className="max-w-lg mx-auto card p-8 animate-pulse h-48" />
  );

  return (
    <div className="max-w-lg mx-auto space-y-5">
      <div>
        <p className="mono text-xs mb-1">Invoice #{invoiceId}</p>
        <h1 className="font-display text-2xl font-bold text-[#F1F2F6]">Escrow</h1>
      </div>

      <div className="card p-6 space-y-5">
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3">
          <p className="text-xs text-amber-400">
            Escrow protection is active. Funds are locked for{" "}
            <strong>{invoice.escrowReleaseDelay / 3600} hours</strong> after full payment before release.
          </p>
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-[#4B5563]">Status</span>
          <span className={`badge badge-${invoice.status.toLowerCase()}`}>{invoice.status}</span>
        </div>

        {invoice.status === "Released" ? (
          <div className="text-sm text-[#00D4AA] bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3">
            Escrow has been released successfully.
          </div>
        ) : !publicKey ? (
          <button onClick={connect} className="btn-primary w-full py-3">Connect Wallet to Release</button>
        ) : (
          <button onClick={handleRelease} disabled={releasing} className="btn-primary w-full py-3">
            {releasing ? "Releasing..." : "Release Escrow"}
          </button>
        )}

        {error && <p className="text-sm text-red-400">{error}</p>}
        {txHash && (
          <a href={explorerUrl(NETWORK, txHash, "tx")} target="_blank" rel="noreferrer"
            className="text-xs text-[#6C63FF] hover:underline block">
            View transaction
          </a>
        )}
      </div>
    </div>
  );
}
