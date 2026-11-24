"use client";

/* قائمة كل الأسهم — أسماء وقطاعات وأسعار لحظية من الريليه + فلترة */

import { useEffect, useMemo, useState } from "react";
import { S } from "@/lib/names";
import { SHARIA } from "@/lib/engine";
import { PURIFY } from "@/lib/shariaData";
import { RAW, BRANCHES } from "@/lib/repo";
import { fetchJSON, timeAgoAr } from "@/lib/fetchJSON";

type Candle = { d?: string; o?: number; h?: number; l?: number; c: number; v?: number };
type Hist = { stocks?: Record<string, Candle[]> };
type Live = { t: number; quotes: { ticker: string; price?: number }[] };

const NF = (v: number | null | undefined) => v == null ? "—" : new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(v);

export default function StocksAllCard() {
  const [q, setQ] = useState("");
  const [sector, setSector] = useState("all");
  const [shOnly, setShOnly] = useState(false);
  const [prices, setPrices] = useState<Record<string, { p: number | null; live: boolean }>>({});
  const [at, setAt] = useState(0);
  const [stale, setStale] = useState(false);

  const sectors = useMemo(() => [...new Set(S.map(x => x.s))], []);

  const load = async () => {
    const [hist, live] = await Promise.all([
      fetchJSON<Hist>(RAW(BRANCHES.hist, "hist.json"), 30000),
      fetchJSON<Live>(RAW(BRANCHES.live, "live.json"), 10000),
    ]);
    let h = hist;
    if (!h || !h.stocks) { h = { stocks: {} }; setStale(false); } else setStale(false);
    const P: Record<string, { p: number | null; live: boolean }> = {};
    const LQ: Record<string, number | undefined> = {};
    (live?.quotes || []).forEach(q2 => { if (q2.ticker && q2.price) LQ[q2.ticker] = q2.price });
    Object.keys(h.stocks || {}).forEach(sym => {
      const arr = (h.stocks || {})[sym] || [];
      const last = arr.length ? arr[arr.length - 1] : null;
      P[sym] = { p: (LQ[sym] != null ? LQ[sym] : (last ? last.c : null)), live: LQ[sym] != null };
    });
    setPrices(P); setAt(Date.now());
  };

  useEffect(() => { load(); }, []);

  const shown = useMemo(() => S.filter(x =>
    (!shOnly || SHARIA.includes(x.t)) &&
    (sector === "all" || x.s === sector) &&
    (!q || x.t.includes(q) || x.n.indexOf(q) > -1)
  ), [q, sector, shOnly]);

  return (
    <div className="card">
      <div className="row-between">
        <h3>📋 قائمة كل الأسهم</h3>
        <span className="muted small">{at ? (stale ? "💾 " : "🛰️ ") + timeAgoAr(at) : ""}</span>
      </div>
      <div className="row" style={{ margin: "10px 0" }}>
        <input placeholder="🔍 ابحث بالاسم أو الرمز..." value={q} onChange={e => setQ(e.target.value)} style={{ flex: 1, minWidth: 160 }} />
        <select value={sector} onChange={e => setSector(e.target.value)}>
          <option value="all">كل القطاعات</option>
          {sectors.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <label className="small muted">
          <input type="checkbox" checked={shOnly} onChange={e => setShOnly(e.target.checked)} /> الشريعة فقط
        </label>
        <button className="btn mini" onClick={load}>🔄</button>
      </div>
      <table>
        <thead><tr><th>الشركة</th><th>الرمز</th><th>القطاع</th><th>السعر</th><th>الشريعة</th></tr></thead>
        <tbody>
          {shown.length === 0 && <tr><td colSpan={5}><span className="muted small">لا نتائج مطابقة</span></td></tr>}
          {shown.map(x => (
            <tr key={x.t}>
              <td><b>{x.n}</b></td>
              <td className="num">{x.t}</td>
              <td className="muted small">{x.s}</td>
              <td className="num">{prices[x.t] ? NF(prices[x.t].p) : (x.p != null ? NF(x.p) + ' *' : "—")}</td>
              <td>{SHARIA.includes(x.t) ? <span className="badge" style={{ background: "rgba(34,211,165,.14)", color: "var(--accent2)" }}>☪️ {PURIFY[x.t] != null ? "تطهير " + PURIFY[x.t] + "%" : "متوافق"}</span> : <span className="muted small">—</span>}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="muted small" style={{ marginTop: 8 }}>السعر المميز بعلامة * هو آخر سعر مرجعي — ولو فيه 🛰️ فوق يبقى السعر لحظي أثناء الجلسة. عدد النتائج: {shown.length}</p>
    </div>
  );
}
