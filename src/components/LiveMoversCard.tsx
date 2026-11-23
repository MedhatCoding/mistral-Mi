"use client";

/* 📡 كارت الريليه اللحظي — من live.json على فرع live: أكبر صاعد وآخر أسعار */
import { useEffect, useState } from "react";
import { fetchJSON, cachedJSON, timeAgoAr } from "@/lib/fetchJSON";
import { RAW, BRANCHES } from "@/lib/repo";

type Quote = { ticker: string; price?: number; change_percent?: number | null; volume?: number | null; trade_date?: string | null };
type Live = { t: number; src?: string; quotes: Quote[] };

const URL = RAW(BRANCHES.live, "live.json");

export default function LiveMoversCard() {
  const [data, setData] = useState<Live | null>(null);
  const [stale, setStale] = useState(false);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      const j = await fetchJSON<Live>(URL, 10000);
      if (!alive) return;
      if (j && j.t) { setData(j); setStale(false); }
      else {
        const c = cachedJSON<Live>(URL);
        if (c) { setData(c.j); setStale(true); }
      }
    };
    load();
    const id = setInterval(load, 3 * 60 * 1000);
    return () => { alive = false; clearInterval(id); };
  }, []);

  if (!data) return <div className="card"><p className="muted small">⏳ جارٍ جلب الأسعار اللحظية…</p></div>;

  const q = (data.quotes || []).filter((x) => x.change_percent != null);
  const top = [...q].sort((a, b) => (b.change_percent || 0) - (a.change_percent || 0)).slice(0, 8);
  const flop = [...q].sort((a, b) => (a.change_percent || 0) - (b.change_percent || 0)).slice(0, 4);

  return (
    <div className="card">
      <div className="row-between">
        <h3>📡 ريليه اللحظي — أكبر التحركات</h3>
        <span className="muted small" title={stale ? "نسخة محفوظة" : "حي"}>{stale ? "💾 " : "🛰️ "}{timeAgoAr(data.t)} · {q.length} سهم</span>
      </div>
      {stale && <p className="muted small">⚠️ السيرفر مش رد — أسعار آخر لقطة محفوظة</p>}
      <div className="grid2">
        <div>
          <b style={{ color: "var(--green)" }}>🟢 الأعلى ارتفاعًا</b>
          {top.map((x) => (
            <div key={x.ticker} className="row-between">
              <span>{x.ticker}</span><span className="num" style={{ color: "var(--green)" }}>+{(x.change_percent || 0).toFixed(2)}%</span>
            </div>
          ))}
        </div>
        <div>
          <b style={{ color: "var(--red)" }}>🔴 الأعلى انخفاضًا</b>
          {flop.map((x) => (
            <div key={x.ticker} className="row-between">
              <span>{x.ticker}</span><span className="num" style={{ color: "var(--red)" }}>{(x.change_percent || 0).toFixed(2)}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}