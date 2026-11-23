"use client";

/* 🛰️ كارت توصيات السيرفر — من picks.json على فرع picks */
import { useEffect, useState } from "react";
import { fetchJSON, cachedJSON, timeAgoAr } from "@/lib/fetchJSON";
import { RAW, BRANCHES } from "@/lib/repo";

export type SPick = {
  s: string; n: string; p: number; chg?: number; pr?: string;
  cls?: string; em?: string; st?: number; conf?: number; sc?: number;
  stop?: number; t1?: number; sup?: number | null; res?: number | null;
  risk?: string; mk?: boolean; bt?: { d: string; sc: number } | null;
};
export type Picks = { t: number; src?: string; buys: SPick[]; sells: SPick[] };

const URL = RAW(BRANCHES.picks, "picks.json");

const rec = (x: SPick) => {
  const c = x.cls || (x.pr && x.pr.indexOf("قوي") > -1 ? "rec-strongbuy" : "rec-buy");
  const color = c.indexOf("sell") > -1 ? "var(--red)" : c.indexOf("hold") > -1 ? "var(--amber)" : "var(--green)";
  return { c, color };
};

export function PickCard({ x }: { x: SPick }) {
  const { color } = rec(x);
  const d = (x.t1 ?? 0) - x.p, dd = x.p - (x.stop ?? 0);
  const rr = dd > 0 ? (d / dd).toFixed(1) : "—";
  return (
    <div className="card" style={{ margin: 0, background: "var(--card2)" }}>
      <b>{x.s}</b> · {x.n}
      {x.mk ? <span className="badge">⚖️ مختلف فيه</span> : null}
      <div className="metrics">
        <div>آخر سعر: <b className="num">{x.p}</b>{x.chg != null ? <span style={{ color: x.chg >= 0 ? "var(--green)" : "var(--red)" }}> ({x.chg >= 0 ? "+" : ""}{x.chg.toFixed(2)}%)</span> : null}</div>
        <div style={{ color }}>{x.pr || "مرشح"}</div>
        <div>🎯 هدف: <span className="num">{x.t1 ?? "—"}</span></div>
        <div>🛑 وقف: <span className="num" style={{ color: "var(--red)" }}>{x.stop ?? "—"}</span></div>
        <div>عائد/مخاطرة: 1:{rr}{x.sup != null ? " · دعم " + x.sup : ""}{x.res != null ? " · مقاومة " + x.res : ""}</div>
      </div>
    </div>
  );
}

export default function ServerPicksCard() {
  const [data, setData] = useState<Picks | null>(null);
  const [stale, setStale] = useState(false);
  const [state, setState] = useState<"loading" | "ok" | "fail">("loading");

  useEffect(() => {
    let alive = true;
    const load = async () => {
      const j = await fetchJSON<Picks>(URL, 15000);
      if (!alive) return;
      if (j && j.t) { setData(j); setStale(false); setState("ok"); }
      else {
        const c = cachedJSON<Picks>(URL);
        if (c) { setData(c.j); setStale(true); setState("ok"); }
        else setState("fail");
      }
    };
    load();
    const id = setInterval(load, 10 * 60 * 1000);
    return () => { alive = false; clearInterval(id); };
  }, []);

  return (
    <div className="card">
      <div className="row-between">
        <h3>🛰️ توصيات السيرفر</h3>
        {data && <span className="muted small">{stale ? "💾 " : "🛰️ "}{timeAgoAr(data.t)}</span>}
      </div>
      {state === "loading" && <p className="muted small">⏳ جارٍ جلب توصيات السيرفر…</p>}
      {state === "fail" && (
        <p className="muted small">⚠️ مفيش بيانات من السيرفر ولا نسخة محفوظة — لو الجلسة لسه ما فتحتش، هتظهر أول ما الريليه ينشر.</p>
      )}
      {state === "ok" && data && (
        <>
          {stale && <p className="muted small">⚠️ السيرفر مش رد — دي آخر نسخة محفوظة ({timeAgoAr(data.t)})</p>}
          <h4 style={{ color: "var(--green)", margin: "8px 0" }}>🟢 فرص الشراء ({data.buys?.length || 0})</h4>
          <div className="grid3">
            {(data.buys || []).map((x) => <PickCard key={x.s} x={x} />)}
            {!data.buys?.length && <p className="muted small">مفيش فرص شراء قوية دلوقتي.</p>}
          </div>
          {(data.sells || []).length > 0 && (
            <>
              <h4 style={{ color: "var(--red)", margin: "12px 0 8px" }}>🔴 تحذيرات البيع ({data.sells.length})</h4>
              <div className="grid3">{data.sells.map((x) => <PickCard key={x.s} x={x} />)}</div>
            </>
          )}
        </>
      )}
    </div>
  );
}