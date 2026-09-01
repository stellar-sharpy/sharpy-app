"use client";
import ClaimableBalance from "../../components/ClaimableBalance";
import Link from "next/link";

export default function ClaimPage() {
  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold" style={{ color: "var(--text)" }}>Claimable Balance</h1>
        <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>Recover funds from failed recipient transfers.</p>
      </div>
      <ClaimableBalance />
      <Link href="/dashboard" className="text-xs text-[#6C63FF] hover:underline">← Back to dashboard</Link>
    </div>
  );
}
