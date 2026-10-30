'use client';

/**
 * ScatterPlot — two census measures against each other, one dot per state.
 *
 * Used by the cross-metric page: the interesting thing about Indian districts and
 * states is rarely a single ranking, it is where a unit sits when you plot two
 * measures together. Median crosshairs turn the plot into four readable quadrants.
 */
import { useMemo, useState } from 'react';

export interface ScatterPoint {
  label: string;
  x: number;
  y: number;
  /** Label this point even when it is not an extreme. */
  always?: boolean;
  highlight?: boolean;
}

interface Props {
  points: ScatterPoint[];
  xLabel: string;
  yLabel: string;
  xFormat?: (v: number) => string;
  yFormat?: (v: number) => string;
  /** Median lines, when supplied, are drawn and the quadrants are labelled. */
  medianX?: number;
  medianY?: number;
  quadrantLabels?: [string, string, string, string];
  height?: number;
  onSelect?: (label: string) => void;
}

const PAD = { top: 18, right: 18, bottom: 40, left: 56 };
const W = 720;

export function ScatterPlot({
  points,
  xLabel,
  yLabel,
  xFormat = (v) => v.toFixed(0),
  yFormat = (v) => v.toFixed(0),
  medianX,
  medianY,
  quadrantLabels,
  height = 360,
  onSelect,
}: Props) {
  const [hover, setHover] = useState<ScatterPoint | null>(null);

  const { xs, ys, xAt, yAt, sx, sy, lo, hi } = useMemo(() => {
    const xs = points.map((p) => p.x);
    const ys = points.map((p) => p.y);
    const pad = (arr: number[]) => {
      const mn = Math.min(...arr);
      const mx = Math.max(...arr);
      const d = (mx - mn || 1) * 0.08;
      return [mn - d, mx + d] as const;
    };
    const [x0, x1] = pad(xs);
    const [y0, y1] = pad(ys);
    const innerW = W - PAD.left - PAD.right;
    const innerH = height - PAD.top - PAD.bottom;
    const xAt = (v: number) => PAD.left + ((v - x0) / (x1 - x0)) * innerW;
    const yAt = (v: number) => PAD.top + innerH - ((v - y0) / (y1 - y0)) * innerH;
    return { xs, ys, xAt, yAt, sx: [x0, x1] as const, sy: [y0, y1] as const, lo: [x0, x1] as const, hi: [y0, y1] as const };
  }, [points, height]);

  if (!points.length) return <div className="chart-empty">No data</div>;

  const labelled = points.filter((p) => p.always || p.highlight).slice(0, 18);

  return (
    <div className="chart">
      <svg
        viewBox={`0 0 ${W} ${height}`}
        role="img"
        aria-label={`Scatter plot of ${yLabel} against ${xLabel}, ${points.length} states`}
        style={{ width: '100%', height: 'auto' }}
      >
        {/* gridlines */}
        {[0, 0.25, 0.5, 0.75, 1].map((t) => (
          <line
            key={`g${t}`}
            x1={PAD.left}
            x2={W - PAD.right}
            y1={PAD.top + (height - PAD.top - PAD.bottom) * t}
            y2={PAD.top + (height - PAD.top - PAD.bottom) * t}
            className="gridline"
          />
        ))}

        {/* median crosshairs */}
        {typeof medianX === 'number' ? (
          <line x1={xAt(medianX)} x2={xAt(medianX)} y1={PAD.top} y2={height - PAD.bottom} stroke="var(--border-strong)" strokeDasharray="4 4" />
        ) : null}
        {typeof medianY === 'number' ? (
          <line x1={PAD.left} x2={W - PAD.right} y1={yAt(medianY)} y2={yAt(medianY)} stroke="var(--border-strong)" strokeDasharray="4 4" />
        ) : null}

        {quadrantLabels && typeof medianX === 'number' && typeof medianY === 'number' ? (
          <>
            <text x={PAD.left + 6} y={PAD.top + 12} className="axis" textAnchor="start">{quadrantLabels[0]}</text>
            <text x={W - PAD.right - 6} y={PAD.top + 12} className="axis" textAnchor="end">{quadrantLabels[1]}</text>
            <text x={PAD.left + 6} y={height - PAD.bottom - 6} className="axis" textAnchor="start">{quadrantLabels[2]}</text>
            <text x={W - PAD.right - 6} y={height - PAD.bottom - 6} className="axis" textAnchor="end">{quadrantLabels[3]}</text>
          </>
        ) : null}

        {/* dots */}
        {points.map((p) => (
          <circle
            key={p.label}
            cx={xAt(p.x)}
            cy={yAt(p.y)}
            r={hover?.label === p.label ? 6.5 : p.highlight ? 5 : 3.6}
            fill={p.highlight ? 'var(--accent-2)' : 'var(--accent)'}
            fillOpacity={hover && hover.label !== p.label ? 0.45 : 0.85}
            stroke="var(--surface)"
            strokeWidth={1}
            style={{ cursor: onSelect ? 'pointer' : 'default', transition: 'r .12s' }}
            onMouseEnter={() => setHover(p)}
            onMouseLeave={() => setHover(null)}
            onClick={() => onSelect?.(p.label)}
          >
            <title>{`${p.label}: ${xLabel} ${xFormat(p.x)}, ${yLabel} ${yFormat(p.y)}`}</title>
          </circle>
        ))}

        {/* labels for extremes and highlights */}
        {labelled.map((p) => (
          <text
            key={`l-${p.label}`}
            x={xAt(p.x) + 7}
            y={yAt(p.y) + 3.5}
            className="axis"
            style={{ fontSize: 9.5 }}
          >
            {p.label}
          </text>
        ))}

        {/* axes */}
        <text x={(PAD.left + W - PAD.right) / 2} y={height - 8} textAnchor="middle" className="axis">
          {xLabel} · {xFormat(sx[0])} to {xFormat(sx[1])}
        </text>
        <text x={14} y={(PAD.top + height - PAD.bottom) / 2} textAnchor="middle" className="axis" transform={`rotate(-90 14 ${(PAD.top + height - PAD.bottom) / 2})`}>
          {yLabel}
        </text>
      </svg>

      {hover ? (
        <div className="chart-readout">
          <strong>{hover.label}</strong> — {xLabel}: {xFormat(hover.x)} · {yLabel}: {yFormat(hover.y)}
        </div>
      ) : (
        <div className="chart-readout muted">
          Hover a dot. {points.length} states plotted.
        </div>
      )}
    </div>
  );
}
