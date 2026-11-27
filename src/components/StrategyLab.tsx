"use client";

/* 🔬 مختبر الاستراتيجيات — محاكاة كمية على سهم واحد قبل ما تدفع فلوسك */

import { useEffect, useMemo, useState } from "react";
import { backtestSym } from "@/lib/quant";
import { NAMES } from "@/lib/names";
import { RAW, BRANCHES } from "@/lib/repo";
import { fetchJSON } from "@/lib/fetchJSON";

type Candle = { d?: string; o?: number; h?: number; l?: number; c: number; v?: number };
type Hist = { stocks?: Record<string, Candle[]> };

const NF = (v: number | null | undefined) => v == null ? "—" : new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(v);
const sign = (x: number) => (x >= 0 ? "+" : "") + x.toFixed(1) + "%";

export default function StrategyLab() {
  const [hist, setHist] = useState<Hist | null>(null);
  const [sym, setSym] = useState("COMI");
  const [res, setRes] = useState<any>(null);
  const [state, setState] = useState("");

  useEffect(() => { fetchJSON<Hist>(RAW(BRANCHES.hist, "hist.json"), 30000).then(h => setHist(h)); }, []);

  const syms = useMemo(() => Object.keys((hist && hist.stocks) || {}).filter(s => ((hist as any).stocks[s] || []).length >= 80).sort(), [hist]);

  const run = () => {
    const arr = ((hist && hist.stocks) || {})[sym] || [];
    setState("جارٍ تشغيل المحاكاة على السنة كاملة…");
    setTimeout(() => { setRes(backtestSym(arr)); setState(""); }, 50);
  };

  return (
    <div className="card">
      <h3>🔬 مختبر الاستراتيجيات — محاكاة كمية</h3>
      <p className="small muted" style={{ lineHeight: 1.8, margin: "6px 0 10px" }}>
        محاكاة استراتيجية كمّية (اتجاه SMA20/50 + زخم RSI + إدارة مخاطر بوقف 2×ATR وهدف 3×ATR) على بيانات سنة كاملة،
        ومقارنتها بـ«اشترِ واحتفظ» — قبل ما تدفع فلوسك، اعرف الأرقام.
      </p>
      <div className="row" style={{ margin: "10px 0" }}>
        <select value={sym} onChange={e => setSym(e.target.value)}>
          {(syms.length ? syms : [sym]).map(s => <option key={s} value={s}>{s}{NAMES[s] ? " — " + NAMES[s] : ""}</option>)}
        </select>
        <button className="btn primary mini" onClick={run} disabled={!hist}>🚀 شغّل المحاكاة</button>
        {state && <span className="small muted">{state}</span>}
      </div>
      {res && res.err && <p className="small" style={{ color: "var(--amber)" }}>⚠️ {res.err}</p>}
      {res && !res.err && (
        <>
          <div className="row" style={{ gap: 18, fontSize: 13.5, flexWrap: "wrap", margin: "10px 0" }}>
            <span>صفقات: <b>{res.n}</b></span>
            <span style={{ color: res.wr >= 50 ? "var(--green)" : "var(--red)" }}>نسبة النجاح: <b>{res.wr.toFixed(0)}%</b></span>
            <span style={{ color: res.tot >= 0 ? "var(--green)" : "var(--red)" }}>عائد الاستراتيجية: <b>{sign(res.tot)}</b></span>
            <span style={{ color: res.bh >= 0 ? "var(--green)" : "var(--red)" }}>اشترِ واحتفظ: <b>{sign(res.bh)}</b></span>
            <span style={{ color: "var(--red)" }}>أقصى سحب: <b>-{res.mdd.toFixed(1)}%</b></span>
            <span>معامل الربح: <b>{res.pfs}</b></span>
            <span>تقلب سنوي: <b>{res.vol.toFixed(0)}%</b></span>
            <span style={{ color: "var(--amber)" }}>حجم مقترح (كيلي): <b>{res.kelly.toFixed(0)}%</b></span>
          </div>
          <div dangerouslySetInnerHTML={{ __html: res.svg }} />
          <p className="muted small" style={{ marginTop: 4 }}>🟢 منحنى الاستراتيجية · الرمادي المتقطع: اشترِ واحتفظ</p>
          {res.trades.length > 0 && (
            <table style={{ marginTop: 10 }}>
              <thead><tr><th>سبب الخروج</th><th>الدخول</th><th>الخروج</th><th>العائد</th><th>المدة</th></tr></thead>
              <tbody>
                {res.trades.map((t: any, i: number) => (
                  <tr key={i}>
                    <td>{t.why}</td><td className="num">{NF(t.en)}</td><td className="num">{NF(t.ex)}</td>
                    <td className="num" style={{ color: t.ret >= 0 ? "var(--green)" : "var(--red)" }}>{(100 * t.ret).toFixed(1)}%</td>
                    <td className="num">{t.days} يوم</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <p className="small" style={{ color: "var(--amber)", marginTop: 10 }}>⚠️ المحاكاة على بيانات تاريخية — الأداء السابق لا يضمن المستقبل، وتكاليف السمسرة غير محسوبة.</p>
        </>
      )}
      {!hist && <p className="muted small">⏳ جارٍ تحميل التاريخ…</p>}
    </div>
  );
}
