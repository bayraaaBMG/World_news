import { CATEGORIES } from "../lib/categories";

export default function TabNav({ active, onChange, loaded = {} }) {
  return (
    <nav className="or-tabs">
      {CATEGORIES.map((c) => {
        const isActive = c.key === active;
        const hasData = !!loaded[c.key]?.items?.length;
        return (
          <button
            key={c.key}
            className={"or-tab" + (isActive ? " on" : "")}
            style={isActive ? { color: c.color, borderColor: c.color, background: c.color + "14" } : {}}
            onClick={() => onChange(c.key)}
          >
            {c.label}
            {hasData && !isActive && <span className="or-tab-dot" style={{ background: c.color }} />}
          </button>
        );
      })}
    </nav>
  );
}
