"use client";

/* 🏛️ شهادة المحرك — التطبيق بيحاكم نفسه على سنة تاريخية */

import { useEffect, useState } from "react";
import { engineCert } from "@/lib/quant";
import { analyze, SHARIA } from "@/lib/engine";
import { NAMES } from "@/lib/names";
import { RAW, BRANCHES } from "@/lib/repo";
import { fetchJSON } from "@/lib/fetchJSON";

type Candle = { d?: string; o?: number; h?: number; l?: number; c: number; v?: number };
type Hist = { stocks?: Record<string, Candle[]> };

const sign = (x: number | null) => x == null ? "—" : (x >= 0 ? "+" : "") + x.toFixed(1) + "%";

export default function EngineCertCard() {
  const [res, setRes] = useState<any>(null);
  const [state, setState] = useState("");

  const run = async () => {
    setState("جارٍ محاكمة المحرك على السنة كاملة… (ثواني)");
    const h = await fetchJSON<Hist>(RAW(BRANCHES.hist, "hist.json"), 30000);
    const C: Record<string, number[]> = {};
    Object.keys((h && h.stocks) || {}).forEach(s => { if (!SHARIA.includes(s)) return; const c = ((h as any).stocks[s] || []).filter((x: Candle) => x && x.c > 0).map((x: Candle) => x.c); if (c.length >= 96) C[s] = c });
    setTimeout(() => { setRes(engineCert(C, analyze)); setState("") }, 50);
  };
  useEffect(() => { run(); }, []);

  return (
    <div className="card">
      <div className="row-between">
        <h3>🏛️ شهادة المحرك — توصياته متجربة على سنة تاريخية</h3>
        <button className="btn mini" onClick={run}>🔄 إعادة الحساب</button>
      </div>
      {state && <p className="small muted" style={{ marginTop: 6 }}>{state}</p>}
      {res && res.err && <p className="small" style={{ color: "var(--amber)", marginTop: 8 }}>⚠️ {res.err}</p>}
      {res && !res.err && res.n < 10 && <p className="small" style={{ color: "var(--amber)", marginTop: 8 }}>⚠️ عدد التوصيات المحاكمة قليل ({res.n}) — الأرقام لسه مبكرة على الاستخلاص.</p>}
      {res && !res.err && res.n >= 10 && (
        <div style={{ marginTop: 10 }}>
          <div className="row" style={{ gap: 18, fontSize: 13.5, flexWrap: "wrap" }}>
            <span>توصيات محاكمة: <b>{res.n}</b></span>
            <span style={{ color: "var(--green)" }}>وصلت الهدف: <b>{res.wins}</b> ({res.winPct.toFixed(0)}%)</span>
            <span style={{ color: "var(--red)" }}>ضربت الوقف: <b>{res.losses}</b> ({res.lossPct.toFixed(0)}%)</span>
            <span>انتهت بالمهلة: <b>{res.timeouts}</b></span>
            <span style={{ color: (res.avgRel || 0) >= 0 ? "var(--green)" : "var(--red)" }}>التفوق على وسيط السوق: <b>{sign(res.avgRel)}</b></span>
            <span>ضربت وسيط السوق: <b>{res.beatPct != null ? res.beatPct.toFixed(0) + "%" : "—"}</b></span>
            <span>عناصر السهم العادي: <b>{sign(res.avgFwd)}</b></span>
          </div>
          <p className="small muted" style={{ marginTop: 10, lineHeight: 1.8 }}>
            محاكاة صادقة: نفس محرك التوصيات اتشغل على إغلاقات آخر سنة لأسهم الشريعة، نقطة تقييم كل أسبوع، أفق 15 جلسة،
            بوقف 2×ATR وهدف 3×ATR — والمقارنة نسبية ضد وسيط كل السوق (يعني الصعود العام مبيحسبش للمحرك).
          </p>
        </div>
      )}
      {res && !res.err && <p className="small" style={{ color: "var(--amber)", marginTop: 8 }}>⚠️ محاكاة على بيانات تاريخية — الأداء السابق لا يضمن المستقبل.</p>}
    </div>
  );
}
