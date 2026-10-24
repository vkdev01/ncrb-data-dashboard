/** Number / value formatting helpers, tuned for Indian conventions. */

/** Full grouped number, Indian grouping: 6,241,569 → "62,41,569". */
export function nf(n: number): string {
  return new Intl.NumberFormat('en-IN').format(Math.round(n));
}

/** Compact Indian scale: 12,34,567 → "12.35 L". */
export function compactIN(n: number, digits = 2): string {
  const abs = Math.abs(n);
  if (abs >= 1e7) return `${(n / 1e7).toFixed(digits)} Cr`;
  if (abs >= 1e5) return `${(n / 1e5).toFixed(digits)} L`;
  if (abs >= 1e3) return `${(n / 1e3).toFixed(1)}k`;
  return String(Math.round(n));
}

/** Percentage with a fixed number of decimals. */
export function pct(n: number, digits = 1): string {
  return `${n.toFixed(digits)}%`;
}

/** A signed percentage change, e.g. "+4.2%". */
export function signedPct(n: number, digits = 1): string {
  return `${n >= 0 ? '+' : ''}${n.toFixed(digits)}%`;
}

/** A signed plain number. */
export function signed(n: number, digits = 1): string {
  return `${n >= 0 ? '+' : ''}${n.toFixed(digits)}`;
}

/** Rate per 100,000, e.g. "448.3". */
export function rate(n: number, digits = 1): string {
  return n.toFixed(digits);
}

/** Rupees in crore, for financial-loss style figures. */
export function crore(n: number): string {
  return `₹${new Intl.NumberFormat('en-IN').format(Math.round(n))} Cr`;
}

/** Short date for "data as of" labels. */
export function shortDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}
