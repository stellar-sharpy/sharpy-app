"use client";
import { useState } from "react";
export function ExtendDeadline({ invoiceId, deadline }: { invoiceId: number; deadline: number }) {
  const [newDeadline, setNewDeadline] = useState("");
  return (
    <div className="p-4 border rounded">
      <h3 className="font-bold">Extend Deadline #{invoiceId}</h3>
      <p className="text-xs">Current: {new Date(deadline*1000).toLocaleDateString()}</p>
      <input type="datetime-local" className="border p-2 w-full mt-2" value={newDeadline} onChange={e=> setNewDeadline(e.target.value)} />
      <button className="mt-2 bg-blue-600 text-white px-4 py-2 rounded">Extend</button>
    </div>
  );
}
