import Link from 'next/link';
import { site, sources } from '@/config/site';

/** Footer — attribution and a standing caveat about the data. */
export function Footer() {
  return (
    <footer className="site-footer">
      <div className="wrap footer-grid">
        <div>
          <div className="footer-brand">{site.name}</div>
          <p className="footer-note">
            Figures are as published by the National Crime Records Bureau and its re-publishers. Crime statistics
            reflect <strong>recorded</strong> offences — they are shaped by reporting behaviour, registration
            practice and population, and are not a direct measure of underlying crime.
          </p>
          <p className="footer-note">
            <a href={site.repo} target="_blank" rel="noreferrer">
              Source code on GitHub
            </a>
          </p>
        </div>
        <div>
          <div className="footer-head">Sources</div>
          <ul className="footer-list">
            {sources.map((s) => (
              <li key={s.name}>
                <a href={s.url} target="_blank" rel="noreferrer">
                  {s.name}
                </a>
                <span>{s.note}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="wrap footer-base">
        <span>
          Not an official NCRB product. Verify figures against the source reports before publishing.
        </span>
        <Link href="/about">Methodology →</Link>
      </div>
    </footer>
  );
}
