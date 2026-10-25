import { describe, expect, it } from 'vitest';
import { cagr, contributions, deltaPct, mean, rankBy, sumBy, topN } from './analytics';

describe('deltaPct', () => {
  it('computes a percentage change', () => {
    expect(deltaPct(100, 110)).toBeCloseTo(10);
    expect(deltaPct(100, 90)).toBeCloseTo(-10);
  });
  it('guards against a zero base', () => {
    expect(deltaPct(0, 10)).toBe(0);
  });
});

describe('cagr', () => {
  it('matches a known growth rate', () => {
    // 100 → 121 over 2 years is 10% a year
    expect(cagr(100, 121, 2)).toBeCloseTo(10, 1);
  });
  it('returns 0 for non-positive inputs', () => {
    expect(cagr(0, 100, 5)).toBe(0);
    expect(cagr(100, 0, 5)).toBe(0);
  });
});

describe('contributions', () => {
  it('sorts by size of movement and shares sum to ~100%', () => {
    const c = contributions([
      { label: 'a', from: 100, to: 90 },
      { label: 'b', from: 100, to: 100 },
      { label: 'c', from: 100, to: 130 },
    ]);
    expect(c[0].label).toBe('c');
    expect(c[1].label).toBe('a');
    const totalShare = c.reduce((s, x) => s + Math.abs(x.share), 0);
    expect(totalShare).toBeCloseTo(100, 1);
  });
  it('handles no change at all', () => {
    const c = contributions([{ label: 'a', from: 5, to: 5 }]);
    expect(c[0].share).toBe(0);
  });
});

describe('small helpers', () => {
  it('mean / sumBy / topN behave', () => {
    expect(mean([1, 2, 3, 4])).toBe(2.5);
    expect(sumBy([{ v: 1 }, { v: 2 }], (r) => r.v)).toBe(3);
    expect(topN([{ v: 5 }, { v: 9 }, { v: 7 }], (r) => r.v, 2).map((r) => r.v)).toEqual([9, 7]);
  });
  it('rankBy returns the 1-based rank of the matching item', () => {
    const rows = [{ v: 5 }, { v: 9 }, { v: 7 }];
    expect(rankBy(rows, (r) => r.v, (r) => r.v === 9)).toBe(1);
    expect(rankBy(rows, (r) => r.v, (r) => r.v === 7)).toBe(2);
  });
});
