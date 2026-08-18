"use client";

interface Props {
  notes?: string;
}

export default function InvoiceNotes({ notes }: Props) {
  if (!notes) return null;

  return (
    <div className="card p-5 space-y-2">
      <div className="flex items-center gap-2">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M3 3h7l3 3v7a1 1 0 01-1 1H3a1 1 0 01-1-1V4a1 1 0 011-1z" stroke="var(--muted)" strokeWidth="1.5"/>
          <path d="M10 3v3h3M5 9h6M5 11h4" stroke="var(--muted)" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        <p className="text-sm font-medium" style={{ color: "var(--text)" }}>Invoice Notes</p>
      </div>
      <p className="text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
        {notes}
      </p>
    </div>
  );
}
