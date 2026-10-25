'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { nav, site } from '@/config/site';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

/** Header — brand + primary navigation. Collapses to a menu on small screens. */
export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href));

  return (
    <header className="site-header">
      <div className="wrap header-inner">
        <Link href="/" className="brand" onClick={() => setOpen(false)}>
          <span className="brand-mark" aria-hidden />
          <span className="brand-text">
            <strong>{site.shortName}</strong>
            <small>Data Dashboard</small>
          </span>
        </Link>

        <button className="nav-toggle" aria-expanded={open} aria-label="Toggle navigation" onClick={() => setOpen((v) => !v)}>
          ☰
        </button>

        <nav className={`site-nav${open ? ' open' : ''}`}>
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={isActive(item.href) ? 'active' : undefined}
              onClick={() => setOpen(false)}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <ThemeToggle />
      </div>
    </header>
  );
}
