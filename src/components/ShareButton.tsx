"use client";
import { useState } from "react";
import { CopyButton } from "./CopyButton";

interface Props {
  invoiceId: number;
}

export default function ShareButton({ invoiceId }: Props) {
  const [showModal, setShowModal] = useState(false);
  const invoiceUrl = typeof window !== "undefined" ? `${window.location.origin}/pay/${invoiceId}` : "";

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors"
        style={{ background: "var(--primary)", color: "#fff" }}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M12 5.5a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0zM5.5 13a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" fill="currentColor"/>
          <path d="M7.5 6.5l3 4" stroke="currentColor" strokeWidth="1.5"/>
        </svg>
        Share
      </button>

      {showModal && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="card p-6 max-w-md w-full space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-lg" style={{ color: "var(--text)" }}>
                Share Invoice
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-[var(--muted)] hover:text-[var(--text)] transition-colors"
              >
                ✕
              </button>
            </div>

            <p className="text-sm" style={{ color: "var(--muted)" }}>
              Share this payment link with anyone who needs to pay this invoice.
            </p>

            <div className="flex items-center gap-2">
              <input
                readOnly
                value={invoiceUrl}
                className="input flex-1 text-sm"
              />
              <CopyButton value={invoiceUrl} label="payment link" />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  window.open(`https://twitter.com/intent/tweet?text=Pay%20this%20invoice&url=${encodeURIComponent(invoiceUrl)}`, "_blank");
                }}
                className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors"
                style={{ background: "var(--surface-2)", color: "var(--text-secondary)" }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
                Twitter
              </button>
              <button
                onClick={() => {
                  const subject = encodeURIComponent(`Invoice #${invoiceId} - Sharpy`);
                  const body = encodeURIComponent(`Please pay this invoice: ${invoiceUrl}`);
                  window.open(`mailto:?subject=${subject}&body=${body}`);
                }}
                className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors"
                style={{ background: "var(--surface-2)", color: "var(--text-secondary)" }}
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <path d="M1 4l7 5 7-5M1 4v8a1 1 0 001 1h12a1 1 0 001-1V4M1 4l7-2 7 2" stroke="currentColor" strokeWidth="1.5"/>
                </svg>
                Email
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
