'use client';

/**
 * DataTable — a sortable, paginated table.
 *
 * Long tables are the norm in this app (689 districts, 36 states × 13 columns),
 * so pagination and a sticky header are built in rather than bolted on: a
 * 700-row table that renders all at once is slow and unreadable.
 *
 * The CSV export always contains every filtered row, not just the current page —
 * an export that silently dropped rows would be worse than no export.
 */
import { useEffect, useMemo, useState, type ReactNode } from 'react';
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
  /** Rows per page. Pass 0 to disable pagination and render everything. */
  pageSize?: number;
  /** Show the page-size selector. */
  showPageSize?: boolean;
}

const PAGE_SIZES = [10, 25, 50, 100];

export function DataTable<T>({
  rows,
  columns,
  initialSort,
  initialDir = 'desc',
  rowClassName,
  caption,
  exportName,
  csvRow,
  pageSize = 25,
  showPageSize = true,
}: Props<T>) {
  const [sortKey, setSortKey] = useState<string | undefined>(initialSort);
  const [dir, setDir] = useState<'asc' | 'desc'>(initialDir);
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(pageSize);

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

  const paginated = size > 0 && sorted.length > size;
  const pageCount = paginated ? Math.ceil(sorted.length / size) : 1;
  const current = Math.min(page, pageCount);
  const visible = paginated ? sorted.slice((current - 1) * size, current * size) : sorted;

  // A new filter or sort should put the reader back at the top, not on page 7.
  useEffect(() => {
    setPage(1);
  }, [rows.length, sortKey, dir, size]);

  function toggle(key: string) {
    if (sortKey === key) {
      setDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setDir('desc');
    }
  }

  const from = sorted.length === 0 ? 0 : (current - 1) * (paginated ? size : sorted.length) + 1;
  const to = paginated ? Math.min(current * size, sorted.length) : sorted.length;

  return (
    <div className="table-block">
      <div className="table-tools">
        <span className="muted" style={{ fontSize: '0.78rem' }}>
          {sorted.length === 0
            ? 'No rows'
            : paginated
              ? `Showing ${from}–${to} of ${sorted.length}`
              : `${sorted.length} row${sorted.length === 1 ? '' : 's'}`}
        </span>
        <div className="table-tools-right">
          {showPageSize && paginated ? (
            <label className="table-size">
              <span className="muted">Rows</span>
              <select value={size} onChange={(e) => setSize(Number(e.target.value))} aria-label="Rows per page">
                {PAGE_SIZES.map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
                <option value={0}>All</option>
              </select>
            </label>
          ) : null}
          {exportName && csvRow ? <ExportButton rows={sorted.map(csvRow)} filename={exportName} /> : null}
        </div>
      </div>

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
            {visible.map((row, i) => (
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

      {paginated ? (
        <div className="pager">
          <button className="btn-ghost" onClick={() => setPage(1)} disabled={current === 1} aria-label="First page">«</button>
          <button className="btn-ghost" onClick={() => setPage(current - 1)} disabled={current === 1}>Prev</button>
          <span className="pager-info">Page {current} of {pageCount}</span>
          <button className="btn-ghost" onClick={() => setPage(current + 1)} disabled={current === pageCount}>Next</button>
          <button className="btn-ghost" onClick={() => setPage(pageCount)} disabled={current === pageCount} aria-label="Last page">»</button>
        </div>
      ) : null}
    </div>
  );
}
