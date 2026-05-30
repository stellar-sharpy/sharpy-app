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
    setReleasing(true);
    setError("");
    try {
      const { txHash } = await sharpyClient.releaseEscrow(publicKey, invoiceId);
      setTxHash(txHash);
      setInvoice(await sharpyClient.getInvoice(invoiceId));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setReleasing(false);
    }
  };

  if (!invoice) return <p className="text-gray-500">{error || "Loading..."}</p>;

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Escrow — Invoice #{invoiceId}</h1>
      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
        <p className="text-sm text-gray-500">
          This invoice has a <strong>{invoice.escrowReleaseDelay / 3600}h</strong> escrow delay.
          Funds are held until the delay passes after full payment.
        </p>
        <p className="text-sm"><span className="text-gray-500">Status:</span> <strong>{invoice.status}</strong></p>
        {invoice.status === "Pending" && (
          !publicKey
            ? <button onClick={connect} className="text-sm text-indigo-600 hover:underline">Connect wallet to release</button>
            : <button onClick={handleRelease} disabled={releasing}
                className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50">
                {releasing ? "Releasing..." : "Release Escrow"}
              </button>
        )}
        {invoice.status === "Released" && <p className="text-green-600 text-sm">✅ Escrow released.</p>}
        {error && <p className="text-red-600 text-sm">{error}</p>}
        {txHash && (
          <a href={explorerUrl(NETWORK, txHash, "tx")} target="_blank" rel="noreferrer" className="text-sm text-indigo-600 underline">
            View transaction
          </a>
        )}
      </div>
    </div>
  );
}
