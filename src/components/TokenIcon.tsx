"use client";
import { Token } from "../lib/tokens";

export default function TokenIcon({ token, size = 20 }: { token: Token; size?: number }) {
  if (token.logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={token.logoUrl}
        alt={token.symbol}
        width={size}
        height={size}
        className="rounded-full object-cover shrink-0"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      className="rounded-full flex items-center justify-center text-xs font-bold shrink-0"
      style={{ width: size, height: size, background: "#6C63FF", color: "#fff", fontSize: size * 0.5 }}
    >
      {token.symbol.slice(0, 1)}
    </span>
  );
}
