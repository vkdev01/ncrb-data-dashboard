# NCRB Data Dashboard

An interactive, fully static dashboard for India's **NCRB** (*National Crime Records Bureau*) statistics — national trends, offence heads, state-wise rates, crimes against women and cybercrime.

Built with **Next.js (App Router) + TypeScript**, exported as a static site and deployed to GitHub Pages. No server, no database, no API key.

> **Not an official NCRB product.** Figures are as published by NCRB and its re-publishers. Verify against the source reports before quoting. See the **About** page in the app for the full methodology and limitations.

---

## Quick start

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # static export → ./out
npm run typecheck  # tsc --noEmit
npm run fetch-data # refresh the bundled data snapshot
```

## What's in the app

| Route | What it shows |
|---|---|
| `/` | Headline KPIs, the ten-year national trend, IPC composition, top state rates |
| `/trends` | Year-wise totals, IPC vs SLL, and the population-normalised crime rate |
| `/crime-heads` | How recorded offences split across offence heads (all-IPC, women, cyber) |
| `/states` | State/UT comparison by crime rate, with a filterable, sortable table |
| `/women` | Crimes against women: trend, composition and state-wise rates |
| `/cyber` | Cybercrime FIRs, composition, and the I4C portal-vs-FIR reporting gap |
| `/about` | Methodology, sources and limitations |

## Architecture

```
src/
├── app/                      # routes (App Router) — one folder per page
│   ├── layout.tsx            # shell: fonts, header, footer
│   ├── globals.css           # design tokens + component styles
│   ├── page.tsx              # / (overview)
│   ├── trends/  crime-heads/  states/  women/  cyber/  about/
├── components/
│   ├── charts/               # LineChart, DonutChart, HorizontalBars (hand-rolled SVG)
│   ├── layout/               # Header, Footer
│   └── ui/                   # Card, StatCard, PageHeader, DataTable, LiveBadge
├── config/
│   ├── site.ts               # identity, navigation, source attribution
│   └── palette.ts            # chart colour tokens
└── lib/
    ├── data/
    │   ├── types.ts          # domain types (the contract)
    │   ├── sources.ts        # dataset registry: live URL + fallback
    │   ├── fallback.ts       # bundled snapshot (real NCRB-derived figures)
    │   └── client.ts         # fetch → fallback → cache
    ├── hooks/useDataset.ts   # renders snapshot instantly, upgrades to live
    ├── analytics.ts          # pure derived-metric helpers (CAGR, ranks, …)
    └── format.ts             # Indian number/percent formatting
scripts/fetch-data.mjs        # refresh the bundled snapshot
```

### The data layer, in one paragraph

Every dataset is registered once in `src/lib/data/sources.ts` with a **live URL** and a **bundled fallback**. `client.ts` tries the live source, falls back to the snapshot, and caches the result; `useDataset()` renders the snapshot immediately (so there is never a blank state) and swaps in the live payload when it arrives. A badge in each page header tells the reader which one they are seeing. **To add a dataset:** drop the JSON in, add one entry to `SOURCES`, and every hook, chart and table works with it — no page changes.

## Data sources

- **NCRB** — *Crime in India* reports (primary publisher) · <https://www.ncrb.gov.in/>
- **data.gov.in** — official *Crime in India* catalogues (ZIP downloads) · <https://www.data.gov.in/catalog/crime-india-2023>
- **Indian Data Project** — NCRB-derived JSON endpoints, CORS-enabled, no key (used as the live feed) · <https://indiandataproject.org/open-data>
- **OpenCity (CKAN)** — public-domain mirror of NCRB tables, including CSV resources · <https://data.opencity.in/>

NCRB does not publish a clean public API, and data.gov.in requires an API key — which is why the app reads a CORS-enabled NCRB-derived feed at runtime and ships a bundled snapshot for resilience.

## Deployment

Pushing to `main` triggers `.github/workflows/deploy.yml`, which installs, refreshes the data snapshot (best-effort), runs `next build` (static export to `./out`) and publishes it to GitHub Pages.

Because the site is a GitHub **project** page, production builds run under a `basePath` (`/ncrb-data-dashboard`) — see `next.config.mjs`.

## Limitations (short version)

Recorded offences are **not** a measure of underlying crime. Rates reflect reporting and registration as much as offending; offence heads are legal categories that change with statutes; and different chapters use different denominators and reference years. The About page lists these in full.
