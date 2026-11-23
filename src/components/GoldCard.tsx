"use client";

/* 🥇 كارت توصيات الذهب — من gold.json على فرع gold (أونصة + دولار/جنيه) */
import { useEffect, useState } from "react";
import { fetchJSON, cachedJSON } from "@/lib/fetchJSON";
import { RAW, BRANCHES } from "@/lib/repo";

type Series = { close: number[] };
type Gold = Record<string, Series>;

const URL = RAW(BRANCHES.gold, "gold.json");

export default function GoldCard() {
  const [data, setData] = useState<Gold | null>(null);
  const [stale, setStale] = useState(false);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      const j = await fetchJSON<Gold>(URL);
      if (!alive) return;
      if (j && j["XAUUSD=X"]?.close?.length) { setData(j); setStale(false); }
      else {
        const c = cachedJSON<Gold>(URL);
        if (c) { setData(c.j); setStale(true); }
      }
    };
    load();
    const id = setInterval(load, 15 * 60 * 1000);
    return () => { alive = false; clearInterval(id); };
  }, []);

  if (!data) return <div className="card"><p className="muted small">⏳ جارٍ جلب أسعار الذهب…</p></div>;

  const oz = data["XAUUSD=X"].close.at(-1) || 0;
  const prev = data["XAUUSD=X"].close.at(-2) || oz;
  const chg = oz - prev;
  const egp = data["USDEGP=X"]?.close?.at(-1) || 50;
  const g24 = (oz / 31.1035) * egp;

  return (
    <div className="card">
      <div className="row-between">
        <h3>🥇 الذهب — السعر اللحظي</h3>
        {stale && <span className="muted small">💾 آخر لقطة</span>}
      </div>
      <div className="metrics">
        <div>💵 الأونصة: <b className="num">{oz.toFixed(1)}</b> دولار <span style={{ color: chg >= 0 ? "var(--green)" : "var(--red)" }}>({chg >= 0 ? "+" : ""}{chg.toFixed(1)})</span></div>
        <div>🥄 عيار 24: <b className="num">{Math.round(g24)}</b> ج.م</div>
        <div>🥄 عيار 21: <b className="num">{Math.round((g24 * 21) / 24)}</b> ج.م · عيار 18: <b className="num">{Math.round((g24 * 18) / 24)}</b> ج.م</div>
        <div className="muted small">تقديري من سعر الدولار لحظي ({egp.toFixed(2)} ج.م).</div>
      </div>
    </div>
  );
}