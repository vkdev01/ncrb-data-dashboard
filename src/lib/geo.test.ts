import { describe, expect, it } from 'vitest';
import { project, rankScale, sequentialScale, type GeoCollection } from './geo';

const geo: GeoCollection = {
  type: 'FeatureCollection',
  features: [
    {
      properties: { d: 'Alpha', s: 'State One' },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [70, 20],
            [72, 20],
            [72, 22],
            [70, 22],
            [70, 20],
          ],
        ],
      },
    },
    {
      properties: { d: '', s: 'State Two' },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [75, 10],
            [78, 10],
            [78, 14],
            [75, 14],
            [75, 10],
          ],
        ],
      },
    },
  ],
};

describe('project', () => {
  it('skips features with no district name (the state overlays)', () => {
    const p = project(geo, 620);
    expect(p.features).toHaveLength(1);
    expect(p.features[0].district).toBe('Alpha');
  });

  it('produces a sane aspect ratio, not a squashed sliver', () => {
    const p = project(geo, 620);
    expect(p.width).toBe(620);
    // India-ish extents must not collapse to a few pixels tall
    expect(p.height).toBeGreaterThan(50);
    expect(p.height).toBeLessThan(2000);
  });

  it('emits closed SVG paths', () => {
    const p = project(geo, 620);
    expect(p.features[0].d.startsWith('M')).toBe(true);
    expect(p.features[0].d.endsWith('Z')).toBe(true);
  });
});

describe('rankScale', () => {
  it('gives the maximum the darkest colour and ranks by position', () => {
    const s = rankScale([1, 2, 3, 100]);
    // 100 is the highest, so it must be fully dark (the `to` end)
    expect(s(100)).not.toBe(s(1));
    expect(s(3)).not.toBe(s(100));
  });

  it('handles an empty value list', () => {
    const s = rankScale([]);
    expect(s(5)).toBe('var(--surface-3)');
  });

  it('does not collapse a skewed distribution the way a linear ramp does', () => {
    const skewed = [1, 1, 1, 1, 1, 1, 1, 1, 1, 900];
    const rank = rankScale(skewed);
    const lin = sequentialScale(Math.min(...skewed), Math.max(...skewed));
    // under a linear ramp, a value of 1 sits at the very pale end
    expect(lin(1)).not.toBe(rank(1));
  });
});
