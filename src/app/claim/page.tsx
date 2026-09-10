"use client";
import ClaimableBalance from "../../components/ClaimableBalance";
import Link from "next/link";

export default function ClaimPage() {
  return (
    <div className="max-w-lg mx-auto space-y-6 px-1 sm:px-0">
      <div>
        <h1 className="font-display text-xl sm:text-2xl font-bold" style={{ color: "var(--text)" }}>Claimable Balance</h1>
        <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>Recover funds from failed recipient transfers.</p>
      </div>
      <ClaimableBalance />
      <p className="text-xs" style={{ color: "var(--muted)" }}>
        Balances are credited on-chain when a recipient transfer fails, so funds are never stranded —
        claim them here at any time.
      </p>
      <Link href="/dashboard" className="text-xs text-[#6C63FF] hover:underline" aria-label="Back to dashboard">← Back to dashboard</Link>
    </div>
  );
}
