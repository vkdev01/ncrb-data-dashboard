'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { domainEntry, domainOf, domains, site } from '@/config/site';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

/** Header — brand + the top-level domains. Sub-pages live in the tab strip. */
export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const current = domainOf(pathname);

  return (
    <header className="site-header">
      <div className="wrap header-inner">
        <Link href="/" className="brand">
          <span className="brand-mark" aria-hidden />
          <span className="brand-text">
            <span className="brand-name">{site.name}</span>
            <span className="brand-sub">{site.tagline}</span>
          </span>
        </Link>

        <button
          className="nav-toggle"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-label="Toggle navigation"
        >
          ☰
        </button>

        <nav className={`site-nav${open ? ' open' : ''}`}>
          {domains.map((d) => (
            <Link
              key={d.id}
              href={domainEntry(d.id)}
              className={`nav-link${current === d.id ? ' active' : ''}`}
              onClick={() => setOpen(false)}
            >
              {d.label}
            </Link>
          ))}
        </nav>

        <ThemeToggle />
      </div>
    </header>
  );
}
