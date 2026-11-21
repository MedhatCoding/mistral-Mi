"use client";

/* ⚡ كارت مضاربة الجلسة — نفس بيانات فرع picks، مع fallback المحلي */
import { useEffect, useState } from "react";
import { fetchJSON, cachedJSON, timeAgoAr } from "@/lib/fetchJSON";
import { RAW, BRANCHES } from "@/lib/repo";

type Pick = {
  s: string; n: string; mk?: boolean; p: number; mom: number; vmul: number;
  stop: number; target: number; gap: number; d?: string; sc?: number;
};
type Intraday = { t: number; src?: string; list: Pick[] };

const URL = RAW(BRANCHES.picks, "intraday.json");

export default function IntradayCard() {
  const [data, setData] = useState<Intraday | null>(null);
  const [stale, setStale] = useState(false);
  const [state, setState] = useState<"loading" | "ok" | "empty" | "fail">("loading");

  useEffect(() => {
    let alive = true;
    const load = async () => {
      const j = await fetchJSON<Intraday>(URL);
      if (!alive) return;
      if (j && j.t) {
        setData(j); setStale(false); setState(j.list && j.list.length ? "ok" : "empty");
      } else {
        const c = cachedJSON<Intraday>(URL);
        if (c) { setData(c.j); setStale(true); setState(c.j.list?.length ? "ok" : "empty"); }
        else setState("fail");
      }
    };
    load();
    const id = setInterval(load, 5 * 60 * 1000);
    return () => { alive = false; clearInterval(id); };
  }, []);

  return (
    <div className="card" style={{ borderColor: "rgba(255,180,84,.4)" }}>
      <h3>⚡ مضاربة الجلسة — دخول وخروج نفس اليوم</h3>
      {state === "loading" && <p className="muted">⏳ جارٍ جلب مرشحي المضاربة من السيرفر…</p>}
      {state === "fail" && (
        <p className="muted">⚠️ تعذر جلب مرشحي المضاربة — هنحاول تاني تلقائيًا. لو الجلسة مقفولة (جمعة/سبت) ده طبيعي.</p>
      )}
      {state === "empty" && <p className="muted">مفيش مرشح مضاربة قوي دلوقتي — الانتظار أحسن من الدخول القسري.</p>}
      {state === "ok" && data && (
        <>
          <div className="row-between">
            <span />
            <span className="muted small" title={stale ? "نسخة محفوظة — السيرفر مش رد" : "حي من السيرفر"}>
              {stale ? "💾 " : "🛰️ "}{timeAgoAr(data.t)}
            </span>
          </div>
          {stale && <p className="muted small">⚠️ تعذر الاتصال بالسيرفر — دي آخر نسخة محفوظة ({timeAgoAr(data.t)})</p>}
          <div className="grid3">
            {data.list.map((x) => {
              const rr = ((x.target - x.p) / Math.max(x.p - x.stop, 0.001)).toFixed(1);
              return (
                <div key={x.s} className="card" style={{ margin: 0, background: "var(--card2)" }}>
                  <b>{x.s}</b> · {x.n}{x.mk ? " ⚖️ مختلف فيه" : ""}
                  <div className="metrics">
                    <div>آخر سعر: <b className="num">{x.p}</b></div>
                    <div style={{ color: "var(--green)" }}>زخم الجلسة: +{x.mom}%</div>
                    <div>الحجم/المتوسط: ×{x.vmul}</div>
                    <div>🎯 هدف: {x.target}</div>
                    <div style={{ color: "var(--red)" }}>🛑 وقف: {x.stop}</div>
                  </div>
                  <span className="muted small">عائد/مخاطرة 1:{rr} · فجوة {(x.gap > 0 ? "+" : "") + x.gap}% · جلسة {x.d || "—"}</span>
                </div>
              );
            })}
          </div>
        </>
      )}
      <p className="muted small" style={{ marginTop: 10 }}>
        ⚠️ عالية المخاطرة — قرار الدخول والخروج مسؤوليتك.
      </p>
    </div>
  );
}