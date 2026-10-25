/**
 * Minimal CSV export. Kept dependency-free: values are quoted only when they
 * need it, and a UTF-8 BOM is prepended so Excel opens Indian-language text
 * correctly.
 */

function escapeCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  const s = String(value);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Build a CSV string from an array of flat records. */
export function toCsv(rows: Record<string, unknown>[], columns?: string[]): string {
  if (!rows.length) return '';
  const cols = columns ?? Object.keys(rows[0]);
  const header = cols.map(escapeCell).join(',');
  const body = rows.map((r) => cols.map((c) => escapeCell(r[c])).join(',')).join('\n');
  return `${header}\n${body}\n`;
}

/** Trigger a browser download of a CSV string. */
export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
