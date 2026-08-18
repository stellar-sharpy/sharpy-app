"use client";
import html2canvas from "html2canvas";
import { useState } from "react";

interface Props {
  invoiceId: number;
}

export default function ExportPdfButton({ invoiceId }: Props) {
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      // Capture the invoice page as image
      const element = document.getElementById("invoice-content");
      if (!element) throw new Error("Invoice content not found");

      const canvas = await html2canvas(element, {
        backgroundColor: "#0A0B0D",
        scale: 2,
      });

      // Download as PNG
      const link = document.createElement("a");
      link.download = `sharpy-invoice-${invoiceId}.png`;
      link.href = canvas.toDataURL();
      link.click();
    } catch (e: any) {
      alert(e.message ?? "Export failed");
    } finally {
      setExporting(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={exporting}
      className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium transition-colors border"
      style={{ background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--text-secondary)" }}
    >
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path d="M7 1v8m0 0L4 6m3 3l3-3M2 10v2a1 1 0 001 1h8a1 1 0 001-1v-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      {exporting ? "Exporting…" : "Export as Image"}
    </button>
  );
}
