import React, { useState, useEffect, useCallback, useRef } from "react";
import { AlertTriangle, Zap, TrendingUp } from "lucide-react";
import Header from "../components/Header";
import TabNav from "../components/TabNav";
import { Card, Skeleton } from "../components/Card";
import { CATEGORIES, colorFor } from "../lib/categories";
import { extractItems } from "../lib/parser";
import { buildPrompt } from "../lib/prompt";

async function callClaude(prompt) {
  const res = await fetch("/api/claude", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "API алдаа: " + res.status);
  }
  const data = await res.json();
  return data.text || "";
}

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
    setLoading(true);
    setError(null);
    setItems([]);
    try {
      const raw = await callClaude(buildPrompt(cat));
      const parsed = extractItems(raw);
      if (id !== reqId.current) return;
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

  return (
    <div className="or-root">
      <Header loading={loading} updated={updated} onRefresh={() => load(active)} />
      <TabNav active={active} onChange={setActive} />

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
              <span className="or-count">
                {loading ? "татаж байна…" : `${items.length} мэдээ`}
              </span>
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
        <span className="or-foot-note">
          Дүгнэлт нь AI-аар үүсгэгдсэн — шийдвэр гаргахаасаа өмнө эх сурвалжийг шалгана уу.
        </span>
      </footer>
    </div>
  );
}
