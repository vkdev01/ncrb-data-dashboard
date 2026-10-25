'use client';

/**
 * LineChart — multi-series SVG line chart with a shared hover readout.
 *
 * Deliberately dependency-free: everything is computed here and rendered as
 * inline SVG, so it stays small, themeable via CSS variables and easy to extend.
 */
import { useMemo, useState } from 'react';

export interface Point {
  x: string;
  y: number;
}
export interface Series {
  name: string;
  color: string;
  points: Point[];
  dashed?: boolean;
  area?: boolean;
}

interface Props {
  series: Series[];
  height?: number;
  yFormat?: (v: number) => string;
  valueFormat?: (v: number) => string;
  yTicks?: number;
  /** Format an x tick label (defaults to the raw value). */
  xLabel?: (x: string) => string;
}

const PAD = { top: 16, right: 18, bottom: 30, left: 54 };
const W = 720;

export function LineChart({
  series,
  height = 260,
  yFormat = (v) => Intl.NumberFormat('en-IN').format(Math.round(v)),
  valueFormat,
  yTicks = 4,
  xLabel,
}: Props) {
  const [hover, setHover] = useState<number | null>(null);
  const vf = valueFormat ?? yFormat;

  const { xs, lo, hi, pathFor, xAt, yAt } = useMemo(() => {
    const xs = series[0]?.points.map((p) => p.x) ?? [];
    const all = series.flatMap((s) => s.points.map((p) => p.y));
    let lo = Math.min(...all);
    let hi = Math.max(...all);
    if (lo === hi) {
      lo -= 1;
      hi += 1;
    }
    const padY = (hi - lo) * 0.12;
    lo -= padY;
    hi += padY;
    if (Math.min(...all) >= 0 && lo < 0) lo = 0;

    const plotW = W - PAD.left - PAD.right;
    const plotH = height - PAD.top - PAD.bottom;
    const xAt = (i: number) => PAD.left + (xs.length <= 1 ? 0 : (i / (xs.length - 1)) * plotW);
    const yAt = (v: number) => height - PAD.bottom - ((v - lo) / (hi - lo || 1)) * plotH;

    const pathFor = (s: Series) =>
      s.points.map((p, i) => `${i ? 'L' : 'M'}${xAt(i).toFixed(1)} ${yAt(p.y).toFixed(1)}`).join(' ');

    return { xs, lo, hi, pathFor, xAt, yAt };
  }, [series, height]);

  if (!series.length || !xs.length) {
    return <div className="chart-empty">No data</div>;
  }

  const tickIdx = xs.map((_, i) => i).filter((i) => i % Math.ceil(xs.length / 6) === 0 || i === xs.length - 1);

  return (
    <div className="chart">
      <svg viewBox={`0 0 ${W} ${height}`} role="img" aria-label="line chart" style={{ width: '100%', height: 'auto' }}>
        {/* gridlines + y labels */}
        {Array.from({ length: yTicks + 1 }).map((_, i) => {
          const v = lo + ((hi - lo) * i) / yTicks;
          const y = yAt(v);
          return (
            <g key={i}>
              <line className="gridline" x1={PAD.left} x2={W - PAD.right} y1={y} y2={y} />
              <text className="axis" x={PAD.left - 8} y={y + 3.5} textAnchor="end">
                {yFormat(v)}
              </text>
            </g>
          );
        })}

        {/* x labels */}
        {tickIdx.map((i) => (
          <text key={i} className="axis" x={xAt(i)} y={height - 10} textAnchor="middle">
            {xLabel ? xLabel(xs[i]) : xs[i]}
          </text>
        ))}

        {/* series */}
        {series.map((s) => (
          <g key={s.name}>
            {s.area && (
              <path
                d={`${pathFor(s)} L${xAt(xs.length - 1)} ${yAt(lo)} L${xAt(0)} ${yAt(lo)} Z`}
                fill={s.color}
                opacity={0.08}
              />
            )}
            <path
              d={pathFor(s)}
              fill="none"
              stroke={s.color}
              strokeWidth={2.6}
              strokeLinejoin="round"
              strokeLinecap="round"
              strokeDasharray={s.dashed ? '6 5' : undefined}
            />
          </g>
        ))}

        {/* hover */}
        {hover !== null && (
          <line className="hitline" x1={xAt(hover)} x2={xAt(hover)} y1={PAD.top} y2={height - PAD.bottom} />
        )}
        {hover !== null &&
          series.map((s) => (
            <circle key={s.name} cx={xAt(hover)} cy={yAt(s.points[hover].y)} r={4.5} fill={s.color} stroke="#fff" strokeWidth={2} />
          ))}

        {/* hit layer */}
        <rect
          x={PAD.left}
          y={PAD.top}
          width={W - PAD.left - PAD.right}
          height={height - PAD.top - PAD.bottom}
          fill="transparent"
          onMouseLeave={() => setHover(null)}
          onMouseMove={(e) => {
            const box = (e.currentTarget as SVGRectElement).getBoundingClientRect();
            const rel = ((e.clientX - box.left) / box.width) * (W - PAD.left - PAD.right);
            const i = Math.round((rel / (W - PAD.left - PAD.right)) * (xs.length - 1));
            setHover(Math.max(0, Math.min(xs.length - 1, i)));
          }}
        />
      </svg>

      {hover !== null && (
        <div className="chart-readout">
          <strong>{xs[hover]}</strong>
          {series.map((s) => (
            <span key={s.name}>
              <i style={{ background: s.color }} />
              {s.name}: <b>{vf(s.points[hover].y)}</b>
            </span>
          ))}
        </div>
      )}

      <div className="chart-legend">
        {series.map((s) => (
          <span key={s.name}>
            <i style={{ background: s.color }} />
            {s.name}
          </span>
        ))}
      </div>
    </div>
  );
}
