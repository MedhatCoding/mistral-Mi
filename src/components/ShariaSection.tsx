"use client";

/* قسم الشريعة الكامل: جدول أسهم الشريعة بقرارات المحرك + نسب التطهير + حاسبة التطهير + صناديق الشريعة */

import { useCallback, useEffect, useState } from "react";
import { analyze, SHARIA } from "@/lib/engine";
import { NAMES } from "@/lib/names";
import { PURIFY, FUNDS_CATALOG } from "@/lib/shariaData";
import { RAW, BRANCHES } from "@/lib/repo";
import { fetchJSON, timeAgoAr } from "@/lib/fetchJSON";

type Candle = { d?: string; o?: number; h?: number; l?: number; c: number; v?: number };
type Hist = { stocks?: Record<string, Candle[]> };
type Quote = { ticker: string; price?: number; open?: number; high?: number; low?: number; volume?: number | null; trade_date?: string | null };
type Live = { quotes: Quote[] };
type V = { sc: number; rec: string };

const NF = (v: number | null | undefined) => v == null ? "—" : new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(v);
const PCT = (v: number | null | undefined) => v == null ? "—" : (v >= 0 ? "+" : "") + v.toFixed(2) + "%";

export default function ShariaSection() {
  const [rows, setRows] = useState<Record<string, { price: number; chg: number; verdict: V | null }>>({});
  const [at, setAt] = useState(0);
  const [stale, setStale] = useState(false);
  const [amount, setAmount] = useState("");
  const [rate, setRate] = useState("");
  const [tahrir, setTahrir] = useState("");

  const load = useCallback(async () => {
    const [hist, live] = await Promise.all([
      fetchJSON<Hist>(RAW(BRANCHES.hist, "hist.json"), 30000),
      fetchJSON<Live>(RAW(BRANCHES.live, "live.json"), 10000),
    ]);
    let h = hist;
    if (!h || !h.stocks) { const c0 = hist ? null : null; h = h || { stocks: {} }; }
    const stocks = (h && h.stocks) || {};
    const LQ: Record<string, Quote> = {};
    (live?.quotes || []).forEach(q => { if (q.ticker && q.price) LQ[q.ticker] = q });
    const setQuotes = useState(null)[1];
    setQuotes; // noop — keep TS quiet
  }, []);
  useEffect(() => { load2(); }, []);

  const load2 = async () => {
    const [hist, live] = await Promise.all([
      fetchJSON<Hist>(RAW(BRANCHES.hist, "hist.json"), 30000),
      fetchJSON<Live>(RAW(BRANCHES.live, "live.json"), 10000).catch(() => null),
    ]);
    const stocks = (hist && hist.stocks) || {};
    const LQ: Record<string, Quote> = {};
    ((live && live.quotes) || []).forEach(q => { if (q.ticker && q.price) LQ[q.ticker] = q });
    const out: Record<string, { price: number; chg: number; verdict: V | null }> = {};
    Object.keys(stocks).forEach(sym => {
      if (!SHARIA.includes(sym)) return;
      const arr = (stocks[sym] || []).filter(c => c && c.c > 0);
      if (arr.length < 2) return;
      const last = arr[arr.length - 1];
      const prev = arr[arr.length - 2];
      const q = LQ[sym];
      let price = last.c, o = last.o != null ? last.o : last.c, hi = last.h != null ? last.h : last.c, lo = last.l != null ? last.l : last.c, vol = last.v || 0;
      if (q && q.price && q.trade_date !== (last.d || null)) {
        price = q.price;
        o = q.open != null ? q.open : price;
        hi = q.high != null ? q.high : Math.max(price, last.c);
        lo = q.low != null ? q.low : Math.min(price, last.c);
        vol = q.volume != null ? q.volume : 0;
      }
      const chg = prev.c ? ((price - prev.c) / prev.c) * 100 : 0;
      let v: V | null = null;
      try { v = analyze([...arr.slice(0, -1), { d: null, o, h: hi, l: lo, c: price, v: vol }]) } catch {}
      out[sym] = { price, chg, verdict: v ? { sc: v.sc, rec: v.rec } : null };
    });
    setRows(out); setAt(Date.now());
    setStale(!hist);
  };

  useEffect(() => { load2(); }, []);

  const calcTahrir = () => {
    const a = +amount, r = +rate;
    if (!a || r < 0) { setTahrir("أدخل مبالغ صحيحة"); return }
    setTahrir("مبلغ التطهير الواجب إخراجه: " + NF(a * r / 100) + " ج.م — أخرجه للصدقات بنية التخلص من المال الحرام.");
  };

  return (
    <main style={{ maxWidth: 960, margin: "0 auto", padding: 16, display: "grid", gap: 14 }}>
      <div className="card">
        <div className="row-between">
          <h3>☪️ قسم الشريعة — EGX33 + المتوافق خارج المؤشر</h3>
          <span className="muted small">{at ? (stale ? "💾 " : "🛰️ ") + timeAgoAr(at) : ""}</span>
        </div>
        <p className="small muted" style={{ lineHeight: 1.8, marginTop: 6 }}>
          مستويان: (١) مكونات مؤشر EGX33 الرسمية (مراجعة سبتمبر ٢٠٢٦) · (٢) أسهم متوافقة خارج المؤشر (EGXTRA) بمنهجية S&amp;P DJI/AAOIFI.
          نسب التطهير تقديرية وقابلة للمراجعة.
        </p>
      </div>

      <div className="card">
        <h3>أصول الشريعة وقرارات المحرك</h3>
        <table style={{ marginTop: 8 }}>
          <thead><tr><th>الشركة</th><th>الرمز</th><th>القطاع</th><th>السعر</th><th>التغير</th><th>التطهير</th><th>قرار المحرك</th></tr></thead>
          <tbody>
            {SHARIA.map(sym => {
              const w = rows[sym];
              const pur = PURIFY[sym];
              return (
                <tr key={sym}>
                  <td><b>{NAMES[sym] || sym}</b></td>
                  <td className="num">{sym}</td>
                  <td className="muted small">{NAMES[sym] ? "" : sym}</td>
                  <td className="num">{w ? NF(w.price) : "—"}</td>
                  <td className="num" style={{ color: w && w.chg >= 0 ? "var(--green)" : "var(--red)" }}>{w ? PCT(w.chg) : "—"}</td>
                  <td>{pur != null ? pur + "%" : <span className="muted small">راجع قوائمك</span>}</td>
                  <td>{w && w.verdict ? <span className="badge" style={{ color: w.verdict.sc >= 1.5 ? "var(--green)" : w.verdict.sc <= -1.5 ? "var(--red)" : "var(--amber)" }}>{w.verdict.rec}</span> : <span className="muted small">—</span>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <button className="btn mini" style={{ marginTop: 10 }} onClick={load2}>🔄 تحديث</button>
      </div>

      <div className="card">
        <h3>🧮 حاسبة تطهير رأس المال</h3>
        <div className="row" style={{ margin: "10px 0" }}>
          <input placeholder="قيمة المحفظة (ج.م)" type="number" value={amount} onChange={e => setAmount(e.target.value)} style={{ width: 180 }} />
          <input placeholder="نسبة التطهير %" type="number" step="0.01" value={rate} onChange={e => setRate(e.target.value)} style={{ width: 140 }} />
          <button className="btn primary mini" onClick={calcTahrir}>احسب</button>
        </div>
        {tahrir && <p className="small" style={{ color: "var(--accent2)" }}>{tahrir}</p>}
      </div>

      <div className="card">
        <h3>🕋 صناديق الشريعة (كتالوج مرجعي)</h3>
        <table style={{ marginTop: 8 }}>
          <thead><tr><th>الصندوق</th><th>النوع</th><th>آخر NAV مرجعي</th></tr></thead>
          <tbody>
            {FUNDS_CATALOG.filter(f => f.sh).map(f => (
              <tr key={f.name}>
                <td><b>{f.name}</b></td>
                <td>{f.type}</td>
                <td className="num">{f.nav != null ? NF(f.nav) : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="small muted" style={{ marginTop: 8 }}>الصناديق المصرية بتنشر أسعارها من غير API — حدّث الـ NAV من كشف حسابك. وملاحظة: مزوّد صناديق مباشر بيرجع 401 حاليًا في الريليه.</p>
      </div>

      <p className="muted small" style={{ textAlign: "center" }}>
        <a href="/stocks">📋 كل الأسهم</a> · <a href="/modern">التوصيات</a> · <a href="/">التطبيق الكامل</a>
      </p>
    </main>
  );
}
