"use client";

/* 🤖 كارت المتداول الوهمي على السيرفر — من paper.json على فرع paper */
import { useEffect, useState } from "react";
import { fetchJSON, cachedJSON, timeAgoAr } from "@/lib/fetchJSON";
import { RAW, BRANCHES } from "@/lib/repo";

type Paper = {
  t?: number; cash?: number; val?: number; start?: number;
  pos?: { s?: string; q: number; b: number }[]; hist?: { ret: number; pl?: number; sp?: number; b?: number; q?: number }[];
};

const URL = RAW(BRANCHES.paper, "paper.json");

export default function PaperBotCard() {
  const [data, setData] = useState<Paper | null>(null);
  const [stale, setStale] = useState(false);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      const j = await fetchJSON<Paper>(URL);
      if (!alive) return;
      if (j && typeof j.cash === "number") { setData(j); setStale(false); }
      else {
        const c = cachedJSON<Paper>(URL);
        if (c) { setData(c.j); setStale(true); }
      }
    };
    load();
    const id = setInterval(load, 5 * 60 * 1000);
    return () => { alive = false; clearInterval(id); };
  }, []);

  if (!data) return <div className="card"><p className="muted small">⏳ جارٍ جلب حالة المتداول الوهمي…</p></div>;

  const NF = (n: number) => n.toLocaleString("ar-EG", { maximumFractionDigits: 0 });
  const st = data.start || 100000;
  const val = typeof data.val === "number"
    ? data.val
    : (data.cash || 0) + (data.pos || []).reduce((a, z) => a + z.q * z.b, 0);
  const pl = val - st, plp = (pl / st) * 100;
  const hist = data.hist || [];
  const wins = hist.filter((h) => h.ret > 0).length;
  const wr = hist.length ? Math.round((wins / hist.length) * 100) : null;
  const realized = hist.reduce((a, h) => a + (h.pl != null ? h.pl : (h.sp - h.b) * (h.q || 0)), 0);

  return (
    <div className="card">
      <div className="row-between">
        <h3>🤖 المتداول الوهمي على السيرفر</h3>
        {data.t && <span className="muted small">{stale ? "💾 " : "🛰️ "}{timeAgoAr(data.t)}</span>}
      </div>
      {stale && <p className="muted small">⚠️ السيرفر مش رد — أرقام آخر نسخة محفوظة</p>}
      <div className="metrics">
        <div>قيمة المحفظة: <b className="num">{NF(val)}</b> ج.م</div>
        <div style={{ color: pl >= 0 ? "var(--green)" : "var(--red)" }}>
          ربح/خسارة: {pl >= 0 ? "+" : ""}{NF(pl)} ({plp >= 0 ? "+" : ""}{plp.toFixed(1)}%)
        </div>
        <div>مراكز / صفقات: {(data.pos || []).length} / {hist.length}</div>
        <div>نسبة النجاح: {wr == null ? "—" : wr + "%"}</div>
        <div>الربح المحقق: <span style={{ color: realized >= 0 ? "var(--green)" : "var(--red)" }}>{realized >= 0 ? "+" : ""}{NF(realized)}</span></div>
      </div>
    </div>
  );
}