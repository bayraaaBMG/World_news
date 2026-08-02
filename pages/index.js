import React, { useState, useEffect, useCallback, useRef } from "react";
import Head from "next/head";
import { AlertTriangle, Zap, TrendingUp } from "lucide-react";
import Header from "../components/Header";
import TabNav from "../components/TabNav";
import FilterBar from "../components/FilterBar";
import { Card, Skeleton } from "../components/Card";
import SavedDrawer from "../components/SavedDrawer";
import { CATEGORIES, colorFor } from "../lib/categories";
import { extractItems } from "../lib/parser";
import { buildPrompt } from "../lib/prompt";

const CACHE_TTL_MS = 30 * 60 * 1000;

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

function loadSaved() {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(localStorage.getItem("or_saved") || "{}"); } catch { return {}; }
}

export default function App() {
  const [active, setActive]       = useState("ai");
  const [cache, setCache]         = useState({});
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [filters, setFilters]     = useState({ sentiment: "", strength: "" });
  const [saved, setSaved]         = useState({});
  const [drawerOpen, setDrawerOpen] = useState(false);

  const cacheRef = useRef({});

  // ── Restore from localStorage on mount ──────────────────────
  useEffect(() => {
    const c = loadLocalCache();
    if (Object.keys(c).length) { cacheRef.current = c; setCache(c); }
    setSaved(loadSaved());
  }, []);

  // ── Persist cache entry ──────────────────────────────────────
  const saveCache = useCallback((key, items) => {
    const updatedAt = new Date();
    const next = { ...cacheRef.current, [key]: { items, updatedAt } };
    cacheRef.current = next;
    setCache(next);
    try { localStorage.setItem(`or_${key}`, JSON.stringify({ items, ts: updatedAt.getTime() })); } catch {}
  }, []);

  // ── Fetch ────────────────────────────────────────────────────
  const load = useCallback(async (key, force = false) => {
    if (!force && cacheRef.current[key]?.items?.length) {
      setError(null); setLoading(false); return;
    }
    const cat = CATEGORIES.find((c) => c.key === key);
    setLoading(true); setError(null);
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

  // ── Auto-refresh: check every minute, refresh if stale ──────
  useEffect(() => {
    const id = setInterval(() => {
      const entry = cacheRef.current[active];
      if (!entry || Date.now() - entry.updatedAt.getTime() > CACHE_TTL_MS) {
        load(active, true);
      }
    }, 60_000);
    return () => clearInterval(id);
  }, [active, load]);

  useEffect(() => { load(active); }, [active, load]);

  // ── Bookmark ─────────────────────────────────────────────────
  const toggleSave = useCallback((item) => {
    const id = item.url || item.title;
    setSaved((prev) => {
      const next = { ...prev };
      if (next[id]) delete next[id];
      else next[id] = item;
      try { localStorage.setItem("or_saved", JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  // ── Filter ───────────────────────────────────────────────────
  const handleFilter = useCallback((type, val) => {
    setFilters((prev) => ({ ...prev, [type]: prev[type] === val ? "" : val }));
  }, []);

  const accent      = colorFor(active);
  const current     = cache[active] || {};
  const items       = current.items || [];
  const updated     = current.updatedAt || null;
  const savedList   = Object.values(saved);

  const visibleItems = items.filter((a) => {
    if (filters.sentiment && a.sentiment !== filters.sentiment) return false;
    if (filters.strength && !(a.opportunity_strength || "").toLowerCase().includes(filters.strength)) return false;
    return true;
  });

  return (
    <div className="or-root">
      <Head>
        <title>Opportunity Radar</title>
      </Head>
      <Header
        loading={loading}
        updated={updated}
        onRefresh={() => load(active, true)}
        savedCount={savedList.length}
        onSavedOpen={() => setDrawerOpen(true)}
      />
      <TabNav active={active} onChange={(k) => { setActive(k); setFilters({ sentiment: "", strength: "" }); }} loaded={cache} />

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
                {loading ? "татаж байна…" : `${visibleItems.length} мэдээ`}
              </span>
            </div>

            {!loading && items.length > 0 && (
              <FilterBar
                sentiment={filters.sentiment}
                strength={filters.strength}
                onChange={handleFilter}
                total={items.length}
                visible={visibleItems.length}
              />
            )}

            <div className="or-grid">
              {loading
                ? [0, 1, 2, 3].map((i) => <Skeleton key={i} i={i} />)
                : visibleItems.map((a, i) => {
                    const id = a.url || a.title;
                    return (
                      <Card
                        key={i}
                        a={a}
                        accent={accent}
                        i={i}
                        saved={!!saved[id]}
                        onSave={toggleSave}
                      />
                    );
                  })}
            </div>

            {!loading && visibleItems.length === 0 && items.length > 0 && (
              <p className="or-no-results">Шүүлтэнд тохирох мэдээ олдсонгүй.</p>
            )}
          </>
        )}
      </main>

      <footer className="or-footer">
        <span><TrendingUp size={12} /> Real-time web search + Claude шинжилгээ</span>
        <span className="or-foot-note">
          Дүгнэлт нь AI-аар үүсгэгдсэн — шийдвэр гаргахаасаа өмнө эх сурвалжийг шалгана уу.
        </span>
      </footer>

      {drawerOpen && (
        <SavedDrawer
          items={savedList}
          onClose={() => setDrawerOpen(false)}
          onUnsave={toggleSave}
        />
      )}
    </div>
  );
}
