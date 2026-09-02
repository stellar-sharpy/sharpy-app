"use client";
import { useState } from "react";
export function BatchRefund() {
  const [ids, setIds] = useState("");
  return (
    <div className="p-4 border rounded">
      <h3 className="font-bold">Batch Refund</h3>
      <p className="text-sm text-gray-600">Refund up to 10 deadline-passed invoices</p>
      <input className="border w-full p-2 mt-2" value={ids} onChange={e=> setIds(e.target.value)} placeholder="ids comma separated" />
      <button className="mt-2 bg-red-600 text-white px-4 py-2 rounded">Refund Batch</button>
    </div>
  );
}
