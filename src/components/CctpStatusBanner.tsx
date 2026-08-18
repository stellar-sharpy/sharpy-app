"use client";

import { useState } from "react";
import { explorerUrl } from "../lib/utils";

interface CctpInboundRecord {
  sourceChain: string;
  evmTxHash: string;
  stellarTxHash: string;
  completedAt: number; // unix timestamp
}

const CHAIN_LABELS: Record<number, string> = { 0: "Ethereum", 3: "Arbitrum", 6: "Base" };
const EVM_EXPLORER: Record<number, string> = {
  0: "https://etherscan.io/tx/",
  3: "https://arbiscan.io/tx/",
  6: "https://basescan.org/tx/",
};

interface Props {
  invoiceId: number;
  network: "testnet" | "mainnet";
}

/**
 * CctpStatusBanner — shown on /invoice/[id] when a cross-chain CCTP inbound transfer
 * has been completed for this invoice. Records are stored in localStorage keyed by invoiceId.
 *
 * Storage key: `cctp_completions_${invoiceId}`
 * Value: JSON array of CctpInboundRecord
 */
export function useCctpCompletions(invoiceId: number): {
  records: CctpInboundRecord[];
  addRecord: (r: CctpInboundRecord) => void;
  clear: () => void;
} {
  const storageKey = `cctp_completions_${invoiceId}`;

  function read(): CctpInboundRecord[] {
    if (typeof window === "undefined") return [];
    try {
      return JSON.parse(localStorage.getItem(storageKey) ?? "[]");
    } catch {
      return [];
    }
  }

  function addRecord(r: CctpInboundRecord) {
    const existing = read();
    // Deduplicate by evmTxHash
    if (existing.some((e) => e.evmTxHash === r.evmTxHash)) return;
    localStorage.setItem(storageKey, JSON.stringify([...existing, r]));
  }

  function clear() {
    localStorage.removeItem(storageKey);
  }

  return { records: read(), addRecord, clear };
}

export default function CctpStatusBanner({ invoiceId, network }: Props) {
  const { records, clear } = useCctpCompletions(invoiceId);
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || records.length === 0) return null;

  return (
    <div
      className="rounded-xl p-4 space-y-3"
      style={{
        background: "rgba(0,212,170,0.07)",
        border: "1px solid rgba(0,212,170,0.25)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[#00D4AA]">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M2 8.5l4 4 8-8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </span>
          <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>
            Cross-chain payment{records.length > 1 ? "s" : ""} received
          </p>
        </div>
        <button
          onClick={() => { setDismissed(true); clear(); }}
          className="text-xs px-2 py-1 rounded-lg transition-colors"
          style={{ color: "var(--muted)", background: "var(--surface-2)" }}
        >
          Dismiss
        </button>
      </div>

      {/* Records */}
      <div className="space-y-2">
        {records.map((r, i) => (
          <div
            key={i}
            className="rounded-lg px-3 py-2.5 space-y-1.5"
            style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
          >
            <div className="flex items-center gap-2">
              <span
                className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ background: "rgba(108,99,255,0.15)", color: "#6C63FF" }}
              >
                {r.sourceChain}
              </span>
              <span className="text-xs" style={{ color: "var(--muted)" }}>
                {new Date(r.completedAt * 1000).toLocaleString()}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-medium" style={{ color: "var(--muted)" }}>EVM tx:</span>
                <a
                  href={`${EVM_EXPLORER[getDomainFromChain(r.sourceChain)] ?? "https://etherscan.io/tx/"}${r.evmTxHash}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mono text-xs underline truncate max-w-[200px]"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {r.evmTxHash.slice(0, 10)}…{r.evmTxHash.slice(-6)}
                </a>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-medium" style={{ color: "var(--muted)" }}>Stellar tx:</span>
                <a
                  href={explorerUrl(network, r.stellarTxHash, "tx")}
                  target="_blank"
                  rel="noreferrer"
                  className="mono text-xs underline truncate max-w-[200px]"
                  style={{ color: "#00D4AA" }}
                >
                  {r.stellarTxHash.slice(0, 10)}…{r.stellarTxHash.slice(-6)}
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function getDomainFromChain(chain: string): number {
  const map: Record<string, number> = { Ethereum: 0, Arbitrum: 3, Base: 6 };
  return map[chain] ?? 0;
}
