"use client";
import { useState } from "react";
export function MetadataEditor({ invoiceId }: { invoiceId: number }) {
  const [entries, setEntries] = useState<string[]>([]);
  const [key, setKey] = useState("");
  const [val, setVal] = useState("");
  return (
    <div className="p-4 border rounded">
      <h3 className="font-bold">Metadata #{invoiceId}</h3>
      <div className="flex gap-2 mt-2">
        <input className="border p-1 flex-1" placeholder="key" value={key} onChange={e=> setKey(e.target.value)} />
        <input className="border p-1 flex-1" placeholder="value" value={val} onChange={e=> setVal(e.target.value)} />
        <button className="bg-black text-white px-3" onClick={()=> { if(key&&val) { setEntries([...entries, `${key}:${val}`]); setKey(""); setVal(""); }}}>Add</button>
      </div>
      <ul className="mt-2 text-sm">{entries.map(e=> <li key={e}>{e}</li>)}</ul>
    </div>
  );
}
