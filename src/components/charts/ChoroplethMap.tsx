'use client';

/**
 * ChoroplethMap — renders India as an SVG choropleth.
 *
 * Works at two levels from the same bundled file:
 *  - `state`: every district is coloured by its *state's* value (a state map)
 *  - `district`: each district is coloured by its own value
 */
import { useMemo, useState } from 'react';
import { NO_DATA, project, rankScale, type GeoCollection, type PathFeature } from '@/lib/geo';

interface Props {
  geo: GeoCollection;
  /** Value for a region, or undefined for "no data". */
  valueOf: (f: PathFeature) => number | undefined;
  /** Ramp endpoints (CSS colours). */
  from?: string;
  to?: string;
  format?: (v: number) => string;
  legendTitle?: string;
  /** Accessible label for the map. */
  ariaLabel?: string;
  /** Called when a region is clicked (used for drill-down). */
  onSelect?: (f: PathFeature) => void;
}

export function ChoroplethMap({
  geo,
  valueOf,
  from = '#e2e8f0',
  to = '#0f766e',
  format = (v) => Intl.NumberFormat('en-IN').format(Math.round(v)),
  legendTitle = 'Value',
  ariaLabel = 'choropleth map of India',
  onSelect,
}: Props) {
  const [hover, setHover] = useState<{ f: PathFeature; v?: number; x: number; y: number } | null>(null);

  const { projected, scale, min, max } = useMemo(() => {
    const projected = project(geo, 620);
    const vals = projected.features.map((f) => valueOf(f)).filter((v): v is number => typeof v === 'number');
    const min = vals.length ? Math.min(...vals) : 0;
    const max = vals.length ? Math.max(...vals) : 1;
    return { projected, scale: rankScale(vals, from, to), min, max };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geo, from, to]);

  return (
    <div className="map-wrap">
      <div className="map-canvas">
        <svg
          viewBox={`0 0 ${projected.width} ${projected.height}`}
          role="img"
          aria-label={ariaLabel}
          style={{ width: '100%', height: 'auto' }}
        >
          {projected.features.map((f, i) => {
            const v = valueOf(f);
            const isHover = hover?.f === f;
            return (
              <path
                key={i}
                d={f.d}
                fill={typeof v === 'number' ? scale(v) : NO_DATA}
                stroke={isHover ? 'var(--ink)' : 'rgba(15,23,42,0.16)'}
                strokeWidth={isHover ? 1.6 : 0.4}
                style={{ cursor: 'pointer', transition: 'fill .45s ease, stroke .12s ease, filter .12s ease', filter: isHover ? 'brightness(0.94)' : 'none' }}
                onClick={() => onSelect?.(f)}
                onMouseEnter={(e) =>
                  setHover({ f, v, x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY })
                }
                onMouseMove={(e) => setHover((h) => (h ? { ...h, x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY } : h))}
                onMouseLeave={() => setHover(null)}
              >
                <title>{`${f.district ? f.district + ', ' : ''}${f.state}: ${typeof v === 'number' ? format(v) : 'no data'}`}</title>
              </path>
            );
          })}
        </svg>

        {hover && (
          <div className="map-tip" style={{ left: hover.x, top: hover.y }}>
            <strong>{hover.f.district || '—'}</strong>
            <span>{hover.f.state}</span>
            <span>
              {typeof hover.v === 'number' ? format(hover.v) : 'no data'}
            </span>
          </div>
        )}
      </div>

      <div className="map-legend">
        <span className="map-legend-title">{legendTitle} · ranked shading</span>
        <div className="map-ramp" style={{ background: `linear-gradient(90deg, ${from}, ${to})` }} />
        <div className="map-ramp-labels">
          <span>{format(min)}</span>
          <span>{format(max)}</span>
        </div>
      </div>
    </div>
  );
}
