"use client";

/* كارت فحص السوق — بمحرك التحليل الفني نفسه (src/lib/engine.js)
   البيانات: hist.json (تاريخ كامل) + live.json (دمج سعر الجلسة) + الشريعة */

import { useCallback, useEffect, useMemo, useState } from "react";
import { analyze, SHARIA } from "@/lib/engine";
import { NAMES } from "@/lib/names";
import { fetchJSON, cachedJSON, timeAgoAr } from "@/lib/fetchJSON";
import { RAW, BRANCHES } from "@/lib/repo";

type Candle = { d?: string; o?: number; h?: number; l?: number; c: number; v?: number };
type Hist = { t?: number; stocks?: Record<string, Candle[]> };
type Quote = { ticker: string; price?: number; open?: number; high?: number; low?: number; volume?: number | null; trade_date?: string | null };
type Live = { t: number; quotes: Quote[] };

const HIST_URL = RAW(BRANCHES.hist, "hist.json");
const LIVE_URL = RAW(BRANCHES.live, "live.json");

const toCandles = (raw: Candle[] | undefined) =>
  (raw || []).filter((c) => c && c.c > 0).map((c) => ({
    d: c.d || null, o: c.o != null ? c.o : c.c, h: c.h != null ? c.h : c.c,
    l: c.l != null ? c.l : c.c, c: c.c, v: c.v || 0,
  }));

type Row = {
  sym: string; name: string; price: number; chg: number;
  rec?: string; cls?: string; sc?: number; stop?: number; t1?: number; risk?: string;
  sharia: boolean; stale?: boolean;
};

export default function ScannerCard() {
  const [rows, setRows] = useState<Row[]>([]);
  const [state, setState] = useState<"loading" | "ok" | "fail">("loading");
  const [at, setAt] = useState(0);
  const [stale, setStale] = useState(false);
  const [onlySharia, setOnlySharia] = useState(true);
  const [busy, setBusy] = useState(false);

  const run = useCallback(async () => {
    setBusy(true);
    try {
      const [hist, live] = await Promise.all([
        fetchJSON<Hist>(HIST_URL, 30000),
        fetchJSON<Live>(LIVE_URL, 10000),
      ]);
      let h = hist;
      if (!h || !h.stocks) {
        const c = cachedJSON<Hist>(HIST_URL);
        if (c) { h = c.j; setStale(true); }
      } else setStale(false);
      const Q: Record<string, Quote> = {};
      (live?.quotes || []).forEach((q) => { if (q.ticker && q.price) Q[q.ticker] = q; });

      const out: Row[] = [];
      const stocks = h?.stocks || {};
      for (const sym of Object.keys(stocks)) {
        const arr = toCandles(stocks[sym]);
        if (arr.length < 60) continue;
        const last = arr[arr.length - 1];
        const prev = arr.length > 1 ? arr[arr.length - 2] : last;
        let price = last.c, o = last.o, hi = last.h, lo = last.l, vol = last.v || 0;
        const td = Q[sym];
        if (td && td.price && td.trade_date !== (last.d || null)) {
          price = td.price;
          o = td.open ?? price;
          hi = td.high ?? Math.max(price, last.c);
          lo = td.low ?? Math.min(price, last.c);
          vol = td.volume ?? 0;
        }
        const chg = prev.c ? ((price - prev.c) / prev.c) * 100 : 0;
        try {
          const v = analyze([...arr.slice(0, -1), { d: null, o, h: hi, l: lo, c: price, v: vol }]);
          if (!v) continue;
          out.push({
            sym, name: NAMES[sym] || sym, price, chg,
            rec: v.rec, cls: v.cls, sc: v.sc, stop: v.stop, t1: v.t1, risk: v.risk,
            sharia: SHARIA.includes(sym), stale: !!td,
          });
        } catch {}
      }
      out.sort((a, b) => (b.sc || 0) - (a.sc || 0));
      setRows(out);
      setAt(Date.now());
      setState("ok");
    } catch {
      setState("fail");
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => { run(); }, [run]);

  const shown = useMemo(() => rows.filter((r) => !onlySharia || r.sharia), [rows, onlySharia]);

  return (
    <div className="card">
      <div className="row-between">
        <h3>🔍 فحص السوق — محرك التحليل الفني</h3>
        <span className="muted small">{at ? (stale ? "💾 " : "🛰️ ") + timeAgoAr(at) : ""}</span>
      </div>
      {state === "loading" && <p className="muted small">⏳ جارٍ تنزيل التاريخ الكامل وتشغيل المحرك… (بياخد ثواني)</p>}
      {state === "fail" && <p className="muted small">⚠️ تعذر جلب التاريخ — جرّب تاني.</p>}
      {state === "ok" && (
        <>
          <div className="row" style={{ margin: "8px 0" }}>
            <label className="small muted">
              <input type="checkbox" checked={onlySharia} onChange={(e) => setOnlySharia(e.target.checked)} /> الأسهم المتوافقة مع الشريعة فقط ({rows.filter((r) => r.sharia).length} من {rows.length})
            </label>
            <button className="btn mini" onClick={run} disabled={busy}>{busy ? "⏳…" : "🔄 إعادة الفحص"}</button>
          </div>
          <table>
            <thead><tr><th>السهم</th><th>القرار</th><th>السعر</th><th>الهدف</th><th>الوقف</th><th>المخاطرة</th></tr></thead>
            <tbody>
              {shown.slice(0, 40).map((r) => (
                <tr key={r.sym}>
                  <td><b>{r.sym}</b> <span className="muted small">{r.name}</span>{r.sharia && <span className="badge" style={{ background: "rgba(34,211,165,.14)", color: "var(--accent2)" }}>شريعة</span>}</td>
                  <td style={{ color: (r.cls || "").indexOf("sell") > -1 ? "var(--red)" : (r.cls || "").indexOf("hold") > -1 ? "var(--amber)" : "var(--green)" }}>{r.rec}</td>
                  <td className="num">{r.price} (<span style={{ color: r.chg >= 0 ? "var(--green)" : "var(--red)" }}>{r.chg >= 0 ? "+" : ""}{r.chg.toFixed(2)}%</span>)</td>
                  <td className="num">{r.t1 ?? "—"}</td>
                  <td className="num" style={{ color: "var(--red)" }}>{r.stop ?? "—"}</td>
                  <td>{r.risk}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {shown.length > 40 && <p className="muted small" style={{ marginTop: 6 }}>عرض الأول 40 حسب الدرجة من أصل {shown.length}.</p>}
        </>
      )}
    </div>
  );
}
