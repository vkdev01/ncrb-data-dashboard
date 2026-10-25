import { describe, expect, it } from 'vitest';
import { toCsv } from './csv';

describe('toCsv', () => {
  it('writes a header and rows', () => {
    const csv = toCsv([{ a: 1, b: 'x' }]);
    expect(csv.split('\n')[0]).toBe('a,b');
    expect(csv).toContain('1,x');
  });

  it('quotes cells containing commas, quotes or newlines', () => {
    const csv = toCsv([{ name: 'Saraikela, Kharsawan', note: 'he said "hi"' }]);
    expect(csv).toContain('"Saraikela, Kharsawan"');
    expect(csv).toContain('"he said ""hi"""');
  });

  it('renders null and undefined as empty', () => {
    const csv = toCsv([{ a: null, b: undefined }]);
    expect(csv.split('\n')[1]).toBe(',');
  });

  it('honours an explicit column order', () => {
    const csv = toCsv([{ a: 1, b: 2 }], ['b', 'a']);
    expect(csv.split('\n')[0]).toBe('b,a');
  });

  it('returns an empty string for no rows', () => {
    expect(toCsv([])).toBe('');
  });
});
