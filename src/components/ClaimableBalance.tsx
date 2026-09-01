"use client";
import { useEffect, useState } from "react";
import { useWallet } from "./WalletProvider";
import { sharpyClient, DEFAULT_TOKEN } from "../lib/client";
import { formatAmount } from "../lib/utils";
import { TOKENS, getTokenAddress } from "../lib/tokens";

export default function ClaimableBalance() {
  const { publicKey, signerReady, connect } = useWallet();
  const [balances, setBalances] = useState<{ token: string; symbol: string; balance: bigint }[]>([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<string | null>(null);
  const [error, setError] = useState("");

  const load = async (addr: string) => {
    setLoading(true);
    try {
      const results = await Promise.all(
        TOKENS.map(async (t) => {
          const addrTok = getTokenAddress(t, "testnet");
          try {
            const bal = await sharpyClient.getClaimableBalance(addr, addrTok);
            return { token: addrTok, symbol: t.symbol, balance: bal };
          } catch { return { token: addrTok, symbol: t.symbol, balance: 0n }; }
        })
      );
      setBalances(results.filter((r) => r.balance > 0n));
    } finally { setLoading(false); }
  };

  useEffect(() => { if (publicKey) load(publicKey); else setLoading(false); }, [publicKey]);

  const handleClaim = async (tokenAddr: string) => {
    if (!publicKey || !signerReady) return;
    setClaiming(tokenAddr); setError("");
    try {
      await sharpyClient.claim(publicKey, tokenAddr);
      await load(publicKey);
    } catch (e: any) { setError(e.message ?? "Claim failed"); }
    finally { setClaiming(null); }
  };

  if (!publicKey) return (
    <div className="card p-6 text-center space-y-3">
      <p className="text-sm" style={{ color: "var(--muted)" }}>Connect wallet to view claimable balances.</p>
      <button onClick={connect} className="btn-primary text-sm">Connect Wallet</button>
    </div>
  );

  if (loading) return <div className="card p-6 animate-pulse h-32" />;

  if (balances.length === 0) return (
    <div className="card p-8 text-center space-y-2">
      <p className="text-sm font-medium" style={{ color: "var(--text)" }}>No claimable balance</p>
      <p className="text-xs" style={{ color: "var(--muted)" }}>Failed recipient transfers are credited here for recovery via claim.</p>
    </div>
  );

  return (
    <div className="space-y-3">
      <p className="text-xs" style={{ color: "var(--muted)" }}>Claimable balances are funds credited after failed recipient transfers — withdraw via claim().</p>
      {balances.map((b) => (
        <div key={b.token} className="card p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>{formatAmount(b.balance)} {b.symbol}</p>
            <p className="mono text-xs" style={{ color: "var(--muted)" }}>{b.token.slice(0,12)}…</p>
          </div>
          <button onClick={() => handleClaim(b.token)} disabled={claiming !== null} className="btn-primary text-xs px-4 py-2 disabled:opacity-50">
            {claiming === b.token ? "Claiming..." : "Claim"}
          </button>
        </div>
      ))}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
