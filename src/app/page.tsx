import Link from "next/link";

const features = [
  {
    title: "Recurring Splits",
    desc: "Auto-generate the next invoice on release. Perfect for subscriptions and retainers.",
    icon: "↺",
  },
  {
    title: "Escrow Protection",
    desc: "Hold funds with a configurable dispute delay before distribution to recipients.",
    icon: "⬡",
  },
  {
    title: "Batch Operations",
    desc: "Create or pay up to 10 invoices in a single transaction. Gas efficient.",
    icon: "⊞",
  },
  {
    title: "Flexible Split Rules",
    desc: "Fixed amounts, percentage-based, or tiered threshold splits — configured per recipient.",
    icon: "◈",
  },
];

const stats = [
  { label: "Network", value: "Stellar" },
  { label: "Contract", value: "Soroban" },
  { label: "Status", value: "Live on Testnet" },
  { label: "License", value: "MIT" },
];

export default function Home() {
  return (
    <div className="flex flex-col items-center gap-20">

      {/* Hero */}
      <section className="text-center pt-10 flex flex-col items-center gap-6 max-w-2xl">
        <div className="inline-flex items-center gap-2 bg-[#111318] border border-[#1E2028] rounded-full px-4 py-1.5 text-xs text-[#9CA3AF]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00D4AA] animate-pulse" />
          Live on Stellar Testnet
        </div>

        <h1 className="font-display text-5xl sm:text-6xl font-bold tracking-tight text-[#F1F2F6] leading-tight">
          Split payments,{" "}
          <span className="bg-gradient-to-r from-[#6C63FF] to-[#00D4AA] bg-clip-text text-transparent">
            on-chain.
          </span>
        </h1>

        <p className="text-lg text-[#6B7280] leading-relaxed">
          Create invoices that automatically distribute funds to multiple recipients.
          Recurring, escrow-protected, or batched — all on Stellar Soroban.
        </p>

        <div className="flex gap-3 flex-wrap justify-center">
          <Link href="/invoice/new" className="btn-primary px-6 py-3 text-sm">
            Create Invoice
          </Link>
          <Link href="/dashboard" className="btn-ghost px-6 py-3 text-sm">
            View Dashboard
          </Link>
        </div>
      </section>

      {/* Stats bar */}
      <section className="w-full card p-5 grid grid-cols-2 sm:grid-cols-4 gap-4 glow">
        {stats.map((s) => (
          <div key={s.label} className="flex flex-col gap-1">
            <p className="text-xs text-[#4B5563] uppercase tracking-widest">{s.label}</p>
            <p className="text-sm font-medium text-[#F1F2F6]">{s.value}</p>
          </div>
        ))}
      </section>

      {/* Features */}
      <section className="w-full grid sm:grid-cols-2 gap-4">
        {features.map((f) => (
          <div key={f.title} className="card p-6 hover:border-[#2E3040] transition-colors group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#6C63FF]/20 to-[#00D4AA]/10 border border-[#6C63FF]/20 flex items-center justify-center text-[#6C63FF] text-lg mb-4">
              {f.icon}
            </div>
            <h3 className="font-display font-semibold text-[#F1F2F6] mb-2">{f.title}</h3>
            <p className="text-sm text-[#6B7280] leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </section>

      {/* CTA */}
      <section className="w-full card p-10 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#6C63FF]/5 to-[#00D4AA]/5 pointer-events-none" />
        <h2 className="font-display text-2xl font-bold text-[#F1F2F6] mb-3">Ready to get started?</h2>
        <p className="text-[#6B7280] text-sm mb-6">Connect your Freighter wallet and create your first invoice in seconds.</p>
        <Link href="/invoice/new" className="btn-primary inline-block px-8 py-3">
          Get Started
        </Link>
      </section>

    </div>
  );
}
