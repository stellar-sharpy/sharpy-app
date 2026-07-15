import Link from "next/link";
import Image from "next/image";

const features = [
  {
    title: "Recurring Splits",
    desc: "Auto-generate the next invoice on release. Perfect for subscriptions and retainers.",
    icon: "↺",
    image: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600&q=80&auto=format&fit=crop",
    alt: "Recurring payments cycle",
  },
  {
    title: "Escrow Protection",
    desc: "Hold funds with a configurable dispute delay before distribution to recipients.",
    icon: "⬡",
    image: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=600&q=80&auto=format&fit=crop",
    alt: "Secure blockchain escrow",
  },
  {
    title: "Batch Operations",
    desc: "Create or pay up to 10 invoices in a single transaction. Gas efficient.",
    icon: "⊞",
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&q=80&auto=format&fit=crop",
    alt: "Batch transaction operations",
  },
  {
    title: "Flexible Split Rules",
    desc: "Fixed amounts, percentage-based, or tiered threshold splits — configured per recipient.",
    icon: "◈",
    image: "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=600&q=80&auto=format&fit=crop",
    alt: "Flexible payment splitting",
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

      {/* Animated background orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="bg-orb w-96 h-96 bg-[#6C63FF] top-[-10%] left-[-5%]" />
        <div className="bg-orb bg-orb-2 w-80 h-80 bg-[#00D4AA] top-[20%] right-[-8%]" />
        <div className="bg-orb bg-orb-3 w-72 h-72 bg-[#6C63FF] bottom-[10%] left-[20%]" />
      </div>

      {/* Hero */}
      <section className="relative z-10 text-center pt-10 flex flex-col items-center gap-6 max-w-2xl">
        <div className="inline-flex items-center gap-2 bg-[#111318] border border-[#1E2028] rounded-full px-4 py-1.5 text-xs text-[#9CA3AF]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00D4AA] animate-pulse" />
          Live on Stellar Testnet
        </div>

        <h1 className="font-display text-5xl sm:text-6xl font-bold tracking-tight leading-tight" style={{ color: "var(--text)" }}>
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
      <section className="relative z-10 w-full card p-5 grid grid-cols-2 sm:grid-cols-4 gap-4 glow">
        {stats.map((s) => (
          <div key={s.label} className="flex flex-col gap-1">
            <p className="text-xs text-[#4B5563] uppercase tracking-widest">{s.label}</p>
            <p className="text-sm font-medium" style={{ color: "var(--text)" }}>{s.value}</p>
          </div>
        ))}
      </section>

      {/* Features */}
      <section className="relative z-10 w-full grid sm:grid-cols-2 gap-4">
        {features.map((f) => (
          <div key={f.title} className="card overflow-hidden hover:border-[#2E3040] transition-all duration-300 group hover:shadow-lg hover:shadow-[#6C63FF]/5">
            {/* Feature image */}
            <div className="relative h-44 w-full overflow-hidden">
              <img
                src={f.image}
                alt={f.alt}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              {/* Gradient overlay — blends image into card */}
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[var(--surface)]" />
              {/* Icon badge over image */}
              <div className="absolute top-3 left-3 w-9 h-9 rounded-xl bg-gradient-to-br from-[#6C63FF] to-[#00D4AA] flex items-center justify-center text-white text-lg shadow-lg">
                {f.icon}
              </div>
            </div>

            {/* Card content */}
            <div className="p-6 pt-4">
              <h3 className="font-display font-semibold mb-2" style={{ color: "var(--text)" }}>{f.title}</h3>
              <p className="text-sm text-[#6B7280] leading-relaxed">{f.desc}</p>
            </div>
          </div>
        ))}
      </section>

      {/* CTA */}
      <section className="relative z-10 w-full card p-10 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#6C63FF]/5 to-[#00D4AA]/5 pointer-events-none" />
        <h2 className="font-display text-2xl font-bold mb-3" style={{ color: "var(--text)" }}>Ready to get started?</h2>
        <p className="text-[#6B7280] text-sm mb-6">Connect your Freighter wallet and create your first invoice in seconds.</p>
        <Link href="/invoice/new" className="btn-primary inline-block px-8 py-3">
          Get Started
        </Link>
      </section>

    </div>
  );
}
