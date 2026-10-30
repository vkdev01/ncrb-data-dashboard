'use client';

/**
 * InsightsPanel — "ask this page".
 *
 * Mounted once in the layout. Reads the current route, pulls that page's context
 * from the registry, and answers questions about the numbers on it.
 *
 * Two engines:
 *   - **computed** (default) — the local engine in lib/insights/engine.ts. Runs in
 *     the browser, needs no key, and every number is arithmetic over the same
 *     data the page renders.
 *   - **model** (optional) — if the reader supplies an OpenAI-compatible endpoint
 *     and key, the page's context is sent there instead. The key stays in this
 *     browser's localStorage and is never sent anywhere except that endpoint.
 *
 * The badge on each answer says which one produced it. That distinction is the
 * whole point: a computed answer can be checked against the chart beside it.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { answer as localAnswer, answerToMarkdown, seriesToCsv, type Answer } from '@/lib/insights/engine';
import { contextForPath } from '@/lib/insights/contexts';

interface Message {
  role: 'user' | 'assistant';
  text: string;
  answer?: Answer;
  engine?: 'computed' | 'model';
  error?: boolean;
  /** Raw provider payload, shown when the response could not be read. */
  diagnostic?: string;
}

/**
 * Pull the assistant text out of a chat-completions response.
 *
 * Providers disagree about where the answer lives: OpenAI puts it in
 * `choices[0].message.content` as a string, newer ones send an array of parts,
 * and reasoning models (Sarvam-M, and anything hybrid-thinking) often return an
 * empty `content` with the actual text in `reasoning_content`. Reading only the
 * first of those is how you end up with a 200 and an empty bubble.
 */
function extractText(json: unknown): { text: string; finish?: string; found: string } {
  const j = json as {
    choices?: { message?: { content?: unknown; reasoning_content?: unknown }; text?: unknown; finish_reason?: string }[];
    output_text?: unknown;
  };
  const choice = j?.choices?.[0];
  const msg = choice?.message ?? {};
  const finish = choice?.finish_reason;

  const asText = (v: unknown): string => {
    if (typeof v === 'string') return v;
    if (Array.isArray(v)) {
      return v
        .map((part) => {
          if (typeof part === 'string') return part;
          const p = part as { text?: unknown; content?: unknown };
          if (typeof p?.text === 'string') return p.text;
          if (typeof p?.content === 'string') return p.content;
          return '';
        })
        .join('');
    }
    return '';
  };

  const candidates: [string, unknown][] = [
    ['content', msg.content],
    ['reasoning_content', msg.reasoning_content],
    ['choice.text', choice?.text],
    ['output_text', j?.output_text],
  ];

  for (const [where, value] of candidates) {
    const text = asText(value).trim();
    if (text) return { text, finish, found: where };
  }
  return { text: '', finish, found: 'none' };
}

interface ModelConfig {
  baseUrl: string;
  model: string;
  apiKey: string;
}

const LS_KEY = 'india-in-data:model-config';

const DEFAULT_CONFIG: ModelConfig = { baseUrl: 'https://api.sarvam.ai/v1', model: 'sarvam-105b', apiKey: '' };

function loadConfig(): ModelConfig {
  if (typeof window === 'undefined') return DEFAULT_CONFIG;
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    return raw ? { ...DEFAULT_CONFIG, ...JSON.parse(raw) } : DEFAULT_CONFIG;
  } catch {
    return DEFAULT_CONFIG;
  }
}

/** Compact context for a model prompt: labels, ranges and the extremes, not every row. */
function contextForModel(ctx: ReturnType<typeof contextForPath>): string {
  const lines = [
    `PAGE: ${ctx.title}`,
    `ABOUT: ${ctx.blurb}`,
    `SOURCE: ${ctx.source}`,
    'CAVEATS:',
    ...ctx.caveats.map((c) => `- ${c}`),
    'MEASURES:',
  ];
  for (const s of ctx.series) {
    const vals = s.points.map((p) => p.value);
    const sorted = [...s.points].sort((a, b) => b.value - a.value);
    lines.push(
      `- ${s.label} (${s.unit}); ${s.points.length} places; highest ${sorted[0].name} ${s.format(sorted[0].value)}; ` +
        `lowest ${sorted[sorted.length - 1].name} ${s.format(sorted[sorted.length - 1].value)}; ` +
        `top 5: ${sorted.slice(0, 5).map((p) => `${p.name} ${s.format(p.value)}`).join(', ')}`,
    );
  }
  return lines.join('\n');
}

export function InsightsPanel() {
  const pathname = usePathname() ?? '/';
  const ctx = useMemo(() => contextForPath(pathname), [pathname]);

  const [open, setOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [config, setConfig] = useState<ModelConfig>(DEFAULT_CONFIG);
  const [testResult, setTestResult] = useState<string | null>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  /**
   * Ping the configured endpoint with a one-word prompt and report where the
   * text came back. Provider response shapes differ, and this is the fastest way
   * to tell "wrong key" from "wrong parser" from "model ignored me".
   */
  async function testEndpoint() {
    setTestResult('Testing…');
    try {
      const res = await fetch(`${config.baseUrl.replace(/\/$/, '')}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${config.apiKey}` },
        body: JSON.stringify({
          model: config.model,
          max_tokens: 40,
          messages: [{ role: 'user', content: 'Reply with the single word: OK' }],
        }),
      });
      const body = await res.text();
      if (!res.ok) {
        setTestResult(`HTTP ${res.status} — ${body.slice(0, 240)}`);
        return;
      }
      let json: unknown;
      try {
        json = JSON.parse(body);
      } catch {
        setTestResult(`Non-JSON response: ${body.slice(0, 240)}`);
        return;
      }
      const { text, finish, found } = extractText(json);
      setTestResult(
        text
          ? `Reachable. Text found in \`${found}\` (finish: ${finish ?? 'n/a'}): "${text.slice(0, 90)}"`
          : `Reachable, but no text in the reply (finish: ${finish ?? 'none'}). Shape: ${body.slice(0, 240)}`,
      );
    } catch (err) {
      setTestResult(
        `Request failed: ${err instanceof Error ? err.message : 'unknown'}. A browser fetch to another origin ` +
          `needs that origin to allow CORS; if it does not, the computed engine still works.`,
      );
    }
  }

  useEffect(() => setConfig(loadConfig()), []);

  // Reset the thread when the reader moves to another page — the context changed.
  useEffect(() => {
    setMessages([]);
  }, [pathname]);

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [messages, busy]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const useModel = Boolean(config.apiKey && config.model && config.baseUrl);

  const ask = useCallback(
    async (question: string) => {
      const q = question.trim();
      if (!q || busy) return;
      setInput('');
      setMessages((m) => [...m, { role: 'user', text: q }]);
      setBusy(true);

      // ---- computed engine (always available)
      const computed = localAnswer(q, ctx);

      if (!useModel) {
        setMessages((m) => [...m, { role: 'assistant', text: computed.text, answer: computed, engine: 'computed' }]);
        setBusy(false);
        return;
      }

      // ---- model engine (opt-in)
      try {
        const res = await fetch(`${config.baseUrl.replace(/\/$/, '')}/chat/completions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${config.apiKey}` },
          body: JSON.stringify({
            model: config.model,
            temperature: 0.2,
            // Without an explicit cap some providers default very low, and a
            // reasoning model can spend the whole budget before writing a word.
            max_tokens: 900,
            messages: [
              {
                role: 'system',
                content:
                  'You are a careful data analyst embedded in a dashboard about India. Answer only from the DATA ' +
                  'below. Quote real numbers with units. If the data cannot answer the question, say so plainly ' +
                  'rather than inventing anything. Keep answers under 120 words unless asked for a list. ' +
                  'Mention a relevant caveat when it changes the interpretation.\n\nDATA:\n' +
                  contextForModel(ctx),
              },
              { role: 'user', content: q },
            ],
          }),
        });

        const body = await res.text();
        if (!res.ok) throw new Error(`HTTP ${res.status} — ${body.slice(0, 180)}`);

        let json: unknown;
        try {
          json = JSON.parse(body);
        } catch {
          throw new Error(`Response was not JSON: ${body.slice(0, 180)}`);
        }

        const { text, finish, found } = extractText(json);

        if (!text) {
          setMessages((m) => [
            ...m,
            {
              role: 'assistant',
              text:
                `The endpoint answered, but I could not find any text in the reply (finish_reason: ${finish ?? 'none'}, ` +
                `looked in content / reasoning_content / text). That usually means the model spent its budget on ` +
                `reasoning, or the provider uses a different response shape. Here is the computed answer instead.`,
              answer: computed,
              engine: 'computed',
              error: true,
              diagnostic: JSON.stringify(json, null, 2).slice(0, 900),
            },
          ]);
          return;
        }

        setMessages((m) => [
          ...m,
          {
            role: 'assistant',
            text: found === 'reasoning_content' ? `${text}\n\n_(returned as reasoning_content)_` : text,
            engine: 'model',
          },
        ]);
      } catch (err) {
        setMessages((m) => [
          ...m,
          {
            role: 'assistant',
            text:
              `The model endpoint could not be reached (${err instanceof Error ? err.message : 'unknown error'}). ` +
              `That usually means the provider does not allow requests from a browser, or the key is wrong. ` +
              `Falling back to the computed answer:\n\n${computed.text}`,
            answer: computed,
            engine: 'computed',
            error: true,
          },
        ]);
      } finally {
        setBusy(false);
      }
    },
    [busy, config, ctx, useModel],
  );

  function download(name: string, content: string, type = 'text/markdown') {
    const blob = new Blob([content], { type: `${type};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function downloadThread() {
    const header = `# Insights — ${ctx.title}\n\nSource: ${ctx.source}\n\n`;
    const body = messages
      .map((m) =>
        m.role === 'user'
          ? `## ${m.text}`
          : m.answer
            ? answerToMarkdown('', m.answer).replace(/^### \n?/, '')
            : m.text,
      )
      .join('\n\n');
    download(`insights-${ctx.route.replace(/\W+/g, '-')}.md`, header + body);
  }

  function downloadData() {
    const s = ctx.series[0];
    if (s) download(`${s.id}.csv`, seriesToCsv(s), 'text/csv');
  }

  function saveConfig(next: ModelConfig) {
    setConfig(next);
    try {
      window.localStorage.setItem(LS_KEY, JSON.stringify(next));
    } catch {
      /* storage may be unavailable in private mode — the panel still works */
    }
  }

  const prompts = ctx.prompts ?? ['Summarise this page', 'What is the highest value?', 'What is the average?'];

  return (
    <>
      <button className={`ai-fab${open ? ' on' : ''}`} onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-controls="ai-panel">
        {open ? 'Close' : 'Ask this page'}
      </button>

      {open ? (
        <section className="ai-panel" id="ai-panel" role="dialog" aria-label={`Ask about ${ctx.title}`}>
          <header className="ai-head">
            <div>
              <strong>Ask this page</strong>
              <span className="ai-sub">{ctx.title}</span>
            </div>
            <div className="ai-head-actions">
              <button className="btn-ghost" onClick={() => setShowSettings((s) => !s)} title="Model settings">
                Model
              </button>
              <button className="btn-ghost" onClick={() => setOpen(false)} aria-label="Close panel">
                ✕
              </button>
            </div>
          </header>

          {showSettings ? (
            <div className="ai-settings">
              <p className="ai-note">
                Optional. Answers are computed in your browser by default — no key, no network. Add an
                OpenAI-compatible endpoint to use a model instead. The key is stored only in this browser and is
                sent only to that endpoint.
              </p>
              <label className="field">
                <span>Base URL</span>
                <input value={config.baseUrl} onChange={(e) => saveConfig({ ...config, baseUrl: e.target.value })} placeholder="https://api.sarvam.ai/v1" />
              </label>
              <label className="field">
                <span>Model</span>
                <input value={config.model} onChange={(e) => saveConfig({ ...config, model: e.target.value })} placeholder="sarvam-105b" />
              </label>
              <label className="field">
                <span>API key</span>
                <input
                  type="password"
                  value={config.apiKey}
                  onChange={(e) => saveConfig({ ...config, apiKey: e.target.value })}
                  placeholder="sk-…"
                  autoComplete="off"
                />
              </label>
              <div className="ai-row">
                <span className={`badge ${useModel ? 'badge-live' : 'badge-muted'}`}>
                  <span className="dot" /> {useModel ? `model: ${config.model}` : 'computed locally'}
                </span>
                <button className="btn-ghost" onClick={testEndpoint} disabled={!config.apiKey || testResult === 'Testing…'}>
                  Test
                </button>
                <button className="btn-ghost" onClick={() => { saveConfig({ ...DEFAULT_CONFIG, apiKey: '' }); setTestResult(null); }}>
                  Clear
                </button>
              </div>
              {testResult ? <pre className="ai-diag-pre">{testResult}</pre> : null}
            </div>
          ) : null}

          <div className="ai-body" ref={bodyRef}>
            {messages.length === 0 ? (
              <div className="ai-empty">
                <p>
                  This panel answers questions about the numbers on <strong>{ctx.title}</strong> — highest, lowest,
                  compare two places, rank, average, distribution, correlation. Every figure is computed from the
                  same data as the charts.
                </p>
                <div className="chip-row">
                  {prompts.map((p) => (
                    <button key={p} className="chip" onClick={() => ask(p)}>
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {messages.map((m, i) => (
              <div key={i} className={`ai-msg ai-${m.role}${m.error ? ' ai-err' : ''}`}>
                <div className="ai-msg-meta">
                  {m.role === 'user' ? 'You' : m.engine === 'model' ? `Model · ${config.model}` : 'Computed from this page'}
                </div>
                <div className="ai-msg-text">
                  {m.text.split('\n').map((line, j) => (
                    <p key={j}>{line.replace(/\*\*/g, '')}</p>
                  ))}
                </div>
                {m.diagnostic ? (
                  <details className="ai-diag">
                    <summary>Raw response</summary>
                    <pre>{m.diagnostic}</pre>
                  </details>
                ) : null}
                {m.answer?.bullets?.length ? (
                  <ul className="ai-bullets">
                    {m.answer.bullets.map((b, j) => (
                      <li key={j}>{b.replace(/\*\*/g, '')}</li>
                    ))}
                  </ul>
                ) : null}
                {m.answer?.table ? (
                  <div className="table-wrap" style={{ maxHeight: 220 }}>
                    <table className="dtable">
                      <thead>
                        <tr>
                          {m.answer.table.head.map((h) => (
                            <th key={h} style={{ textAlign: h === 'Value' ? 'right' : 'left' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {m.answer.table.rows.map((r, j) => (
                          <tr key={j}>
                            {r.map((c, k) => (
                              <td key={k} style={{ textAlign: k === r.length - 1 ? 'right' : 'left' }}>{c}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : null}
              </div>
            ))}

            {busy ? <div className="ai-msg ai-assistant"><div className="ai-msg-meta">Working…</div></div> : null}
          </div>

          <footer className="ai-foot">
            <form
              className="ai-input-row"
              onSubmit={(e) => {
                e.preventDefault();
                ask(input);
              }}
            >
              <input
                className="ai-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={`Ask about ${ctx.title.toLowerCase()}…`}
                aria-label="Ask a question about this page"
              />
              <button className="btn-ghost" type="submit" disabled={!input.trim() || busy}>
                Ask
              </button>
            </form>
            <div className="ai-row ai-actions">
              <button className="btn-ghost" onClick={() => ask('Summarise this page')} disabled={busy}>
                Summarise
              </button>
              <button className="btn-ghost" onClick={downloadThread} disabled={!messages.length} title="Download this conversation as Markdown">
                ↓ Chat .md
              </button>
              <button className="btn-ghost" onClick={downloadData} title="Download the main dataset behind this page as CSV">
                ↓ Data .csv
              </button>
            </div>
          </footer>
        </section>
      ) : null}
    </>
  );
}
