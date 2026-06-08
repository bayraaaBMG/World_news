import { CATEGORIES } from "../lib/categories";

export default function TabNav({ active, onChange }) {
  return (
    <nav className="or-tabs">
      {CATEGORIES.map((c) => (
        <button
          key={c.key}
          className={"or-tab" + (c.key === active ? " on" : "")}
          style={
            c.key === active
              ? { color: c.color, borderColor: c.color, background: c.color + "14" }
              : {}
          }
          onClick={() => onChange(c.key)}
        >
          {c.label}
        </button>
      ))}
    </nav>
  );
}
