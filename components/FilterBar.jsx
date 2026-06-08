const SENTIMENTS = [
  { key: "",         label: "Бүгд" },
  { key: "positive", label: "Эерэг",          color: "#6ee87a" },
  { key: "negative", label: "Сөрөг",           color: "#e8694d" },
  { key: "neutral",  label: "Төвийг сахисан",  color: "#9a9aa0" },
];

const STRENGTHS = [
  { key: "",      label: "Бүх боломж" },
  { key: "өндөр", label: "Өндөр боломж", color: "#6ee87a" },
  { key: "дунд",  label: "Дунд боломж",  color: "#e8b04b" },
];

export default function FilterBar({ sentiment, strength, onChange, total, visible }) {
  const isFiltered = sentiment || strength;
  return (
    <div className="or-filters">
      <div className="or-filter-group">
        {SENTIMENTS.map((s) => (
          <button
            key={s.key}
            className={"or-fchip" + (sentiment === s.key ? " active" : "")}
            style={
              sentiment === s.key && s.color
                ? { color: s.color, borderColor: s.color + "55", background: s.color + "12" }
                : {}
            }
            onClick={() => onChange("sentiment", s.key)}
          >
            {s.label}
          </button>
        ))}
      </div>
      <div className="or-filter-sep" />
      <div className="or-filter-group">
        {STRENGTHS.map((s) => (
          <button
            key={s.key}
            className={"or-fchip" + (strength === s.key ? " active" : "")}
            style={
              strength === s.key && s.color
                ? { color: s.color, borderColor: s.color + "55", background: s.color + "12" }
                : {}
            }
            onClick={() => onChange("strength", s.key)}
          >
            {s.label}
          </button>
        ))}
      </div>
      {isFiltered && (
        <span className="or-filter-count">{visible} / {total}</span>
      )}
    </div>
  );
}
