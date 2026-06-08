import { Activity, Lightbulb, AlertTriangle, ExternalLink, Bookmark } from "lucide-react";
import { strengthClass } from "../lib/categories";

function SentimentChip({ s }) {
  const map = {
    positive: { t: "Эерэг",          c: "#6ee87a" },
    negative: { t: "Сөрөг",          c: "#e8694d" },
    neutral:  { t: "Төвийг сахисан", c: "#9a9aa0" },
  };
  const m = map[s] || map.neutral;
  return (
    <span className="or-chip" style={{ color: m.c, borderColor: m.c + "55", background: m.c + "12" }}>
      {m.t}
    </span>
  );
}

export function Card({ a, accent, i, saved = false, onSave }) {
  return (
    <article className="or-card" style={{ animationDelay: `${i * 70}ms`, "--accent": accent }}>
      <div className="or-card-bar" />

      {onSave && (
        <button
          className={"or-bookmark-btn" + (saved ? " saved" : "")}
          onClick={() => onSave(a)}
          aria-label={saved ? "Хасах" : "Хадгалах"}
        >
          <Bookmark size={13} fill={saved ? "currentColor" : "none"} />
        </button>
      )}

      <div className="or-card-meta">
        <span className="or-src">{a.source || "—"}</span>
        <span className="or-dot">•</span>
        <span className="or-time">{a.time || ""}</span>
        <span style={{ marginLeft: "auto" }}><SentimentChip s={a.sentiment} /></span>
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

export function Skeleton({ i }) {
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
