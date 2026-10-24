/**
 * Chart palette. Values reference CSS custom properties so the same series
 * colours adapt automatically to light and dark mode.
 */
export const palette = [
  'var(--c1)',
  'var(--c2)',
  'var(--c3)',
  'var(--c4)',
  'var(--c5)',
  'var(--c6)',
  'var(--c7)',
  'var(--c8)',
];

/** Colour for a slice/row at index i, wrapping the palette. */
export function colorAt(i: number): string {
  return palette[i % palette.length];
}

/** Stable colour for a known series name (so charts stay consistent). */
export const namedColors: Record<string, string> = {
  total: 'var(--c1)',
  ipc: 'var(--c3)',
  sll: 'var(--c2)',
  rate: 'var(--c4)',
  cases: 'var(--c1)',
};
