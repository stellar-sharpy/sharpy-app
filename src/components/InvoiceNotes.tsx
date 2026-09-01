"use client";
import { useEffect, useState } from "react";
import { useWallet } from "./WalletProvider";
import { sharpyClient } from "../lib/client";

interface Props {
  invoiceId: number;
  isCreator: boolean;
  notes?: string;
}

export default function InvoiceNotes({ invoiceId, isCreator, notes: initialNotes }: Props) {
  const { publicKey, signerReady, connect } = useWallet();
  const [notes, setNotes] = useState(initialNotes ?? "");
  const [fetchedNotes, setFetchedNotes] = useState<string | null>(null);
  const [author, setAuthor] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [txHash, setTxHash] = useState("");

  useEffect(() => {
    let cancelled = false;
    sharpyClient.getInvoiceNotes(invoiceId).then((res) => {
      if (cancelled) return;
      if (res) {
        setFetchedNotes(res.text);
        setAuthor(res.author);
        setNotes(res.text);
      }
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [invoiceId]);

  const displayNotes = fetchedNotes !== null ? fetchedNotes : notes;

  const handleSave = async () => {
    if (!publicKey || !signerReady) return;
    if (!draft.trim()) { setError("Notes cannot be empty"); return; }
    setSaving(true); setError("");
    try {
      const { txHash: hash } = await sharpyClient.setInvoiceNotes(publicKey, invoiceId, draft.trim());
      setTxHash(hash);
      setFetchedNotes(draft.trim());
      setNotes(draft.trim());
      setEditing(false);
    } catch (e: any) { setError(e.message ?? "Failed to save notes"); }
    finally { setSaving(false); }
  };

  if (!displayNotes && !isCreator) return null;

  return (
    <div className="card p-5 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M3 3h7l3 3v7a1 1 0 01-1 1H3a1 1 0 01-1-1V4a1 1 0 011-1z" stroke="var(--muted)" strokeWidth="1.5"/>
            <path d="M10 3v3h3M5 9h6M5 11h4" stroke="var(--muted)" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <p className="text-sm font-medium" style={{ color: "var(--text)" }}>Invoice Notes</p>
          {author && <span className="text-xs mono" style={{ color: "var(--muted)" }}>by {author.slice(0,6)}…</span>}
        </div>
        {isCreator && !editing && (
          <button onClick={() => { setDraft(displayNotes ?? ""); setEditing(true); }} className="text-xs px-2.5 py-1 rounded-lg border hover:bg-[var(--surface-2)]" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>
            {displayNotes ? "Edit" : "Add notes"}
          </button>
        )}
      </div>

      {editing ? (
        <div className="space-y-3">
          <textarea value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Add context, terms, or delivery notes for this invoice..." rows={3} className="input w-full text-sm resize-none" />
          {error && <p className="text-xs text-red-400">{error}</p>}
          {txHash && <p className="text-xs text-emerald-400">Saved — {txHash.slice(0,12)}…</p>}
          <div className="flex gap-2">
            {!publicKey ? (
              <button onClick={connect} className="btn-primary text-xs flex-1 py-2">Connect wallet</button>
            ) : !signerReady ? (
              <button onClick={connect} className="btn-primary text-xs flex-1 py-2">Reconnect</button>
            ) : (
              <button onClick={handleSave} disabled={saving || !draft.trim()} className="btn-primary text-xs flex-1 py-2 disabled:opacity-50">{saving ? "Saving..." : "Save notes"}</button>
            )}
            <button onClick={() => setEditing(false)} className="btn-ghost text-xs px-4 py-2">Cancel</button>
          </div>
        </div>
      ) : displayNotes ? (
        <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "var(--muted)" }}>{displayNotes}</p>
      ) : (
        <p className="text-xs" style={{ color: "var(--muted)" }}>No notes yet. {isCreator ? "Add context for payers." : ""}</p>
      )}
    </div>
  );
}
