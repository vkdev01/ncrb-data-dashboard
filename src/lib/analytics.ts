/**
 * Derived-metric helpers. Pure functions over the dataset shapes so they can be
 * unit-tested and reused by any page without touching the data layer.
 */

/** First and last elements, safely. */
export function first<T>(arr: T[]): T | undefined {
  return arr[0];
}
export function last<T>(arr: T[]): T | undefined {
  return arr.length ? arr[arr.length - 1] : undefined;
}

/** Compound annual growth rate, in percent, between two values over N periods. */
export function cagr(firstValue: number, lastValue: number, periods: number): number {
  if (firstValue <= 0 || periods <= 0) return 0;
  return (Math.pow(lastValue / firstValue, 1 / periods) - 1) * 100;
}

/** Simple percentage change. */
export function deltaPct(firstValue: number, lastValue: number): number {
  if (firstValue === 0) return 0;
  return ((lastValue - firstValue) / firstValue) * 100;
}

/** Absolute change. */
export function delta(firstValue: number, lastValue: number): number {
  return lastValue - firstValue;
}

/** Top N of an array by a numeric key, descending. */
export function topN<T>(arr: T[], key: (item: T) => number, n: number): T[] {
  return [...arr].sort((a, b) => key(b) - key(a)).slice(0, n);
}

/** 1-based rank of an item within an array by a numeric key (descending). */
export function rankBy<T>(arr: T[], key: (item: T) => number, match: (item: T) => boolean): number {
  const sorted = [...arr].sort((a, b) => key(b) - key(a));
  const i = sorted.findIndex(match);
  return i === -1 ? 0 : i + 1;
}

/** Mean of a numeric series. */
export function mean(values: number[]): number {
  if (!values.length) return 0;
  return values.reduce((s, v) => s + v, 0) / values.length;
}

/** Simple trailing moving average, aligned to the input length. */
export function movingAverage(values: number[], window: number): (number | null)[] {
  return values.map((_, i) => {
    if (i < window - 1) return null;
    const slice = values.slice(i - window + 1, i + 1);
    return mean(slice);
  });
}

/** Sum of a numeric key across an array. */
export function sumBy<T>(arr: T[], key: (item: T) => number): number {
  return arr.reduce((s, item) => s + key(item), 0);
}

/* ---------------------------------------------------------- contributions */

export interface Contribution {
  label: string;
  from: number;
  to: number;
  /** absolute change (to - from) */
  delta: number;
  /** share of the total absolute change, in percent */
  share: number;
}

/**
 * Contribution analysis: given matched pairs, work out how much each one moved
 * the total, and what share of the overall change it accounts for. Sorted by the
 * size of the movement. Useful for answering "what drove the change?".
 */
export function contributions(pairs: { label: string; from: number; to: number }[]): Contribution[] {
  const deltas = pairs.map((p) => p.to - p.from);
  const totalAbs = deltas.reduce((s, d) => s + Math.abs(d), 0);
  return pairs
    .map((p, i) => ({
      label: p.label,
      from: p.from,
      to: p.to,
      delta: deltas[i],
      share: totalAbs ? (deltas[i] / totalAbs) * 100 : 0,
    }))
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
}
