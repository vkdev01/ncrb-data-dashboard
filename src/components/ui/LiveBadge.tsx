/**
 * LiveBadge — tells the reader whether what they are looking at is the live
 * feed or the bundled snapshot. Honesty about data provenance is a feature.
 */
export function LiveBadge({ live, status }: { live: boolean; status: 'loading' | 'ready' }) {
  if (status === 'loading') {
    return (
      <span className="badge badge-muted">
        <span className="dot dot-pulse" /> fetching…
      </span>
    );
  }
  return live ? (
    <span className="badge badge-live">
      <span className="dot" /> live data
    </span>
  ) : (
    <span className="badge badge-snapshot" title="Live source unreachable — showing the bundled snapshot">
      <span className="dot" /> snapshot
    </span>
  );
}

/** A small neutral tag. */
export function Tag({ children }: { children: React.ReactNode }) {
  return <span className="tag">{children}</span>;
}
