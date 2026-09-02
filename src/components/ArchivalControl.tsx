"use client";
import { useState } from "react";
export function ArchivalControl({ invoiceId, status }: { invoiceId: number; status: string }) {
  const [archived,setArchived]=useState(false);
  return (
    <div className="p-4 border rounded">
      <h3 className="font-bold">Archive #{invoiceId}</h3>
      <p className="text-xs">Status: {status} {archived ? "(archived)" : ""}</p>
      <button className={`${archived ? "bg-gray-600" : "bg-purple-600"} text-white px-4 py-2 rounded mt-2`} onClick={()=> setArchived(!archived)}>{archived ? "Unarchive" : "Archive"}</button>
    </div>
  );
}
