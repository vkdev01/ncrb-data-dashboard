import type { ReactNode } from 'react';

/** Card — the standard content container. */
export function Card({
  title,
  caption,
  action,
  children,
  className = '',
}: {
  title?: string;
  caption?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`card ${className}`}>
      {(title || action) && (
        <header className="card-head">
          <div>
            {title ? <h3>{title}</h3> : null}
            {caption ? <p className="card-cap">{caption}</p> : null}
          </div>
          {action ? <div className="card-action">{action}</div> : null}
        </header>
      )}
      {children}
    </section>
  );
}

/** Grid — responsive auto-fit grid for cards. */
export function CardGrid({ children, min = 300 }: { children: ReactNode; min?: number }) {
  return (
    <div className="card-grid" style={{ ['--min' as string]: `${min}px` }}>
      {children}
    </div>
  );
}
