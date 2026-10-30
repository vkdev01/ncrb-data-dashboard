'use client';

/**
 * PopulationPyramid — males on the left, females on the right, one bar per
 * five-year age band, longest bar at the bottom. Pure SVG, no dependency.
 *
 * A pyramid is the one chart where the *shape* carries the argument: a wide base
 * means a young population with built-in momentum, a narrow base means fertility
 * has already fallen and the bulge will age upward over the next thirty years.
 */
import type { AgeGroup } from '@/lib/data/age';

interface Props {
  groups: AgeGroup[];
  /** Optional second series drawn behind the first, for comparison. */
  compare?: AgeGroup[];
  compareLabel?: string;
  height?: number;
}

export function PopulationPyramid({ groups, compare, compareLabel, height }: Props) {
  if (!groups.length) return <div className="chart-empty">No data</div>;

  const rows = groups.filter((g) => g.g !== 'Unknown');
  const max = Math.max(
    ...rows.map((g) => Math.max(g.male, g.female)),
    ...(compare ?? []).map((g) => Math.max(g.male, g.female)),
  );
  const rowH = 20;
  const gap = 3;
  const W = 720;
  const mid = W / 2;
  const labelW = 46;
  const half = mid - labelW - 10;
  const H = height ?? rows.length * (rowH + gap) + 34;

  const xFor = (v: number) => (v / max) * half;

  return (
    <div className="chart">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Population pyramid, Census 2011" style={{ width: '100%', height: 'auto' }}>
        <text x={mid - labelW - 10} y={12} textAnchor="end" className="axis">Male</text>
        <text x={mid + labelW + 10} y={12} textAnchor="start" className="axis">Female</text>

        {rows.map((g, i) => {
          const y = 22 + i * (rowH + gap);
          const cg = compare?.find((c) => c.g === g.g);
          return (
            <g key={g.g}>
              {cg ? (
                <>
                  <rect x={mid - labelW - xFor(cg.male)} y={y} width={xFor(cg.male)} height={rowH} fill="var(--c4)" opacity={0.28} />
                  <rect x={mid + labelW} y={y} width={xFor(cg.female)} height={rowH} fill="var(--c4)" opacity={0.28} />
                </>
              ) : null}
              <rect x={mid - labelW - xFor(g.male)} y={y} width={xFor(g.male)} height={rowH} fill="var(--c1)">
                <title>{`${g.g} · male ${g.male.toLocaleString('en-IN')}`}</title>
              </rect>
              <rect x={mid + labelW} y={y} width={xFor(g.female)} height={rowH} fill="var(--c2)">
                <title>{`${g.g} · female ${g.female.toLocaleString('en-IN')}`}</title>
              </rect>
              <text x={mid} y={y + rowH / 2 + 4} textAnchor="middle" className="axis" style={{ fontSize: 10 }}>{g.g}</text>
            </g>
          );
        })}
      </svg>

      <div className="chart-readout muted">
        {compareLabel ? `${compareLabel} drawn behind, faded. ` : ''}
        Longest bar: {rows.reduce((a, b) => (b.total > a.total ? b : a), rows[0]).g}
      </div>
    </div>
  );
}
