export const CATEGORIES = [
  { key: "mongolia",  label: "🇲🇳 Монгол",            color: "#5b8def", q: "Mongolia economy, Mongolian politics, Ulaanbaatar, Mongolia mining exports, Mongolia trade with China and Russia, tugrik" },
  { key: "ai",        label: "AI & Технологи",        color: "#4dd4e8", q: "artificial intelligence, AI, new technology, semiconductors, robotics" },
  { key: "business",  label: "Бизнес & Стартап",       color: "#6ee87a", q: "startups, venture capital funding, new business launches, major company moves" },
  { key: "finance",   label: "Санхүү & Зах зээл",      color: "#e8b04b", q: "stock market, S&P 500, gold, oil prices, central banks, interest rates" },
  { key: "crypto",    label: "Крипто",                 color: "#f7931a", q: "bitcoin, ethereum, crypto regulation, stablecoins, blockchain" },
  { key: "geo",       label: "Геополитик",             color: "#e8694d", q: "geopolitics, international conflict, trade policy, sanctions, elections" },
  { key: "energy",    label: "Эрчим хүч & Уул уурхай", color: "#b07ae8", q: "energy, mining, copper, coal, rare earth minerals, commodities" },
  { key: "people",    label: "Алдартай хүмүүс",        color: "#e87ab0", q: "Elon Musk, Sam Altman, Donald Trump, Jensen Huang, Warren Buffett latest news" },
];

export const colorFor = (k) =>
  (CATEGORIES.find((c) => c.key === k) || {}).color || "#e8b04b";

export const strengthClass = (s) => {
  const v = (s || "").toLowerCase();
  if (v.includes("өндөр")) return "hi";
  if (v.includes("дунд")) return "mid";
  return "lo";
};
