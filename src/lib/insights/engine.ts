/**
 * The insights engine.
 *
 * A page-scoped question answerer that runs entirely in the browser. It does
 * three things, in this order:
 *
 *   1. **intent**   — what kind of question is this (top, bottom, compare, rank,
 *                     average, distribution, correlation, change, explain,
 *                     summarise, count)?
 *   2. **entities** — which measure and which places is it about, matched against
 *                     the page's own series with normalisation and edit distance
 *                     so "kerla" still finds Kerala.
 *   3. **answer**   — computed from the series, never from a language model. Every
 *                     number in an answer is arithmetic over the same data the
 *                     page renders, so an answer can always be checked against
 *                     the chart beside it.
 *
 * The result is deliberately narrow and honest: it answers questions about the
 * data on the page it is attached to, and says so when a question is outside
 * that. If a model is configured (see InsightsPanel) the same context is handed
 * to it instead, and the UI labels which engine produced the answer.
 */
import { median, pearson } from '@/lib/census';

export interface SeriesPoint {
  name: string;
  value: number;
}

export interface Series {
  id: string;
  /** Full label, e.g. "Literacy rate". */
  label: string;
  /** Short label used in prose and tables. */
  short: string;
  unit: string;
  format: (v: number) => string;
  points: SeriesPoint[];
  /** true when higher is the better outcome, false when lower is, null when neither. */
  higherIsBetter?: boolean | null;
  note?: string;
}

export interface PageContext {
  route: string;
  title: string;
  blurb: string;
  series: Series[];
  /** Honest limits, surfaced in summaries. */
  caveats: string[];
  source: string;
  /** Example questions shown as chips. */
  prompts?: string[];
}

export interface AnswerTable {
  head: string[];
  rows: string[][];
}

export interface Answer {
  intent: string;
  /** Main prose answer. Plain text with **bold** allowed. */
  text: string;
  bullets?: string[];
  table?: AnswerTable;
  seriesId?: string;
  /** 0–1, how sure the parser is that it understood the question. */
  confidence: number;
}

/* ------------------------------------------------------------------ helpers */

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev.splice(0, prev.length, ...cur);
  }
  return prev[b.length];
}

const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

function describe(values: number[], format: (v: number) => string): string {
  if (!values.length) return 'no values';
  const sorted = [...values].sort((a, b) => a - b);
  const lo = sorted[0];
  const hi = sorted[sorted.length - 1];
  return `range ${format(lo)} to ${format(hi)}, median ${format(median(values))}, mean ${format(mean(values))}`;
}

/* -------------------------------------------------------------- synonyms */

/** Words that point at a measure, beyond the label itself. */
const SERIES_SYNONYMS: Record<string, string[]> = {
  literacy: ['literate', 'reading', 'education', 'educated'],
  sexRatio: ['sex ratio', 'women per', 'females per', 'gender ratio'],
  childSexRatio: ['child sex ratio', 'csr', 'girls per', 'juvenile sex ratio', 'son preference'],
  urbanPct: ['urban', 'urbanisation', 'urbanization', 'city share', 'towns'],
  ruralPct: ['rural', 'village share'],
  growth: ['growth', 'decadal', 'grew', 'growing', 'increase in population'],
  density: ['density', 'crowded', 'persons per', 'per square'],
  pop2011: ['population', 'people', 'populous', 'inhabitants', 'size'],
  area: ['area', 'land', 'size in km', 'square kilometre'],
  females: ['women', 'female population'],
  literacyGap: ['gap', 'gender gap', 'difference between male and female'],
  urbanPop: ['urban population', 'city population', 'urban people'],
  crimeRate: ['crime rate', 'crime', 'cases per', 'offending'],
  ageShare: ['age', 'young', 'old', 'working age', 'dependency'],
  cityGrowth: ['growth', 'grew', 'fastest growing'],
};

function seriesScore(q: string, s: Series): number {
  const hay = norm(`${s.label} ${s.short} ${s.id}`);
  let score = 0;
  const nq = norm(q);
  if (nq.includes(norm(s.short))) score += 6;
  if (nq.includes(norm(s.label))) score += 8;
  for (const token of norm(s.label).split(' ')) {
    if (token.length > 3 && nq.includes(token)) score += 1.5;
  }
  const syn = SERIES_SYNONYMS[s.id] ?? [];
  for (const w of syn) if (nq.includes(norm(w))) score += 5;
  if (hay.includes(nq) && nq.length > 3) score += 3;
  return score;
}

export function matchSeries(q: string, series: Series[]): { series: Series; score: number } | null {
  const scored = series.map((s) => ({ series: s, score: seriesScore(q, s) })).sort((a, b) => b.score - a.score);
  return scored[0] && scored[0].score > 0 ? scored[0] : null;
}

/**
 * Places (states, cities, age bands) mentioned in the question.
 *
 * A place appears in every series (Kerala has a literacy point, a density point,
 * a growth point…), so hits are grouped by place name and each place keeps the
 * series the question is actually about. Without this, "compare Kerala and Bihar"
 * would resolve to Kerala twice.
 */
export function matchEntities(q: string, ctx: PageContext): { name: string; series: Series }[] {
  const nq = norm(q);
  const best = new Map<string, { name: string; series: Series; at: number; score: number }>();

  const offer = (name: string, series: Series, at: number) => {
    const key = norm(name);
    const score = seriesScore(q, series);
    const cur = best.get(key);
    if (!cur || score > cur.score || (score === cur.score && at < cur.at)) {
      best.set(key, { name, series, at, score });
    }
  };

  for (const s of ctx.series) {
    for (const p of s.points) {
      const np = norm(p.name);
      if (np.length < 3) continue;
      const at = nq.indexOf(np);
      if (at >= 0) {
        offer(p.name, s, at);
        continue;
      }
      // fuzzy: only for multi-word or long single-token names, to avoid noise
      if (np.includes(' ') || np.length >= 6) {
        for (const word of nq.split(' ')) {
          if (word.length >= 5 && levenshtein(word, np) <= 1) {
            offer(p.name, s, nq.indexOf(word));
          }
        }
      }
    }
  }

  return [...best.values()]
    .sort((a, b) => a.at - b.at)
    .map(({ name, series }) => ({ name, series }));
}

/* ---------------------------------------------------------------- intents */

const INTENT_WORDS: { id: string; words: string[] }[] = [
  { id: 'summarise', words: ['summarise', 'summarize', 'summary', 'overview', 'what does this page', 'tl dr', 'tldr', 'main points', 'key points', 'tell me about this'] },
  { id: 'correlation', words: ['correlat', 'relationship', 'related', 'linked', 'associated', 'go together', 'depend'] },
  { id: 'compare', words: ['compare', ' vs ', ' versus ', 'difference between', 'against', 'better than', 'worse than'] },
  { id: 'rank', words: ['rank', 'where does', 'where do', 'position', 'stand'] },
  { id: 'average', words: ['average', 'mean', 'median', 'typical', 'on average'] },
  { id: 'distribution', words: ['distribution', 'spread', 'range', 'vary', 'variation', 'diverse'] },
  { id: 'change', words: ['change', 'changed', 'improve', 'improved', 'worse', 'decline', 'since 2001', 'over the decade', 'trend', 'grew from'] },
  { id: 'count', words: ['how many', 'count', 'number of'] },
  { id: 'explain', words: ['what is', 'what does', 'meaning', 'define', 'explain', 'why is'] },
  { id: 'outlier', words: ['outlier', 'unusual', 'surprising', 'stands out', 'anomal', 'exception'] },
  { id: 'top', words: ['highest', 'most', 'top', 'largest', 'best', 'maximum', 'max', 'leading', 'which state has the most'] },
  { id: 'bottom', words: ['lowest', 'least', 'smallest', 'worst', 'minimum', 'min', 'bottom', 'fewest'] },
];

export function detectIntent(q: string): { intent: string; confidence: number } {
  const nq = ` ${norm(q)} `;
  const scored = INTENT_WORDS.map((i) => ({
    id: i.id,
    hits: i.words.filter((w) => nq.includes(w.startsWith(' ') ? w : ` ${w}`) || nq.includes(w)).length,
  })).sort((a, b) => b.hits - a.hits);
  if (!scored[0] || scored[0].hits === 0) return { intent: 'unknown', confidence: 0.2 };
  return { intent: scored[0].id, confidence: Math.min(0.95, 0.5 + scored[0].hits * 0.15) };
}

/* --------------------------------------------------------------- answering */

function listTable(rows: SeriesPoint[], format: (v: number) => string, head: string): AnswerTable {
  return {
    head: [head, 'Value'],
    rows: rows.map((r) => [r.name, format(r.value)]),
  };
}

export function answer(question: string, ctx: PageContext): Answer {
  const q = question.trim();
  const nq = norm(q);
  if (!q) return { intent: 'empty', text: 'Ask me something about the numbers on this page.', confidence: 0 };

  const { intent, confidence } = detectIntent(q);
  const entities = matchEntities(q, ctx);
  const matched = matchSeries(q, ctx.series);

  const noData: Answer = {
    intent: 'unknown',
    text:
      `I answer from the data on **${ctx.title}** only — I do not have general knowledge and I will not guess. ` +
      `Try asking for the highest or lowest ${ctx.series[0]?.short ?? 'value'}, a comparison between two places, ` +
      `a rank, an average, or a correlation between two measures.`,
    confidence: 0.15,
  };

  /* ------------------------------------------------------------- summarise */
  if (intent === 'summarise') {
    const bullets = ctx.series.slice(0, 6).map((s) => {
      const vals = s.points.map((p) => p.value);
      if (!vals.length) return `${s.label}: no values on this page.`;
      const sorted = [...s.points].sort((a, b) => b.value - a.value);
      const top = sorted[0];
      const bottom = sorted[sorted.length - 1];
      return `${s.label}: ${describe(vals, s.format)}. Highest **${top.name}** (${s.format(top.value)}), lowest **${bottom.name}** (${s.format(bottom.value)}).`;
    });
    return {
      intent: 'summarise',
      text: `**${ctx.title}** — ${ctx.blurb}`,
      bullets,
      confidence: 0.9,
    };
  }

  /* ---------------------------------------------------------- correlation */
  if (intent === 'correlation') {
    // Rank the measures by how well they match the question, then take the two
    // strongest — otherwise "literacy and urbanisation" resolves to literacy and
    // female literacy, which are near-duplicates and correlate at 0.99.
    const two = ctx.series
      .map((s) => ({ s, score: seriesScore(q, s) }))
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 2)
      .map((x) => x.s);
    if (two.length === 2) {
      const byName = new Map(two[1].points.map((p) => [norm(p.name), p.value]));
      const pairs: [number, number][] = [];
      for (const p of two[0].points) {
        const v = byName.get(norm(p.name));
        if (typeof v === 'number') pairs.push([p.value, v]);
      }
      const r = pearson(pairs);
      if (r == null) {
        return { intent: 'correlation', text: `I could not line up **${two[0].short}** and **${two[1].short}** on enough shared places to compute a correlation.`, confidence: 0.4 };
      }
      const strength = Math.abs(r) > 0.6 ? 'strong' : Math.abs(r) > 0.35 ? 'moderate' : 'weak';
      const direction = r > 0 ? 'positive' : 'negative';
      return {
        intent: 'correlation',
        text:
          `Across the ${pairs.length} places that have both figures, **${two[0].short}** and **${two[1].short}** have a ` +
          `${strength} ${direction} correlation of **r = ${r.toFixed(2)}**. ` +
          (Math.abs(r) < 0.2
            ? 'That is close enough to zero to call it no relationship at all.'
            : `About ${Math.round(r * r * 100)}% of the variation is shared — the rest is something else.`) +
          ` Correlation is not causation, and with ${pairs.length} units a single outlier can move this number.`,
        seriesId: two[0].id,
        confidence: 0.8,
      };
    }
    if (ctx.caveats.length) {
      return {
        intent: 'correlation',
        text: `Tell me which two measures to correlate — for example "${ctx.series[0]?.short} and ${ctx.series[1]?.short}". Meanwhile, the caveat that matters here:`,
        bullets: ctx.caveats.slice(0, 2),
        confidence: 0.35,
      };
    }
    return noData;
  }

  /* --------------------------------------------------------------- compare */
  if (intent === 'compare' || entities.length >= 2) {
    if (entities.length >= 2) {
      const [a, b] = entities;
      const sA = ctx.series.find((s) => s.id === a.series.id) ?? a.series;
      const sB = ctx.series.find((s) => s.id === b.series.id) ?? b.series;
      const pa = sA.points.find((p) => norm(p.name) === norm(a.name));
      const pb = sB.points.find((p) => norm(p.name) === norm(b.name));
      if (pa && pb && sA.id === sB.id) {
        const diff = pb.value - pa.value;
        const ranked = [...sA.points].sort((x, y) => y.value - x.value);
        const ra = ranked.findIndex((p) => p.name === pa.name) + 1;
        const rb = ranked.findIndex((p) => p.name === pb.name) + 1;
        const higher = diff === 0 ? null : diff > 0 ? pb.name : pa.name;
        return {
          intent: 'compare',
          text:
            `On **${sA.short}**, **${pa.name}** is ${sA.format(pa.value)} (rank ${ra} of ${ranked.length}) and ` +
            `**${pb.name}** is ${sB.format(pb.value)} (rank ${rb}). ` +
            (higher
              ? `${higher} is higher by ${sA.format(Math.abs(diff))}.`
              : 'They are identical on this measure.'),
          seriesId: sA.id,
          confidence: 0.85,
        };
      }
    }
    if (matched) {
      return {
        intent: 'compare',
        text: `Name two places to compare on **${matched.series.short}** — for example "${matched.series.points[0]?.name} and ${matched.series.points[1]?.name}".`,
        confidence: 0.4,
      };
    }
    return noData;
  }

  /* ------------------------------------------------------------ rank/entity */
  if (intent === 'rank' && entities.length === 1) {
    const e = entities[0];
    const s = ctx.series.find((x) => x.id === e.series.id) ?? e.series;
    const p = s.points.find((x) => norm(x.name) === norm(e.name));
    if (p) {
      const ranked = [...s.points].sort((x, y) => y.value - x.value);
      const rank = ranked.findIndex((x) => x.name === p.name) + 1;
      return {
        intent: 'rank',
        text: `**${p.name}** ranks **${rank} of ${ranked.length}** on **${s.short}**, at ${s.format(p.value)}. The median is ${s.format(median(s.points.map((x) => x.value)))}.`,
        seriesId: s.id,
        confidence: 0.85,
      };
    }
  }

  /* ------------------------------------------------------------ average etc */
  if (intent === 'average' && matched) {
    const s = matched.series;
    const vals = s.points.map((p) => p.value);
    return {
      intent: 'average',
      text:
        `**${s.short}** across the ${vals.length} places on this page: mean ${s.format(mean(vals))}, ` +
        `median ${s.format(median(vals))}, from ${s.format(Math.min(...vals))} to ${s.format(Math.max(...vals))}.`,
      seriesId: s.id,
      confidence: 0.85,
    };
  }

  if (intent === 'distribution' && matched) {
    const s = matched.series;
    const vals = [...s.points].sort((a, b) => b.value - a.value);
    const q4 = Math.floor(vals.length / 4);
    return {
      intent: 'distribution',
      text: `**${s.short}** is spread unevenly across the ${vals.length} places here: ${describe(s.points.map((p) => p.value), s.format)}.`,
      bullets: [
        `Top quarter: ${vals.slice(0, q4 || 1).map((p) => p.name).join(', ')}`,
        `Bottom quarter: ${vals.slice(-(q4 || 1)).map((p) => p.name).join(', ')}`,
      ],
      seriesId: s.id,
      confidence: 0.75,
    };
  }

  if (intent === 'count') {
    const s = matched?.series ?? ctx.series[0];
    return {
      intent: 'count',
      text: `This page carries **${ctx.series.length} measures** over **${s.points.length} places**. ${ctx.series.map((x) => x.short).join(', ')}.`,
      confidence: 0.6,
    };
  }

  /* ---------------------------------------------------------------- explain */
  if (intent === 'explain' && matched) {
    const s = matched.series;
    return {
      intent: 'explain',
      text: `**${s.label}** ${s.note ? `— ${s.note}` : ''} On this page it ${describe(s.points.map((p) => p.value), s.format)}.`,
      seriesId: s.id,
      confidence: 0.6,
    };
  }

  /* ---------------------------------------------------------------- outliers */
  if (intent === 'outlier' && matched) {
    const s = matched.series;
    const vals = s.points.map((p) => p.value);
    const m = mean(vals);
    const sd = Math.sqrt(mean(vals.map((v) => (v - m) ** 2))) || 1;
    const ranked = [...s.points].map((p) => ({ ...p, z: (p.value - m) / sd })).sort((a, b) => Math.abs(b.z) - Math.abs(a.z));
    return {
      intent: 'outlier',
      text: `The most unusual values of **${s.short}** are:`,
      bullets: ranked.slice(0, 5).map((p) => `**${p.name}** — ${s.format(p.value)} (${p.z > 0 ? '+' : ''}${p.z.toFixed(1)} standard deviations from the mean)`),
      seriesId: s.id,
      confidence: 0.7,
    };
  }

  /* ------------------------------------------------------------ top/bottom */
  const wantsBottom = intent === 'bottom';
  if ((intent === 'top' || intent === 'bottom') && matched) {
    const s = matched.series;
    const ranked = [...s.points].sort((a, b) => (wantsBottom ? a.value - b.value : b.value - a.value));
    const n = /(?:top|bottom)\s+(\d+)/.exec(nq)?.[1];
    const count = n ? Math.min(Number(n), 10) : 5;
    const picked = ranked.slice(0, count);
    return {
      intent: intent,
      text: `${wantsBottom ? 'Lowest' : 'Highest'} **${s.short}**${s.higherIsBetter === false && wantsBottom ? ' (which is the better end for this measure)' : ''} — ${count} of ${ranked.length}:`,
      bullets: picked.map((p, i) => `${i + 1}. **${p.name}** — ${s.format(p.value)}`),
      table: count > 3 ? listTable(picked, s.format, s.short) : undefined,
      seriesId: s.id,
      confidence: 0.9,
    };
  }

  /* --------------------------------------------------------------- fallback */
  if (matched) {
    const s = matched.series;
    const ranked = [...s.points].sort((a, b) => b.value - a.value);
    return {
      intent: 'lookup',
      text: `On **${s.short}**: ${describe(s.points.map((p) => p.value), s.format)}. Highest is **${ranked[0].name}** (${s.format(ranked[0].value)}), lowest **${ranked[ranked.length - 1].name}** (${s.format(ranked[ranked.length - 1].value)}).`,
      seriesId: s.id,
      confidence: 0.5,
    };
  }

  return noData;
}

/* --------------------------------------------------------------- exporting */

export function answerToMarkdown(question: string, a: Answer): string {
  const lines = [`### ${question}`, '', a.text];
  if (a.bullets?.length) lines.push('', ...a.bullets.map((b) => `- ${b.replace(/\*\*/g, '')}`));
  if (a.table) {
    lines.push('', `| ${a.table.head.join(' | ')} |`, `| ${a.table.head.map(() => '---').join(' | ')} |`);
    for (const row of a.table.rows) lines.push(`| ${row.join(' | ')} |`);
  }
  return lines.join('\n');
}

export function seriesToCsv(s: Series): string {
  const head = `${s.short},value\n`;
  return head + s.points.map((p) => `"${p.name.replace(/"/g, '""')}",${p.value}`).join('\n');
}
