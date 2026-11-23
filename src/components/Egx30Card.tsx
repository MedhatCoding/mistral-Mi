"use client";

/* 📊 كارت مؤشر EGX30 الحي — من حقل idx في live.json */
import { useEffect, useState } from "react";
import { fetchJSON, cachedJSON, timeAgoAr } from "@/lib/fetchJSON";
import { RAW, BRANCHES } from "@/lib/repo";

type IdxData = { value?: number; change_percent?: number; open?: number; high?: number; low?: number };
type Live = { t: number; idx?: { data?: IdxData } };

const URL = RAW(BRANCHES.live, "live.json");

export default function Egx30Card() {
  const [idx, setIdx] = useState<IdxData | null>(null);
  const [t, setT] = useState<number>(0);
  const [stale, setStale] = useState(false);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      const j = await fetchJSON<Live>(URL, 10000);
      if (!alive) return;
      const d = j?.idx?.data;
      if (d && d.value != null) { setIdx(d); setT(j!.t); setStale(false); }
      else {
        const c = cachedJSON<Live>(URL);
        if (c && c.j?.idx?.data?.value != null) { setIdx(c.j.idx.data); setT(c.j.t); setStale(true); }
      }
    };
    load();
    const id = setInterval(load, 3 * 60 * 1000);
    return () => { alive = false; clearInterval(id); };
  }, []);

  if (!idx || idx.value == null) return <div className="card"><p className="muted small">⏳ جارٍ جلب المؤشر…</p></div>;

  const up = (idx.change_percent || 0) >= 0;
  return (
    <div className="card">
      <div className="row-between">
        <h3>📊 مؤشر EGX30 الحي</h3>
        <span className="muted small">{stale ? "💾 " : "🛰️ "}{timeAgoAr(t)}</span>
      </div>
      {stale && <p className="muted small">⚠️ السيرفر مش رد — آخر لقطة محفوظة</p>}
      <div className="num" style={{ fontSize: 30, fontWeight: 700 }}>{idx.value.toLocaleString("ar-EG", { maximumFractionDigits: 1 })}</div>
      <div className="num" style={{ color: up ? "var(--green)" : "var(--red)", fontWeight: 600 }}>
        {up ? "\u25b2" : "\u25bc"} {Math.abs(idx.change_percent || 0).toFixed(2)}%
      </div>
      <div className="metrics muted small">
        <div>الافتتاح: <span className="num">{idx.open?.toLocaleString("ar-EG") || "\u2014"}</span></div>
        <div>الأعلى: <span className="num" style={{ color: "var(--green)" }}>{idx.high?.toLocaleString("ar-EG") || "\u2014"}</span> · الأدنى: <span className="num" style={{ color: "var(--red)" }}>{idx.low?.toLocaleString("ar-EG") || "\u2014"}</span></div>
      </div>
    </div>
  );
}