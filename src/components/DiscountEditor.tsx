"use client";
import { useState } from "react";
export function DiscountEditor({ invoiceId }: { invoiceId: number }) {
  const [bps, setBps] = useState(0);
  return (
    <div className="p-4 border rounded">
      <h3 className="font-bold">Discount #{invoiceId}</h3>
      <input type="range" min={0} max={10000} value={bps} onChange={e=> setBps(Number(e.target.value))} className="w-full" />
      <div className="text-sm">{bps} bps ({(bps/100).toFixed(2)}%)</div>
      <button className="mt-2 bg-green-600 text-white px-4 py-2 rounded">Set Discount</button>
    </div>
  );
}
