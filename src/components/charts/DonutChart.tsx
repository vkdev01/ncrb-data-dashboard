'use client';

/**
 * DonutChart — share-of-total ring. Pure SVG arcs, no dependency.
 * Renders a legend with each slice's percentage.
 */
import { useState } from 'react';

export interface Slice {
  name: string;
  value: number;
  color: string;
}

interface Props {
  slices: Slice[];
  size?: number;
  thickness?: number;
  valueFormat?: (v: number) => string;
}

export function DonutChart({
  slices,
  size = 200,
  thickness = 30,
  valueFormat = (v) => Intl.NumberFormat('en-IN').format(Math.round(v)),
}: Props) {
  const [active, setActive] = useState<number | null>(null);
  const total = slices.reduce((s, x) => s + x.value, 0) || 1;
  const r = (size - thickness) / 2;
  const c = size / 2;
  const circumference = 2 * Math.PI * r;

  let offset = 0;
  const arcs = slices.map((s) => {
    const frac = s.value / total;
    const arc = { ...s, frac, dash: frac * circumference, offset };
    offset += frac * circumference;
    return arc;
  });

  return (
    <div className="donut">
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} role="img" aria-label="share of total">
        <g transform={`rotate(-90 ${c} ${c})`}>
          {arcs.map((a, i) => (
            <circle
              key={a.name}
              cx={c}
              cy={c}
              r={r}
              fill="none"
              stroke={a.color}
              strokeWidth={active === i ? thickness + 6 : thickness}
              strokeDasharray={`${a.dash} ${circumference - a.dash}`}
              strokeDashoffset={-a.offset}
              style={{ transition: 'stroke-width .15s', cursor: 'pointer' }}
              onMouseEnter={() => setActive(i)}
              onMouseLeave={() => setActive(null)}
            />
          ))}
        </g>
        <text x={c} y={c - 2} textAnchor="middle" className="donut-total">
          {active === null ? valueFormat(total) : `${(arcs[active].frac * 100).toFixed(1)}%`}
        </text>
        <text x={c} y={c + 16} textAnchor="middle" className="donut-cap">
          {active === null ? 'total' : arcs[active].name.slice(0, 18)}
        </text>
      </svg>

      <ul className="donut-legend">
        {arcs.map((a, i) => (
          <li
            key={a.name}
            className={active === i ? 'on' : ''}
            onMouseEnter={() => setActive(i)}
            onMouseLeave={() => setActive(null)}
          >
            <i style={{ background: a.color }} />
            <span className="dl-name">{a.name}</span>
            <span className="dl-val">{(a.frac * 100).toFixed(1)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
