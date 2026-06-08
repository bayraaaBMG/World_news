import React, { useState, useEffect, useCallback, useRef } from "react";
import { AlertTriangle, Zap, TrendingUp } from "lucide-react";
import Header from "../components/Header";
import TabNav from "../components/TabNav";
import { Card, Skeleton } from "../components/Card";
import { CATEGORIES, colorFor } from "../lib/categories";
import { extractItems } from "../lib/parser";
import { buildPrompt } from "../lib/prompt";

const CACHE_TTL_MS = 30 * 60 * 1000; // 30 минут

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

function loadLocalCache() {
  if (typeof window === "undefined") return {};
  const restored = {};
  CATEGORIES.forEach(({ key }) => {
    try {
      const raw = localStorage.getItem(`or_${key}`);
      if (!raw) return;
      const { items, ts } = JSON.parse(raw);
      if (Date.now() - ts < CACHE_TTL_MS) {
        restored[key] = { items, updatedAt: new Date(ts) };
      }
    } catch {}
  });
  return restored;
}

export default function App() {
  const [active, setActive] = useState("ai");
  const [cache, setCache] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Ref keeps cache readable inside stable callbacks without stale closure
  const cacheRef = useRef({});

  const saveCache = useCallback((key, items) => {
    const updatedAt = new Date();
    const next = { ...cacheRef.current, [key]: { items, updatedAt } };
    cacheRef.current = next;
    setCache(next);
    try {
      localStorage.setItem(`or_${key}`, JSON.stringify({ items, ts: updatedAt.getTime() }));
    } catch {}
  }, []);

  // Restore from localStorage on first mount
  useEffect(() => {
    const restored = loadLocalCache();
    if (Object.keys(restored).length) {
      cacheRef.current = restored;
      setCache(restored);
    }
  }, []);

  const load = useCallback(async (key, force = false) => {
    if (!force && cacheRef.current[key]?.items?.length) {
      setError(null);
      setLoading(false);
      return;
    }
    const cat = CATEGORIES.find((c) => c.key === key);
    setLoading(true);
    setError(null);
    try {
      const raw = await callClaude(buildPrompt(cat));
      const parsed = extractItems(raw);
      if (!parsed.length) throw new Error("Мэдээ боловсруулж чадсангүй. Дахин оролдоно уу.");
      saveCache(key, parsed);
    } catch (e) {
      setError(e.message || "Алдаа гарлаа");
    } finally {
      setLoading(false);
    }
  }, [saveCache]);

  // When active tab changes, load if not cached
  useEffect(() => { load(active); }, [active, load]);

  const accent = colorFor(active);
  const current = cache[active] || {};
  const items = current.items || [];
  const updated = current.updatedAt || null;

  return (
    <div className="or-root">
      <Header loading={loading} updated={updated} onRefresh={() => load(active, true)} />
      <TabNav active={active} onChange={setActive} loaded={cache} />

      <main className="or-main">
        {error && (
          <div className="or-error">
            <AlertTriangle size={18} />
            <span>{error}</span>
            <button onClick={() => load(active, true)}>Дахин оролдох</button>
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
