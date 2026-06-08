import { Radar, RefreshCw, Bookmark } from "lucide-react";

export default function Header({ loading, updated, onRefresh, savedCount, onSavedOpen }) {
  const hhmm = updated
    ? updated.getHours().toString().padStart(2, "0") + ":" +
      updated.getMinutes().toString().padStart(2, "0")
    : "—";

  return (
    <header className="or-header">
      <div className="or-grid-bg" />
      <div className="or-header-inner">
        <div className="or-brand">
          <div className="or-logo">
            <Radar size={26} strokeWidth={1.6} />
            <span className="or-sweep" />
          </div>
          <div>
            <h1 className="or-wordmark">OPPORTUNITY RADAR</h1>
            <p className="or-tagline">Дэлхийн мэдээг бизнес боломж болгон хувиргадаг AI тагнуул</p>
          </div>
        </div>
        <div className="or-status">
          <span className="or-live"><span className="or-pulse" />LIVE</span>
          <div className="or-updated">
            <span>Шинэчилсэн</span>
            <strong>{hhmm}</strong>
          </div>
          <button
            className={"or-saved-btn" + (savedCount > 0 ? " has-items" : "")}
            onClick={onSavedOpen}
            aria-label="Хадгалсан мэдээ"
          >
            <Bookmark size={15} fill={savedCount > 0 ? "currentColor" : "none"} />
            {savedCount > 0 && <span className="or-saved-count">{savedCount}</span>}
          </button>
          <button
            className="or-refresh"
            onClick={onRefresh}
            disabled={loading}
            aria-label="Шинэчлэх"
          >
            <RefreshCw size={16} className={loading ? "or-spin" : ""} />
          </button>
        </div>
      </div>
    </header>
  );
}
