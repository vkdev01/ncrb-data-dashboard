'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { domainOf, navForDomain } from '@/config/site';

/**
 * DomainTabs — a tab strip for the pages inside the current domain.
 * Rendered once in the layout, so every page gets the right tabs automatically.
 */
export function DomainTabs() {
  const pathname = usePathname();
  const domain = domainOf(pathname);
  const items = navForDomain(domain);
  if (items.length < 2) return null;

  return (
    <div className="domain-tabs-bar">
      <div className="wrap">
        <nav className="domain-tabs" aria-label={`${domain} pages`}>
          {items.map((item) => {
            const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href} className={`domain-tab${active ? ' active' : ''}`}>
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
