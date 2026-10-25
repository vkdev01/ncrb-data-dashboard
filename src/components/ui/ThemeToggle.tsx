'use client';

import { useEffect, useState } from 'react';

type Mode = 'system' | 'light' | 'dark';
const KEY = 'ncrb-theme';

/** Light / dark / system toggle. Persists to localStorage and sets data-theme. */
export function ThemeToggle() {
  const [mode, setMode] = useState<Mode>('system');

  useEffect(() => {
    const saved = (localStorage.getItem(KEY) as Mode | null) ?? 'system';
    setMode(saved);
    apply(saved);
  }, []);

  function apply(next: Mode) {
    const root = document.documentElement;
    if (next === 'system') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', next);
  }

  function cycle() {
    const next: Mode = mode === 'system' ? 'light' : mode === 'light' ? 'dark' : 'system';
    setMode(next);
    localStorage.setItem(KEY, next);
    apply(next);
  }

  const icon = mode === 'light' ? '☀' : mode === 'dark' ? '☾' : '◐';
  return (
    <button className="theme-toggle" onClick={cycle} title={`Theme: ${mode} — click to change`} aria-label={`Theme: ${mode}`}>
      <span aria-hidden>{icon}</span>
    </button>
  );
}
