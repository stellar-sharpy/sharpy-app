"use client";
import { useState, useRef, useEffect } from "react";
import { TOKENS, Token } from "../lib/tokens";
import { NETWORK } from "../lib/client";

interface Props {
  value: string;
  onChange: (address: string, token: Token) => void;
}

export default function TokenSelector({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = TOKENS.find(
    (t) => t.address[NETWORK] === value
  ) ?? TOKENS[0];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors"
        style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text)" }}
      >
        {selected.logoUrl && (
          <img src={selected.logoUrl} alt={selected.symbol} className="w-4 h-4 rounded-full" />
        )}
        <span>{selected.symbol}</span>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2"
          className={`transition-transform ${open ? "rotate-180" : ""}`}>
          <path d="M2 4l4 4 4-4" />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full mt-1 left-0 z-50 w-48 rounded-xl shadow-xl overflow-hidden"
          style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          {TOKENS.map((token) => {
            const addr = token.address[NETWORK];
            const isSelected = addr === value;
            return (
              <button
                key={token.symbol}
                type="button"
                onClick={() => { onChange(addr, token); setOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors"
                style={{
                  background: isSelected ? "var(--surface-2)" : "transparent",
                  color: isSelected ? "#6C63FF" : "var(--text)",
                }}
              >
                {token.logoUrl && (
                  <img src={token.logoUrl} alt={token.symbol} className="w-5 h-5 rounded-full" />
                )}
                <div>
                  <p className="font-medium">{token.symbol}</p>
                  <p className="text-xs" style={{ color: "var(--muted)" }}>{token.name}</p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
