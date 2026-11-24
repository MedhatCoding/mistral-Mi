"use client";

/* 🧠 محرك التعلم الآلي — انحدار لوجستي داخل المتصفح على تاريخ سنة كاملة */

import { useEffect, useState } from "react";
import { mlTrain, mlProb, trainedModel, ML_FEATS } from "@/lib/ml";
import { NAMES } from "@/lib/names";
import { analyze, SHARIA } from "@/lib/engine";
import { RAW, BRANCHES } from "@/lib/repo";
import { fetchJSON } from "@/lib/fetchJSON";

type Candle = { d?: string; o?: number; h?: number; l?: number; c: number; v?: number };
type Hist = { stocks?: Record<string, Candle[]> };

const NF = (v: number | null | undefined) => v == null ? "—" : new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(v);

type Model = { w: number[]; b: number; acc: number; base: number; n: number; nTest: number; at: number };

export default function MlCard() {
  const [hist, setHist] = useState<Hist | null>(null);
  const [model, setModel] = useState<Model | null>(null);
  const [state, setState] = useState<string>("");

  useEffect(() => {
    setModel((trainedModel() as Model) || null);
    fetchJSON<Hist>(RAW(BRANCHES.hist, "hist.json"), 30000).then(h => setHist(h));
  }, []);

  const train = () => {
    if (!hist || !hist.stocks) { setState("مفيش تاريخ — استنى تحميل hist.json أو حدّث الصفحة"); return }
    setState("جارٍ تدريب النموذج على السنة كاملة…");
    setTimeout(() => {
      const r = mlTrain(hist.stocks as Record<string, Candle[]>);
      if (r.err) { setState("⚠️ " + r.err); return }
      setModel(r.model as Model); setState("");
    }, 50);
  };

  const preds = model ? SHARIA.map(s => ({ s, p: mlProb(s, (hist?.stocks || {})[s] || []) })).filter(x => x.p != null).sort((a, b) => (b.p as number) - (a.p as number)).slice(0, 10) : [];
  const fi = model ? model.w.map((v, i) => ({ v, i })).sort((a, b) => Math.abs(b.v) - Math.abs(a.v)).slice(0, 4) : [];

  return (
    <div className="card">
      <div className="row-between">
        <h3>🧠 محرك التعلم الآلي — توقعات العشرين جلسة القادمة</h3>
      </div>
      <p className="small muted" style={{ lineHeight: 1.8, margin: "6px 0 10px" }}>
        نموذج <b>انحدار لوجستي</b> بيتدرّب جوّه المتصفح من غير أي خدمة خارجية: بيتعلم من 16 سمة فنية
        (زخم العوائد · المتوسطات · RSI · الموقع من المدى · التقلب · السيولة · MACD · بولنجر) على تاريخ سنة كاملة
        لأسهم الشريعة، ويقدّر احتمالية صعود كل سهم خلال 20 جلسة قادمة. النموذج والنتائج مكانهم محفوظان محليًا على جهازك.
      </p>
      <div className="row">
        <button className="btn primary mini" onClick={train}>🎓 درّب النموذج الآن</button>
        {state && <span className="small muted">{state}</span>}
      </div>
      {model && (
        <>
          <div className="row" style={{ gap: 18, margin: "12px 0", fontSize: 13.5 }}>
            <span>عينات التدريب: <b>{model.n.toLocaleString("en-US")}</b></span>
            <span style={{ color: model.acc >= model.base ? "var(--green)" : "var(--amber)" }}>دقة عينة الاختبار: <b>{model.acc.toFixed(1)}%</b></span>
            <span>حد التخمين الساذج: <b>{model.base.toFixed(1)}%</b></span>
            <span className="muted small">تاريخ التدريب: {new Date(model.at).toLocaleDateString("ar-EG")}</span>
          </div>
          {model.acc < model.base && <p className="small" style={{ color: "var(--amber)" }}>⚠️ النموذج لسه مش أقوى من التخمين البسيط — طبيعي مع بداية البيانات، كل إعادة تدريب بتتحسن.</p>}
          {preds.length > 0 && (
            <table style={{ marginTop: 8 }}>
              <thead><tr><th>السهم</th><th>احتمالية الصعود (20 جلسة)</th><th>السعر</th></tr></thead>
              <tbody>
                {preds.map(x => {
                  const arr = (hist?.stocks || {})[x.s] || [];
                  const last = arr.length ? arr[arr.length - 1] : null;
                  return (
                    <tr key={x.s}>
                      <td><b>{NAMES[x.s] || x.s}</b> <span className="muted small">{x.s}</span></td>
                      <td className="num" style={{ color: (x.p as number) >= 0.6 ? "var(--green)" : "var(--muted)" }}>{((x.p as number) * 100).toFixed(0)}%</td>
                      <td className="num">{last ? NF(last.c) : "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
          <p className="small muted" style={{ marginTop: 8 }}>🔑 أقوى السمات: {fi.map(x => ML_FEATS[x.i] + " (" + (x.v > 0 ? "+" : "") + x.v.toFixed(2) + ")").join(" · ")}</p>
        </>
      )}
      {!model && !state && <p className="muted small">اضغط «🎓 درّب النموذج الآن» — أول تدريب بياخد ثواني معدودة.</p>}
      <p className="small" style={{ color: "var(--amber)", marginTop: 8 }}>⚠️ التوقعات احتمالية إحصائية مبنية على أداء تاريخي — ليست نصيحة شراء مضمونة.</p>
    </div>
  );
}
