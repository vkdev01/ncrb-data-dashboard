'use client';

/**
 * HorizontalBars — ranked bar list. Used for crime-head composition and
 * state-wise rates, where reading the ranking matters more than axis precision.
 */
interface Item {
  label: string;
  value: number;
  note?: string;
  highlight?: boolean;
}

interface Props {
  items: Item[];
  valueFormat?: (v: number) => string;
  color?: string;
  highlightColor?: string;
  /** Sort descending by value. Default true. */
  sort?: boolean;
}

export function HorizontalBars({
  items,
  valueFormat = (v) => Intl.NumberFormat('en-IN').format(Math.round(v)),
  color = 'var(--accent)',
  highlightColor = 'var(--accent-2)',
  sort = true,
}: Props) {
  if (!items.length) return <div className="chart-empty">No data</div>;
  const rows = sort ? [...items].sort((a, b) => b.value - a.value) : items;
  const max = Math.max(...rows.map((r) => r.value)) || 1;

  return (
    <div className="hbars">
      {rows.map((r) => (
        <div className={`hbar${r.highlight ? ' is-highlight' : ''}`} key={r.label}>
          <div className="hbar-label" title={r.label}>
            {r.label}
            {r.note ? <span className="hbar-note">{r.note}</span> : null}
          </div>
          <div className="hbar-track">
            <div
              className="hbar-fill"
              style={{
                width: `${(r.value / max) * 100}%`,
                background: r.highlight ? highlightColor : color,
              }}
            />
          </div>
          <div className="hbar-value">{valueFormat(r.value)}</div>
        </div>
      ))}
    </div>
  );
}
