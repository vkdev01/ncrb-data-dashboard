import type { ReactNode } from 'react';
import { LiveBadge } from './LiveBadge';

/** PageHeader — title, description and a data-provenance badge. */
export function PageHeader({
  title,
  description,
  live,
  status,
  source,
  children,
}: {
  title: string;
  description?: string;
  live?: boolean;
  status?: 'loading' | 'ready';
  source?: string;
  children?: ReactNode;
}) {
  return (
    <header className="page-head">
      <div className="page-head-main">
        <h1>{title}</h1>
        {description ? <p className="page-desc">{description}</p> : null}
      </div>
      <div className="page-head-side">
        {typeof live === 'boolean' && status ? <LiveBadge live={live} status={status} /> : null}
        {source ? <span className="source-line">Source: {source}</span> : null}
        {children}
      </div>
    </header>
  );
}
