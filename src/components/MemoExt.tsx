"use client";
import { useState } from "react";
export function MemoExt({ invoiceId }: { invoiceId: number }) {
  const [memo, setMemo] = useState("");
  return (
    <div className="p-4 border rounded">
      <h3 className="font-bold">Memo #{invoiceId}</h3>
      <textarea className="w-full border p-2 mt-2" value={memo} onChange={e=> setMemo(e.target.value)} placeholder="extra memo (256 chars)" maxLength={256} />
      <div className="text-xs text-gray-500 mt-1">{memo.length}/256</div>
    </div>
  );
}
