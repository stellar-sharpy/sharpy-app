"use client";
import { useState } from "react";
export function TagEditor({ invoiceId }: { invoiceId: number }) {
  const [tags, setTags] = useState<string[]>([]);
  const [input, setInput] = useState("");
  return (
    <div className="p-4 border rounded">
      <h3 className="font-bold">Tags for #{invoiceId}</h3>
      <div className="flex gap-2 mt-2">
        <input className="border px-2 py-1" value={input} onChange={e=> setInput(e.target.value)} placeholder="add tag" />
        <button className="bg-black text-white px-3 py-1 rounded" onClick={()=> { if(input && tags.length<10) { setTags([...tags, input]); setInput(""); }}}>Add</button>
      </div>
      <div className="flex gap-1 mt-2">{tags.map(t=> <span key={t} className="bg-gray-100 px-2 py-1 rounded text-sm">{t}</span>)}</div>
    </div>
  );
}
