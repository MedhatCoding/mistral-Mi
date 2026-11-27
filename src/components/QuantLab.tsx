"use client";

/* 🔗🎲 مختبر المحفظة الكمي — ارتباط · تنويع · مونت كارلو · ماركوفيتز */

import { useEffect, useMemo, useState } from "react";
import { corrLab, monteCarlo, markowitz } from "@/lib/quant";
import { NAMES } from "@/lib/names";
import { SHARIA } from "@/lib/engine";
import { RAW, BRANCHES } from "@/lib/repo";
import { fetchJSON } from "@/lib/fetchJSON";

type Candle = { d?: string; o?: number; h?: number; l?: number; c: number; v?: number };
type Hist = { stocks?: Record<string, Candle[]> };
type Holding = { t: string; qty: number; avg: number };

const closesOf = (arr: Candle[] | undefined) => (arr || []).filter(c => c && c.c > 0).map(c => c.c);
const NF = (v: number) => v == null ? "—" : v.toFixed(2);

export default function QuantLab() {
  const [closes, setCloses] = useState<Record<string, number[]>>({});
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [corr, setCorr] = useState<any>(null);
  const [mc, setMc] = useState<any>(null);
  const [mk, setMk] = useState<any>(null);
  const [busy, setBusy] = useState("");

  useEffect(() => {
    fetchJSON<Hist>(RAW(BRANCHES.hist, "hist.json"), 30000).then(h => {
      const C: Record<string, number[]> = {};
      Object.keys((h && h.stocks) || {}).forEach(s => { const c = closesOf((h as any).stocks[s]); if (c.length >= 60) C[s] = c });
      setCloses(C);
    });
    try { setHoldings(JSON.parse(localStorage.getItem("egx_holdings") || "[]")) } catch {}
  }, []);

  const pickSyms = useMemo(() => {
    const held = holdings.map(h => h.t).filter(s => closes[s]);
    if (held.length >= 2) return { syms: held, mode: "محفظتك الفعلية" };
    const ranked = Object.keys(closes).filter(s => SHARIA.includes(s)).sort((a, b) => closes[b].length - closes[a].length).slice(0, 15);
    return { syms: held.length >= 2 ? held : ranked, mode: held.length >= 2 ? "محفظتك الفعلية" : "نموذج عرض لأشهر 15 سهمًا متوافقًا — أضف أسهمك في المحفظة عشان نحللها هي" };
  }, [closes, holdings]);

  const runCorr = () => { setBusy("corr"); setTimeout(() => { setCorr(corrLab(pickSyms.syms, closes, holdings.length >= 2 ? holdings : null, null)); setBusy("") }, 50) };
  const runMc = () => {
    if (pickSyms.syms.length < 2) { setMc({ err: "محتاجين سهمين على الأقل بتاريخ كافي." }); return }
    setBusy("mc");
    setTimeout(() => {
      const held = holdings.filter(h => closes[h.t]);
      let ws: number[] = pickSyms.syms.map(() => 1 / pickSyms.syms.length);
      if (held.length >= 2 && pickSyms.mode === "محفظتك الفعلية") {
        const vals = held.map(h => h.qty * h.avg); const tot = vals.reduce((a, b) => a + b, 0) || 1;
        ws = held.map(h => h.t).map(s => { const i = held.findIndex(h2 => h2.t === s); return vals[i] / tot });
      }
      setMc(monteCarlo(pickSyms.syms, closes, ws)); setBusy("");
    }, 50);
  };
  const runMk = () => { setBusy("mk"); setTimeout(() => { setMk(markowitz(pickSyms.syms, closes)); setBusy("") }, 50) };

  return (
    <>
      <div className="card">
        <h3>🔗 مصفوفة الارتباط ودرجة التنويع</h3>
        <p className="small muted" style={{ lineHeight: 1.8, margin: "6px 0 10px" }}>
          أسهم مرتبطة ببعض بترتفع وتنزل مع بعض — يعني التنويع بينها صوري. المصفوفة على العوائد اليومية لآخر 120 جلسة · {pickSyms.mode}.
        </p>
        <button className="btn primary mini" onClick={runCorr}>{busy === "corr" ? "⏳…" : "🔗 احسب الارتباط والتنويع"}</button>
        {corr && corr.err && <p className="small" style={{ color: "var(--amber)", marginTop: 8 }}>⚠️ {corr.err}</p>}
        {corr && !corr.err && (
          <div style={{ marginTop: 12 }}>
            {corr.avgR != null && <p className="small" style={{ marginBottom: 8 }}>متوسط الارتباط بين الأزواج: <b style={{ color: corr.avgR < 0.3 ? "var(--green)" : corr.avgR < 0.5 ? "var(--amber)" : "var(--red)" }}>{corr.avgR.toFixed(2)}</b></p>}
            <div dangerouslySetInnerHTML={{ __html: corr.svg }} />
            <p className="muted small" style={{ marginTop: 6 }}>🟢 ارتباط منخفض = تنويع حقيقي · 🟠 متوسط · 🔴 مرتفع</p>
            {corr.grade && <p className="small" style={{ marginTop: 8 }}>تركيز المحفظة (HHI): <b>{NF(corr.hhi)}</b> · درجة التنويع: <b>{corr.grade}</b></p>}
            {corr.cands.length > 0 && (
              <p className="small" style={{ marginTop: 8, lineHeight: 2 }}>💡 <b>أسهم شريعة تقلل المخاطر</b> (أقل ارتباط بما تملك): {corr.cands.map((x: any) => (NAMES[x.s] || x.s) + " · " + x.avg.toFixed(2)).join(" · ")}</p>
            )}
            <p className="small" style={{ color: "var(--amber)", marginTop: 8 }}>⚠️ الارتباط تاريخي وبيتغير مع الوقت — راجعه دوريًا.</p>
          </div>
        )}
      </div>

      <div className="card">
        <h3>🎲 محاكاة مونت كارلو — 2000 سيناريو</h3>
        <p className="small muted" style={{ lineHeight: 1.8, margin: "6px 0 10px" }}>
          بنولّد 2000 مسار عشوائي خلال 60 جلسة جاية بسحب عوائد حقيقية من تاريخ المحفظة نفسها (Bootstrap) — نطاقات احتمالية بدل رقم واحد يتوهم.
        </p>
        <button className="btn primary mini" onClick={runMc}>{busy === "mc" ? "⏳…" : "🎲 شغّل المحاكاة"}</button>
        {mc && mc.err && <p className="small" style={{ color: "var(--amber)", marginTop: 8 }}>⚠️ {mc.err}</p>}
        {mc && !mc.err && (
          <div style={{ marginTop: 12 }}>
            <p className="small muted">{mc.label}</p>
            <div className="row" style={{ gap: 18, fontSize: 13.5, flexWrap: "wrap", margin: "8px 0" }}>
              <span style={{ color: mc.medPct >= 0 ? "var(--green)" : "var(--red)" }}>الوسيط بعد 60 جلسة: <b>{mc.medPct >= 0 ? "+" : ""}{mc.medPct.toFixed(1)}%</b></span>
              <span style={{ color: "var(--red)" }}>أسوأ 5%: <b>{mc.p5Pct.toFixed(1)}%</b></span>
              <span style={{ color: "var(--green)" }}>أفضل 5%: <b>{mc.p95Pct.toFixed(1)}%</b></span>
              <span style={{ color: mc.pLoss < 35 ? "var(--green)" : mc.pLoss < 55 ? "var(--amber)" : "var(--red)" }}>احتمالية الخسارة: <b>{mc.pLoss.toFixed(0)}%</b></span>
            </div>
            <div dangerouslySetInnerHTML={{ __html: mc.svg }} />
            <p className="small" style={{ color: "var(--amber)", marginTop: 6 }}>⚠️ المحاكاة بتفترض إن توزيع العوائد هيتكرر — أداة لفهم المخاطر مش كرة بلورية.</p>
          </div>
        )}
      </div>

      <div className="card">
        <h3>🎯 محسّن ماركوفيتز — الأوزان المثلى</h3>
        <p className="small muted" style={{ lineHeight: 1.8, margin: "6px 0 10px" }}>
          4000 توزيعة أوزان على أساس العائد والمخاطرة التاريخية — محفظة أعلى نسبة شارب ومحفظة أقل مخاطرة، قارنها بأوزانك الحالية.
        </p>
        <button className="btn primary mini" onClick={runMk}>{busy === "mk" ? "⏳…" : "🎯 احسب الأوزان المثلى"}</button>
        {mk && mk.err && <p className="small" style={{ color: "var(--amber)", marginTop: 8 }}>⚠️ {mk.err}</p>}
        {mk && !mk.err && (
          <div style={{ marginTop: 12 }}>
            <div className="row" style={{ gap: 18, fontSize: 13.5, flexWrap: "wrap", margin: "8px 0" }}>
              <span style={{ color: "var(--green)" }}>عائد سنوي متوقع (أعلى شارب): <b>{mk.shp.rAnn.toFixed(1)}%</b></span>
              <span>مخاطرة سنوية (أعلى شارب): <b>{mk.shp.vAnn.toFixed(1)}%</b></span>
              <span>نسبة شارب: <b>{mk.shp.s.toFixed(2)}</b></span>
              <span>أقل مخاطرة سنوية: <b>{mk.mnv.vAnn.toFixed(1)}%</b></span>
            </div>
            <table>
              <thead><tr><th>السهم</th><th>وزن أعلى شارب</th><th>وزن أقل مخاطرة</th></tr></thead>
              <tbody>
                {mk.rows.map((x: any) => (
                  <tr key={x.s}>
                    <td><b>{NAMES[x.s] || x.s}</b> <span className="muted small">{x.s}</span></td>
                    <td className="num">{(x.a * 100).toFixed(0)}%</td>
                    <td className="num">{(x.b * 100).toFixed(0)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="small" style={{ color: "var(--amber)", marginTop: 8 }}>⚠️ ماركوفيتز بيفترض إن العوائد التاريخية هتتكرر تقريبًا — أداة ترشيد للأوزان مش وعد بأرباح.</p>
          </div>
        )}
      </div>
    </>
  );
}
