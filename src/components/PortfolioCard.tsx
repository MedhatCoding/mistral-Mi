"use client";

/* 💼 كارت محفظتي التفاعلي — نفس مفتاح egx_holdings بتاع التطبيق القديم
   الصيغة: [{ t: رمز السهم, qty: الكمية, avg: متوسط الشراء }]
   الأسعار من live.json + صناديق الاستثمار من egx_funds (بآخر NAV محفوظ) */

import { useEffect, useMemo, useState } from "react";
import { fetchJSON } from "@/lib/fetchJSON";
import { RAW, BRANCHES } from "@/lib/repo";

type Holding = { t: string; qty: number; avg: number };
type Fund = { name: string; units: number; avg: number; nav?: number };
type Quote = { ticker: string; price?: number; change_percent?: number | null };
type Live = { t: number; quotes: Quote[] };

const LIVE_URL = RAW(BRANCHES.live, "live.json");

const loadLS = (k: string) => {
  try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : []; } catch { return []; }
};
const saveLS = (k: string, v: unknown) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

export default function PortfolioCard() {
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [funds, setFunds] = useState<Fund[]>([]);
  const [prices, setPrices] = useState<Record<string, Quote>>({});
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ t: "", qty: "", avg: "" });

  const refresh = () => {
    setHoldings(loadLS("egx_holdings") as Holding[]);
    setFunds(loadLS("egx_funds") as Fund[]);
  };

  useEffect(() => {
    refresh();
    let alive = true;
    const loadPrices = async () => {
      const j = await fetchJSON<Live>(LIVE_URL, 10000);
      if (!alive) return;
      const q: Record<string, Quote> = {};
      (j?.quotes || []).forEach((x) => { if (x.ticker) q[x.ticker] = x; });
      setPrices(q);
      setLoading(false);
    };
    loadPrices();
    const id = setInterval(loadPrices, 3 * 60 * 1000);
    const onStorage = () => refresh();
    window.addEventListener("storage", onStorage);
    return () => { alive = false; clearInterval(id); window.removeEventListener("storage", onStorage); };
  }, []);

  const add = () => {
    const t = form.t.trim().toUpperCase();
    const qty = parseFloat(form.qty), avg = parseFloat(form.avg);
    if (!t || !(qty > 0) || !(avg > 0)) return;
    setHoldings((h) => {
      const next = h.filter((x) => x.t !== t).concat([{ t, qty, avg }]);
      saveLS("egx_holdings", next);
      return next;
    });
    setForm({ t: "", qty: "", avg: "" });
  };

  const remove = (t: string) => {
    setHoldings((h) => {
      const next = h.filter((x) => x.t !== t);
      saveLS("egx_holdings", next);
      return next;
    });
  };

  const rows = useMemo(() => holdings.map((h) => {
    const p = prices[h.t]?.price;
    return {
      ...h, price: p, chg: prices[h.t]?.change_percent ?? null,
      cost: h.qty * h.avg, value: p != null ? h.qty * p : null,
      pl: p != null ? h.qty * (p - h.avg) : null,
    };
  }), [holdings, prices]);

  const totCost = rows.reduce((a, r) => a + r.cost, 0);
  const totVal = rows.reduce((a, r) => a + (r.value || 0), 0);
  const totPl = rows.reduce((a, r) => a + (r.pl || 0), 0);
  const fundsVal = funds.reduce((a, f) => a + f.units * (f.nav || f.avg), 0);

  const NF = (n: number) => n.toLocaleString("ar-EG", { maximumFractionDigits: 0 });

  return (
    <div className="card">
      <h3>💼 محفظتي</h3>
      {loading && <p className="muted small">⏳ جارٍ جلب أسعار محفظتك…</p>}

      {rows.length > 0 && (
        <table>
          <thead><tr><th>السهم</th><th>الكمية</th><th>المتوسط</th><th>السعر</th><th>القيمة</th><th>ربح/خسارة</th><th></th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.t}>
                <td><b>{r.t}</b></td>
                <td className="num">{r.qty}</td>
                <td className="num">{r.avg}</td>
                <td className="num">{r.price ?? "\u2014"}{r.chg != null ? <span style={{ color: r.chg >= 0 ? "var(--green)" : "var(--red)" }}> ({r.chg >= 0 ? "+" : ""}{r.chg.toFixed(2)}%)</span> : null}</td>
                <td className="num">{r.value != null ? NF(r.value) : "\u2014"}</td>
                <td className="num" style={{ color: r.pl == null ? "var(--muted)" : r.pl >= 0 ? "var(--green)" : "var(--red)" }}>
                  {r.pl == null ? "\u2014" : (r.pl >= 0 ? "+" : "") + NF(r.pl)}
                </td>
                <td><button className="btn mini danger" onClick={() => remove(r.t)}>حذف</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {rows.length === 0 && !loading && <p className="muted small">مفيش أسهم محفوظة — أضف أول سهم من تحت 👇</p>}

      {totCost > 0 && (
        <div className="metrics" style={{ marginTop: 10 }}>
          <div>إجمالي التكلفة: <b className="num">{NF(totCost)}</b> ج.م</div>
          <div>إجمالي القيمة الحالية: <b className="num">{NF(totVal + fundsVal)}</b> ج.م{fundsVal > 0 ? <span className="muted small"> (فيهم {NF(fundsVal)} صناديق بآخر NAV)</span> : null}</div>
          <div style={{ color: totPl >= 0 ? "var(--green)" : "var(--red)", fontWeight: 600 }}>
            ربح/خسارة الأسهم: {totPl >= 0 ? "+" : ""}{NF(totPl)} ج.م ({totCost ? ((totPl / totCost) * 100).toFixed(1) : "0"}%)
          </div>
        </div>
      )}

      <div className="row" style={{ marginTop: 12 }}>
        <input placeholder="رمز السهم (مثال ORHD)" value={form.t} onChange={(e) => setForm({ ...form, t: e.target.value })} style={{ width: 150, textTransform: "uppercase" }} />
        <input placeholder="الكمية" value={form.qty} onChange={(e) => setForm({ ...form, qty: e.target.value })} style={{ width: 110 }} inputMode="decimal" />
        <input placeholder="متوسط الشراء" value={form.avg} onChange={(e) => setForm({ ...form, avg: e.target.value })} style={{ width: 130 }} inputMode="decimal" />
        <button className="btn primary" onClick={add}>➕ إضافة</button>
      </div>
      <p className="muted small" style={{ marginTop: 8 }}>
        محفوظة محليًا على جهازك — بتتشارك والتطبيق الكامل نفس البيانات، وبتنقل مع النسخة الاحتياطية.
      </p>
    </div>
  );
}