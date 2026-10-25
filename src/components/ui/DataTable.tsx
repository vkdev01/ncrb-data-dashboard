'use client';

/**
 * DataTable — a sortable table. Click a header to sort by that column; click
 * again to reverse. Column definitions keep it reusable across pages.
 */
import { useMemo, useState, type ReactNode } from 'react';
import { ExportButton } from './ExportButton';

export interface Column<T> {
  key: string;
  header: string;
  align?: 'left' | 'right';
  /** Sort accessor — return a number or string. */
  sortValue?: (row: T) => number | string;
  render: (row: T) => ReactNode;
  /** Hint for column width, e.g. "40%". */
  width?: string;
}

interface Props<T> {
  rows: T[];
  columns: Column<T>[];
  initialSort?: string;
  initialDir?: 'asc' | 'desc';
  rowClassName?: (row: T) => string;
  caption?: string;
  /** When set, a CSV download button appears for the current (sorted) rows. */
  exportName?: string;
  csvRow?: (row: T) => Record<string, unknown>;
}

export function DataTable<T>({
  rows,
  columns,
  initialSort,
  initialDir = 'desc',
  rowClassName,
  caption,
  exportName,
  csvRow,
}: Props<T>) {
  const [sortKey, setSortKey] = useState<string | undefined>(initialSort);
  const [dir, setDir] = useState<'asc' | 'desc'>(initialDir);

  const sorted = useMemo(() => {
    const col = columns.find((c) => c.key === sortKey);
    if (!col?.sortValue) return rows;
    const accessor = col.sortValue;
    return [...rows].sort((a, b) => {
      const va = accessor(a);
      const vb = accessor(b);
      const cmp = typeof va === 'number' && typeof vb === 'number' ? va - vb : String(va).localeCompare(String(vb));
      return dir === 'asc' ? cmp : -cmp;
    });
  }, [rows, columns, sortKey, dir]);

  function toggle(key: string) {
    if (sortKey === key) {
      setDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setDir('desc');
    }
  }

  return (
    <div className="table-block">
      {exportName && csvRow ? (
        <div className="table-tools">
          <span className="muted" style={{ fontSize: '0.78rem' }}>{sorted.length} rows</span>
          <ExportButton rows={sorted.map(csvRow)} filename={exportName} />
        </div>
      ) : null}
      <div className="table-wrap">
        <table className="dtable">
        {caption ? <caption>{caption}</caption> : null}
        <thead>
          <tr>
            {columns.map((c) => (
              <th
                key={c.key}
                style={{ textAlign: c.align ?? 'left', width: c.width }}
                className={c.sortValue ? 'sortable' : undefined}
                onClick={c.sortValue ? () => toggle(c.key) : undefined}
                aria-sort={sortKey === c.key ? (dir === 'asc' ? 'ascending' : 'descending') : 'none'}
              >
                {c.header}
                {c.sortValue && sortKey === c.key ? <span className="sort-caret">{dir === 'asc' ? '▲' : '▼'}</span> : null}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row, i) => (
            <tr key={i} className={rowClassName?.(row)}>
              {columns.map((c) => (
                <td key={c.key} style={{ textAlign: c.align ?? 'left' }}>
                  {c.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        </table>
      </div>
    </div>
  );
}
