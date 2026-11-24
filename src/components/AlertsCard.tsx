"use client";

/* 🚨 تنبيهات سعرية — إشعارات متصفح فقط، من غير تليجرام بخرفش
   نفس مفتاح egx_pricealerts، الفحص كل دقيقة من الريليه (live.json + hist.json) */

import { useEffect, useState } from "react";
import { NAMES } from "@/lib/names";
import { RAW, BRANCHES } from "@/lib/repo";
import { fetchJSON } from "@/lib/fetchJSON";

type Alert = { t: number; sym: string; dir: string; price: number; hit?: number; hitAt?: number; hitPrice?: number };
type Candle = { d?: string; c: number };
type Hist = { stocks?: Record<string, Candle[]> };
type Live = { quotes: { ticker: string; price?: number }[] };

const NF = (v: number | null | undefined) => v == null ? "—" : new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(v);
const alGet = (): Alert[] => { try { return JSON.parse(localStorage.getItem("egx_pricealerts") || "[]") } catch { return [] } };
const alSet = (a: Alert[]) => { try { localStorage.setItem("egx_pricealerts", JSON.stringify(a)) } catch {} };

export default function AlertsCard() {
  const [list, setList] = useState<Alert[]>([]);
  const [sym, setSym] = useState("COMI");
  const [dir, setDir] = useState("above");
  const [price, setPrice] = useState("");
  const [state, setState] = useState("");
  const [hasPermission, setHasPermission] = useState(true);

  useEffect(() => { setList(alGet()); setState(typeof Notification !== "undefined" ? Notification.permission : "unavailable"); }, []);

  const add = () => {
    const p = +price;
    if (!sym || !p || p <= 0) return;
    const a = alGet();
    if (a.some(r => r.sym === sym && r.dir === dir && Math.abs(r.price - p) < 0.001 && !r.hit)) return;
    a.push({ t: Date.now(), sym, dir, price: p, hit: 0 });
    alSet(a); setList(a); setPrice("");
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      Notification.requestPermission().then(() => setState(Notification.permission)).catch(() => {});
    }
  };
  const del = (t: number) => { const a = alGet().filter(x => x.t !== t); alSet(a); setList(a) };

  /* فحص التنبيهات كل 60 ثانية — إشعار متصفح + تحديث الحالة (بدون تليجرام) */
  useEffect(() => {
    const tick = async () => {
      const a = alGet().filter(x => x.hit !== 1);
      if (!a.length) return;
      const [hist, live] = await Promise.all([
        fetchJSON<Hist>(RAW(BRANCHES.hist, "hist.json"), 30000),
        fetchJSON<Live>(RAW(BRANCHES.live, "live.json"), 10000),
      ]);
      const P: Record<string, number> = {};
      ((live && live.quotes) || []).forEach(q => { if (q.ticker && q.price) P[q.ticker] = q.price });
      const stocks = (hist && hist.stocks) || {};
      a.forEach(r => { if (P[r.sym] != null) return; const s = (stocks[r.sym] || []); if (s.length) P[r.sym] = s[s.length - 1].c; });
      let changed = false;
      a.forEach(r => {
        if (r.hit) return;
        const cur = P[r.sym]; if (cur == null) return;
        const met = r.dir === "above" ? cur >= r.price : cur <= r.price;
        if (met) {
          r.hit = 1; r.hitAt = Date.now(); r.hitPrice = cur; changed = true;
          const msg = (NAMES[r.sym] || r.sym) + " بقى " + NF(cur) + " ج.م " + (r.dir === "above" ? "وصل أو علا عن" : "نزل عن") + " " + NF(r.price);
          if (typeof Notification !== "undefined" && Notification.permission === "granted") {
            try { new Notification("🚨 mistral-Mi — تنبيه سعري", { body: msg, tag: "egx-alert-" + r.sym }) } catch {}
          }
        }
      });
      if (changed) { alSet([...alGet().filter(x => x.hit === 1), ...a]); setList([...alGet()]) }
    };
    tick();
    const id = setInterval(tick, 60000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="card">
      <div className="row-between">
        <h3>🚨 تنبيهات سعرية — إشعارات متصفح</h3>
        <span className="muted small">{list.length ? "نشط: " + list.filter(r => !r.hit).length + " من " + list.length : ""}</span>
      </div>
      <p className="small muted" style={{ lineHeight: 1.8, margin: "6px 0 10px" }}>
        حدد سعر هدف لأي سهم — أول ما السعر يوصل توصلك إشعار متصفح فورًا. الفحص كل دقيقة طول ما الصفحة مفتوحة.
        {state !== "granted" && <b style={{ color: "var(--amber)" }}> اسمح بالإشعارات من أول تنبيه تضيفه.</b>}
      </p>
      <div className="row" style={{ margin: "10px 0" }}>
        <input placeholder="الرمز مثال COMI" value={sym} onChange={e => setSym(e.target.value.toUpperCase())} style={{ width: 120 }} />
        <select value={dir} onChange={e => setDir(e.target.value)}>
          <option value="above">⬆️ يوصل أو يعلى عن</option>
          <option value="below">⬇️ ينزل أو يقل عن</option>
        </select>
        <input placeholder="السعر (ج.م)" type="number" step="0.01" value={price} onChange={e => setPrice(e.target.value)} style={{ width: 130 }} />
        <button className="btn primary mini" onClick={add}>🚨 فعّل التنبيه</button>
      </div>
      {list.length === 0 ? (
        <p className="muted small">مفيش تنبيهات — حدد سهم وسعر فوق وهناديلك أول ما يوصل.</p>
      ) : (
        <table>
          <thead><tr><th>السهم</th><th>الشرط</th><th>السعر</th><th>الحالة</th><th></th></tr></thead>
          <tbody>
            {list.map(r => (
              <tr key={r.t}>
                <td><b>{NAMES[r.sym] || r.sym}</b> <span className="muted small">{r.sym}</span></td>
                <td className="small">{r.dir === "above" ? "⬆️ يعلى عن" : "⬇️ ينزل عن"}</td>
                <td className="num">{NF(r.price)}</td>
                <td>{r.hit ? <span className="badge" style={{ color: "var(--green)" }}>تم التنبيه ✅</span> : <span className="badge">برصد 🔔</span>}</td>
                <td><button className="btn mini danger" onClick={() => del(r.t)}>🗑️</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
