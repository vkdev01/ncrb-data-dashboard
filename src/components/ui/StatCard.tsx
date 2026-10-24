import type { ReactNode } from 'react';

type Tone = 'default' | 'accent' | 'accent2' | 'warn' | 'good';

/** StatCard — a single headline metric. */
export function StatCard({
  label,
  value,
  note,
  tone = 'default',
  hint,
}: {
  label: string;
  value: ReactNode;
  note?: ReactNode;
  tone?: Tone;
  hint?: string;
}) {
  return (
    <div className="stat" title={hint}>
      <div className="stat-k">{label}</div>
      <div className={`stat-v tone-${tone}`}>{value}</div>
      {note ? <div className="stat-note">{note}</div> : null}
    </div>
  );
}
