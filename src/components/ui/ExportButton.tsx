'use client';

import { downloadCsv, toCsv } from '@/lib/csv';

/** Small button that downloads the given rows as CSV. */
export function ExportButton({
  rows,
  filename,
  columns,
  label = 'CSV',
}: {
  rows: Record<string, unknown>[];
  filename: string;
  columns?: string[];
  label?: string;
}) {
  const disabled = !rows.length;
  return (
    <button
      className="btn-ghost"
      disabled={disabled}
      title={disabled ? 'Nothing to export' : `Download ${rows.length} rows as CSV`}
      onClick={() => downloadCsv(filename, toCsv(rows, columns))}
    >
      ↓ {label}
    </button>
  );
}
