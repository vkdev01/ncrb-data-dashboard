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
