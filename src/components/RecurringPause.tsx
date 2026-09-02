"use client";
import { useState } from "react";
export function RecurringPause({ invoiceId }: { invoiceId: number }) {
  const [paused, setPaused] = useState(false);
  return (
    <div className="p-4 border rounded">
      <h3 className="font-bold">Recurring #{invoiceId}</h3>
      <button className={`px-4 py-2 rounded ${paused ? "bg-green-600" : "bg-yellow-600"} text-white`} onClick={()=> setPaused(!paused)}>{paused ? "Resume" : "Pause"}</button>
      <div className="text-xs mt-1">{paused ? "Paused" : "Active"}</div>
    </div>
  );
}
