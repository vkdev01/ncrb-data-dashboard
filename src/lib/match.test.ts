import { describe, expect, it } from 'vitest';
import { buildDistrictIndex, levenshtein, normName, resolveAlias } from './match';

describe('normName', () => {
  it('ignores case, spaces, hyphens and punctuation', () => {
    expect(normName('Saraikela-Kharsawan')).toBe(normName('Saraikela Kharsawan'));
    expect(normName('S.P.S. Nellore')).toBe('spsnellore');
    expect(normName('')).toBe('');
  });
});

describe('levenshtein', () => {
  it('measures edit distance', () => {
    expect(levenshtein('sahibganj', 'sahebganj')).toBe(1);
    expect(levenshtein('singhbhum', 'singhbum')).toBe(1);
    expect(levenshtein('abc', 'abc')).toBe(0);
  });
});

describe('resolveAlias', () => {
  it('maps documented renames', () => {
    expect(resolveAlias('ahmednagar')).toBe('ahilyanagar');
    expect(resolveAlias('osmanabad')).toBe('dharashiv');
    expect(resolveAlias('notarenamed')).toBe('notarenamed');
  });
});

describe('buildDistrictIndex', () => {
  const rows = [
    { d: 'Sahebganj', s: 'Jharkhand', v: 38 },
    { d: 'East Singhbum', s: 'Jharkhand', v: 86 },
    { d: 'Ranchi', s: 'Jharkhand', v: 135 },
    { d: 'Ahilyanagar', s: 'Maharashtra', v: 42 },
  ];

  it('matches exactly after normalisation', () => {
    const idx = buildDistrictIndex(rows);
    expect(idx.get('Jharkhand', 'Sahebganj')?.value).toBe(38);
    expect(idx.get('Jharkhand', 'sahebganj')?.how).toBe('exact');
  });

  it('falls back to a fuzzy match within the same state', () => {
    const idx = buildDistrictIndex(rows);
    // boundary file spells it "Sahibganj", data says "Sahebganj"
    const hit = idx.get('Jharkhand', 'Sahibganj');
    expect(hit?.value).toBe(38);
    expect(hit?.how).toBe('fuzzy');
    // "East Singhbhum" vs "East Singhbum"
    expect(idx.get('Jharkhand', 'East Singhbhum')?.value).toBe(86);
  });

  it('applies rename aliases', () => {
    const idx = buildDistrictIndex(rows);
    expect(idx.get('Maharashtra', 'Ahmednagar')?.value).toBe(42);
  });

  it('does not match across states', () => {
    const idx = buildDistrictIndex(rows);
    expect(idx.get('Kerala', 'Ranchi')).toBeUndefined();
  });

  it('reports miss stats', () => {
    const idx = buildDistrictIndex(rows);
    idx.get('Jharkhand', 'Nowhere');
    expect(idx.stats.miss).toBe(1);
  });
});
