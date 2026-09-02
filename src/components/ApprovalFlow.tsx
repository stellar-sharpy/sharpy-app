"use client";
import { useState } from "react";
export function ApprovalFlow({ invoiceId }: { invoiceId: number }) {
  const [approvers,setApprovers]=useState<string[]>([]);
  const [addr,setAddr]=useState("");
  return (
    <div className="p-4 border rounded">
      <h3 className="font-bold">Approval #{invoiceId}</h3>
      <div className="flex gap-2 mt-2">
        <input className="border p-2 flex-1" value={addr} onChange={e=> setAddr(e.target.value)} placeholder="approver address" />
        <button className="bg-black text-white px-3" onClick={()=> { if(addr) { setApprovers([...approvers, addr]); setAddr("");}}}>Add</button>
      </div>
      <ul className="mt-2 text-sm">{approvers.map(a=> <li key={a}>{a.slice(0,12)}...</li>)}</ul>
      <button className="mt-2 bg-blue-600 text-white px-4 py-2 rounded">Approve</button>
    </div>
  );
}
