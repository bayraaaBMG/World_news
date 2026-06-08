import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Radar, RefreshCw, ExternalLink, Lightbulb, AlertTriangle,
  TrendingUp, Activity, Search, Zap,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────
// Категориуд
// ─────────────────────────────────────────────────────────────
const CATEGORIES = [
  { key: "mongolia",  label: "🇲🇳 Монгол",            color: "#5b8def", q: "Mongolia economy, Mongolian politics, Ulaanbaatar, Mongolia mining exports, Mongolia trade with China and Russia, tugrik" },
  { key: "ai",        label: "AI & Технологи",        color: "#4dd4e8", q: "artificial intelligence, AI, new technology, semiconductors, robotics" },
  { key: "business",  label: "Бизнес & Стартап",       color: "#6ee87a", q: "startups, venture capital funding, new business launches, major company moves" },
  { key: "finance",   label: "Санхүү & Зах зээл",      color: "#e8b04b", q: "stock market, S&P 500, gold, oil prices, central banks, interest rates" },
  { key: "crypto",    label: "Крипто",                color: "#f7931a", q: "bitcoin, ethereum, crypto regulation, stablecoins, blockchain" },
  { key: "geo",       label: "Геополитик",             color: "#e8694d", q: "geopolitics, international conflict, trade policy, sanctions, elections" },
  { key: "energy",    label: "Эрчим хүч & Уул уурхай", color: "#b07ae8", q: "energy, mining, copper, coal, rare earth minerals, commodities" },
  { key: "people",    label: "Алдартай хүмүүс",        color: "#e87ab0", q: "Elon Musk, Sam Altman, Donald Trump, Jensen Huang, Warren Buffett latest news" },
];

const colorFor = (k) => (CATEGORIES.find((c) => c.key === k) || {}).color || "#e8b04b";

const strengthClass = (s) => {
  const v = (s || "").toLowerCase();
  if (v.includes("өндөр")) return "hi";
  if (v.includes("дунд")) return "mid";
  return "lo";
};

// ─────────────────────────────────────────────────────────────
// Claude API дуудлага (web search-тэй)
// ─────────────────────────────────────────────────────────────
async function callClaude(prompt) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
      tools: [{ type: "web_search_20250305", name: "web_search" }],
    }),
  });
  if (!res.ok) throw new Error("API алдаа: " + res.status);
  const data = await res.json();
  return (data.content || [])
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("\n");
}

// Truncate болсон ч бүтэн object-уудыг салгаж авдаг найдвартай parser
function extractItems(raw) {
  if (!raw) return [];
  let text = raw.replace(/```json/gi, "").replace(/```/g, "").trim();
  const start = text.indexOf("[");
  if (start >= 0) text = text.slice(start);
  const items = [];
  let depth = 0, objStart = -1, inStr = false, esc = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inStr) {
      if (esc) esc = false;
      else if (c === "\\") esc = true;
      else if (c === '"') inStr = false;
      continue;
    }
    if (c === '"') { inStr = true; continue; }
    if (c === "{") { if (depth === 0) objStart = i; depth++; }
    else if (c === "}") {
      depth--;
      if (depth === 0 && objStart >= 0) {
        try { items.push(JSON.parse(text.slice(objStart, i + 1))); } catch (e) {}
        objStart = -1;
      }
    }
  }
  return items;
}

function buildPrompt(cat) {
  return `Чи "Opportunity Radar" нэртэй дэлхийн мэдээллийн тагнуулын систем. \
Та web search ашиглаж сүүлийн 48 цагийн ХАМГИЙН ЧУХАЛ, ШИНЭ мэдээг ол. Сэдэв: ${cat.q}.

Олсон мэдээнээс хамгийн чухал 4-ийг сонгож ШИНЖИЛ. Хариултаа ЗӨВХӨН доорх бүтэцтэй JSON массив байдлаар буцаа. \
Markdown, тайлбар, ярианы текст БИТГИЙ нэм — зөвхөн JSON.

[
  {
    "title": "Мэдээний гарчиг (монголоор орчуул)",
    "source": "Эх сурвалжийн нэр",
    "url": "эх нийтлэлийн бодит холбоос",
    "time": "хэдийд (ж: '6 цагийн өмнө')",
    "sentiment": "positive | negative | neutral",
    "summary": "2-3 өгүүлбэрээр товч дүгнэлт монголоор",
    "why": "Яагаад чухал болохыг 1-2 өгүүлбэрээр монголоор",
    "opportunity_strength": "өндөр | дунд | бага | байхгүй",
    "opportunity": "ТОДОРХОЙ, хэрэгжүүлэхүйц бизнес боломж. Хэн юу хийх вэ, эхний алхам нь юу вэ гэдгийг бич. ЕРӨНХИЙ, мэдээж зүйл (ж: 'delivery үйлчилгээ хий') БҮҮ бич. Хэрэв жинхэнэ боломж сул бол opportunity_strength-ийг 'бага'/'байхгүй' гэж тэмдэглээд яагаад болохыг шударгаар бич. Хийсвэр боломж зохиохгүй.",
    "risk": "Гол эрсдэл эсвэл болгоомжлох зүйл 1 өгүүлбэр",
    "mongolia": "Монголд үзүүлэх бодит нөлөө 1-2 өгүүлбэр. Хамааралгүй бол 'Шууд нөлөө бага' гэж бич."
  }
]

Бүх текст монгол хэл дээр. url-д заавал жинхэнэ холбоос тавь. \
Шударга бай: ихэнх мэдээнд жинхэнэ бизнес боломж байдаггүй — байхгүй бол байхгүй гэж хэл.`;
}

// ─────────────────────────────────────────────────────────────
// UI бүрэлдэхүүн хэсгүүд
// ─────────────────────────────────────────────────────────────
const sentimentChip = (s) => {
  const map = {
    positive: { t: "Эерэг", c: "#6ee87a" },
    negative: { t: "Сөрөг", c: "#e8694d" },
    neutral:  { t: "Төвийг сахисан", c: "#9a9aa0" },
  };
  const m = map[s] || map.neutral;
  return (
    <span className="or-chip" style={{ color: m.c, borderColor: m.c + "55", background: m.c + "12" }}>
      {m.t}
    </span>
  );
};

function Card({ a, accent, i }) {
  return (
    <article className="or-card" style={{ animationDelay: `${i * 70}ms`, "--accent": accent }}>
      <div className="or-card-bar" />
      <div className="or-card-meta">
        <span className="or-src">{a.source || "—"}</span>
        <span className="or-dot">•</span>
        <span className="or-time">{a.time || ""}</span>
        <span style={{ marginLeft: "auto" }}>{sentimentChip(a.sentiment)}</span>
      </div>
      <h3 className="or-title">{a.title}</h3>
      {a.summary && <p className="or-summary">{a.summary}</p>}

      {a.why && (
        <div className="or-block">
          <div className="or-block-head"><Activity size={13} /> Яагаад чухал вэ</div>
          <p>{a.why}</p>
        </div>
      )}
      {a.opportunity && (
        <div className="or-block or-opp">
          <div className="or-block-head">
            <Lightbulb size={13} /> Бизнес боломж
            {a.opportunity_strength && (
              <span className={"or-strength s-" + strengthClass(a.opportunity_strength)}>
                {a.opportunity_strength}
              </span>
            )}
          </div>
          <p>{a.opportunity}</p>
        </div>
      )}
      {a.risk && (
        <div className="or-block or-risk">
          <div className="or-block-head"><AlertTriangle size={13} /> Эрсдэл</div>
          <p>{a.risk}</p>
        </div>
      )}
      {a.mongolia && (
        <div className="or-block or-mn">
          <div className="or-block-head">🇲🇳 Монголд нөлөө</div>
          <p>{a.mongolia}</p>
        </div>
      )}

      {a.url && (
        <a className="or-link" href={a.url} target="_blank" rel="noreferrer">
          Эх сурвалж унших <ExternalLink size={13} />
        </a>
      )}
    </article>
  );
}

function Skeleton({ i }) {
  return (
    <div className="or-card or-skel" style={{ animationDelay: `${i * 90}ms` }}>
      <div className="or-card-bar" style={{ "--accent": "#3a3a42" }} />
      <div className="sk sk-sm" />
      <div className="sk sk-lg" />
      <div className="sk sk-md" />
      <div className="sk sk-md" />
      <div className="sk sk-sm" style={{ width: "40%" }} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Үндсэн апп
// ─────────────────────────────────────────────────────────────
export default function App() {
  const [active, setActive] = useState("ai");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updated, setUpdated] = useState(null);
  const reqId = useRef(0);

  const load = useCallback(async (key) => {
    const cat = CATEGORIES.find((c) => c.key === key);
    const id = ++reqId.current;
    setLoading(true); setError(null); setItems([]);
    try {
      const raw = await callClaude(buildPrompt(cat));
      const parsed = extractItems(raw);
      if (id !== reqId.current) return; // хуучирсан хүсэлт
      if (!parsed.length) throw new Error("Мэдээ боловсруулж чадсангүй. Дахин оролдоно уу.");
      setItems(parsed);
      setUpdated(new Date());
    } catch (e) {
      if (id !== reqId.current) return;
      setError(e.message || "Алдаа гарлаа");
    } finally {
      if (id === reqId.current) setLoading(false);
    }
  }, []);

  useEffect(() => { load(active); }, [active, load]);

  const accent = colorFor(active);
  const hhmm = updated
    ? updated.getHours().toString().padStart(2, "0") + ":" + updated.getMinutes().toString().padStart(2, "0")
    : "—";

  return (
    <div className="or-root">
      <style>{CSS}</style>

      {/* Header */}
      <header className="or-header">
        <div className="or-grid-bg" />
        <div className="or-header-inner">
          <div className="or-brand">
            <div className="or-logo"><Radar size={26} strokeWidth={1.6} /><span className="or-sweep" /></div>
            <div>
              <h1 className="or-wordmark">OPPORTUNITY RADAR</h1>
              <p className="or-tagline">Дэлхийн мэдээг бизнес боломж болгон хувиргадаг AI тагнуул</p>
            </div>
          </div>
          <div className="or-status">
            <span className="or-live"><span className="or-pulse" />LIVE</span>
            <div className="or-updated">
              <span>Шинэчилсэн</span><strong>{hhmm}</strong>
            </div>
            <button className="or-refresh" onClick={() => load(active)} disabled={loading} aria-label="Шинэчлэх">
              <RefreshCw size={16} className={loading ? "or-spin" : ""} />
            </button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <nav className="or-tabs">
        {CATEGORIES.map((c) => (
          <button
            key={c.key}
            className={"or-tab" + (c.key === active ? " on" : "")}
            style={c.key === active ? { color: c.color, borderColor: c.color, background: c.color + "14" } : {}}
            onClick={() => setActive(c.key)}
          >
            {c.label}
          </button>
        ))}
      </nav>

      {/* Body */}
      <main className="or-main">
        {error && (
          <div className="or-error">
            <AlertTriangle size={18} />
            <span>{error}</span>
            <button onClick={() => load(active)}>Дахин оролдох</button>
          </div>
        )}

        {!error && (
          <>
            <div className="or-section-head" style={{ "--accent": accent }}>
              <Zap size={15} />
              <span>{CATEGORIES.find((c) => c.key === active)?.label}</span>
              <span className="or-count">{loading ? "татаж байна…" : `${items.length} мэдээ`}</span>
            </div>
            <div className="or-grid">
              {loading
                ? [0, 1, 2, 3].map((i) => <Skeleton key={i} i={i} />)
                : items.map((a, i) => <Card key={i} a={a} accent={accent} i={i} />)}
            </div>
          </>
        )}
      </main>

      <footer className="or-footer">
        <span><TrendingUp size={12} /> Real-time web search + Claude шинжилгээ</span>
        <span className="or-foot-note">Дүгнэлт нь AI-аар үүсгэгдсэн — шийдвэр гаргахаасаа өмнө эх сурвалжийг шалгана уу.</span>
      </footer>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Загвар (CSS)
// ─────────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Unbounded:wght@400;600;800&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');

.or-root{
  --bg:#0a0a0c; --panel:#141418; --panel2:#1b1b21; --line:#26262e;
  --txt:#e8e8ec; --dim:#8a8a92; --gold:#e8b04b;
  background:var(--bg); color:var(--txt);
  font-family:'IBM Plex Sans',sans-serif; min-height:100vh;
  font-size:14px; line-height:1.55;
}
.or-root *{box-sizing:border-box;}

/* Header */
.or-header{position:relative; overflow:hidden; border-bottom:1px solid var(--line);
  background:linear-gradient(180deg,#101015,#0a0a0c);}
.or-grid-bg{position:absolute; inset:0;
  background-image:linear-gradient(var(--line) 1px,transparent 1px),linear-gradient(90deg,var(--line) 1px,transparent 1px);
  background-size:38px 38px; opacity:.18;
  mask-image:radial-gradient(circle at 18% 50%,#000,transparent 70%);}
.or-header-inner{position:relative; max-width:1240px; margin:0 auto; padding:22px 28px;
  display:flex; align-items:center; justify-content:space-between; gap:20px; flex-wrap:wrap;}
.or-brand{display:flex; align-items:center; gap:16px;}
.or-logo{position:relative; width:50px; height:50px; border-radius:12px;
  display:grid; place-items:center; color:var(--gold);
  background:radial-gradient(circle,#1c1a12,#121216); border:1px solid #3a3320;
  box-shadow:0 0 24px #e8b04b22;}
.or-sweep{position:absolute; inset:0; border-radius:12px;
  background:conic-gradient(from 0deg,transparent 0deg,#e8b04b55 40deg,transparent 80deg);
  animation:sweep 3.5s linear infinite;}
@keyframes sweep{to{transform:rotate(360deg);}}
.or-wordmark{font-family:'Unbounded',sans-serif; font-weight:800; font-size:23px;
  letter-spacing:.04em; margin:0; color:#fff;
  background:linear-gradient(90deg,#fff,#e8b04b); -webkit-background-clip:text; background-clip:text; -webkit-text-fill-color:transparent;}
.or-tagline{margin:3px 0 0; color:var(--dim); font-size:12.5px;}
.or-status{display:flex; align-items:center; gap:16px;}
.or-live{display:flex; align-items:center; gap:6px; font-family:'IBM Plex Mono',monospace;
  font-size:11px; letter-spacing:.12em; color:#6ee87a;}
.or-pulse{width:8px; height:8px; border-radius:50%; background:#6ee87a; box-shadow:0 0 0 0 #6ee87a99; animation:pulse 1.8s infinite;}
@keyframes pulse{0%{box-shadow:0 0 0 0 #6ee87a88;}70%{box-shadow:0 0 0 8px #6ee87a00;}100%{box-shadow:0 0 0 0 #6ee87a00;}}
.or-updated{font-family:'IBM Plex Mono',monospace; font-size:11px; color:var(--dim); text-align:right; line-height:1.3;}
.or-updated strong{display:block; color:var(--txt); font-size:15px;}
.or-refresh{width:40px; height:40px; border-radius:10px; border:1px solid var(--line);
  background:var(--panel2); color:var(--txt); cursor:pointer; display:grid; place-items:center; transition:.2s;}
.or-refresh:hover:not(:disabled){border-color:var(--gold); color:var(--gold);}
.or-refresh:disabled{opacity:.5; cursor:default;}
.or-spin{animation:spin 1s linear infinite;}
@keyframes spin{to{transform:rotate(360deg);}}

/* Tabs */
.or-tabs{max-width:1240px; margin:0 auto; padding:16px 28px 4px;
  display:flex; gap:9px; flex-wrap:wrap;}
.or-tab{font-family:'IBM Plex Mono',monospace; font-size:12px; letter-spacing:.02em;
  padding:8px 14px; border-radius:999px; border:1px solid var(--line);
  background:var(--panel); color:var(--dim); cursor:pointer; transition:.18s; white-space:nowrap;}
.or-tab:hover{color:var(--txt); border-color:#3a3a44;}
.or-tab.on{font-weight:500;}

/* Main */
.or-main{max-width:1240px; margin:0 auto; padding:10px 28px 40px;}
.or-section-head{display:flex; align-items:center; gap:9px; padding:18px 2px 16px;
  font-family:'Unbounded',sans-serif; font-weight:600; font-size:15px; color:var(--accent);}
.or-count{margin-left:10px; font-family:'IBM Plex Mono',monospace; font-weight:400;
  font-size:11px; color:var(--dim); letter-spacing:.04em;}

.or-grid{display:grid; grid-template-columns:repeat(auto-fill,minmax(330px,1fr)); gap:16px;}

/* Card */
.or-card{position:relative; background:var(--panel); border:1px solid var(--line);
  border-radius:14px; padding:18px 18px 16px; overflow:hidden;
  opacity:0; transform:translateY(14px); animation:rise .5s cubic-bezier(.2,.7,.3,1) forwards;}
@keyframes rise{to{opacity:1; transform:none;}}
.or-card:hover{border-color:color-mix(in srgb,var(--accent) 50%,var(--line));}
.or-card-bar{position:absolute; left:0; top:0; bottom:0; width:3px; background:var(--accent);
  box-shadow:0 0 14px var(--accent);}
.or-card-meta{display:flex; align-items:center; gap:7px; font-size:11px; color:var(--dim);
  font-family:'IBM Plex Mono',monospace; margin-bottom:9px;}
.or-src{color:var(--txt); font-weight:500;}
.or-dot{opacity:.5;}
.or-chip{font-size:10px; padding:2px 8px; border-radius:999px; border:1px solid; font-family:'IBM Plex Sans';}
.or-title{font-family:'Unbounded',sans-serif; font-weight:600; font-size:15.5px;
  line-height:1.32; margin:0 0 9px; color:#fff;}
.or-summary{margin:0 0 13px; color:#c3c3ca; font-size:13.5px;}

.or-block{margin-top:10px; padding:10px 12px; border-radius:9px; background:var(--panel2); border:1px solid var(--line);}
.or-block p{margin:4px 0 0; font-size:12.8px; color:#bcbcc4;}
.or-block-head{display:flex; align-items:center; gap:6px; font-size:10.5px;
  font-family:'IBM Plex Mono',monospace; letter-spacing:.06em; text-transform:uppercase; color:var(--dim);}
.or-opp{background:linear-gradient(180deg,#16180f,#141418); border-color:#3a3a20;}
.or-opp .or-block-head{color:#e8d04b;}
.or-strength{margin-left:auto; font-size:9.5px; padding:1px 8px; border-radius:999px;
  font-family:'IBM Plex Sans'; letter-spacing:0; text-transform:none; border:1px solid;}
.or-strength.s-hi{color:#6ee87a; border-color:#6ee87a55; background:#6ee87a14;}
.or-strength.s-mid{color:#e8b04b; border-color:#e8b04b55; background:#e8b04b14;}
.or-strength.s-lo{color:#9a9aa0; border-color:#9a9aa055; background:#9a9aa014;}
.or-risk{background:linear-gradient(180deg,#16110f,#141418); border-color:#3a2820;}
.or-risk .or-block-head{color:#e8946e;}
.or-mn{background:linear-gradient(180deg,#0f1518,#141418); border-color:#1f3540;}
.or-mn .or-block-head{color:#6ec8e8;}

.or-link{display:inline-flex; align-items:center; gap:6px; margin-top:14px;
  font-family:'IBM Plex Mono',monospace; font-size:12px; color:var(--accent);
  text-decoration:none; border-bottom:1px solid transparent; transition:.15s;}
.or-link:hover{border-bottom-color:var(--accent);}

/* Skeleton */
.or-skel{animation:rise .5s forwards; pointer-events:none;}
.sk{height:13px; border-radius:6px; margin:8px 0;
  background:linear-gradient(90deg,#1d1d24,#26262e,#1d1d24); background-size:200% 100%;
  animation:shimmer 1.4s linear infinite;}
.sk-sm{width:55%; height:11px;}
.sk-lg{width:90%; height:20px; margin-top:14px;}
.sk-md{width:80%;}
@keyframes shimmer{to{background-position:-200% 0;}}

/* Error */
.or-error{display:flex; align-items:center; gap:12px; margin:24px 0; padding:16px 18px;
  border-radius:12px; background:#1a1214; border:1px solid #4a2428; color:#e8a0a0;}
.or-error button{margin-left:auto; padding:7px 14px; border-radius:8px; border:1px solid #4a2428;
  background:#221517; color:#e8b04b; cursor:pointer; font-family:'IBM Plex Mono',monospace; font-size:12px;}
.or-error button:hover{border-color:var(--gold);}

/* Footer */
.or-footer{max-width:1240px; margin:0 auto; padding:18px 28px 30px;
  border-top:1px solid var(--line); display:flex; justify-content:space-between; gap:14px; flex-wrap:wrap;
  font-family:'IBM Plex Mono',monospace; font-size:11px; color:var(--dim);}
.or-footer span{display:flex; align-items:center; gap:6px;}
.or-foot-note{color:#5a5a62;}
`;
