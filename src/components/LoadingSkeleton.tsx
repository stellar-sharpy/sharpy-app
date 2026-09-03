"use client";

interface LoadingSkeletonProps {
  rows?: number;
  className?: string;
}

/**
 * LoadingSkeleton — accessible pulse placeholder for async cards.
 * Renders `rows` pulsing bars inside a live region.
 */
export default function LoadingSkeleton({ rows = 3, className = "" }: LoadingSkeletonProps) {
  return (
    <div className={`space-y-3 ${className}`} role="status" aria-label="Loading content" aria-live="polite">
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="card h-16 animate-pulse" aria-hidden="true" />
      ))}
      <span className="sr-only">Loading…</span>
    </div>
  );
}
