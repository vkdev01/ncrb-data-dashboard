import type { Metadata } from 'next';
import { JetBrains_Mono, Manrope } from 'next/font/google';
import './globals.css';
import { Header } from '@/components/layout/Header';
import { DomainTabs } from '@/components/layout/DomainTabs';
import { Footer } from '@/components/layout/Footer';
import { InsightsPanel } from '@/components/insights/InsightsPanel';
import { PageDataProvider } from '@/components/insights/PageDataContext';
import { site } from '@/config/site';

const manrope = Manrope({ subsets: ['latin'], variable: '--font-manrope', display: 'swap' });
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono-jb', display: 'swap' });

export const metadata: Metadata = {
  title: {
    default: site.name,
    template: `%s · ${site.shortName}`,
  },
  description: site.description,
  applicationName: site.name,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${manrope.variable} ${mono.variable}`}>
      <body>
        <PageDataProvider>
          <Header />
          <DomainTabs />
          <main className="wrap">{children}</main>
          <Footer />
          <InsightsPanel />
        </PageDataProvider>
      </body>
    </html>
  );
}
