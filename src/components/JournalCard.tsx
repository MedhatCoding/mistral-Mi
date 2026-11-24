"use client";

/* 📓 سجل القرارات — ذاكرتك الاستثمارية (نفس مفتاح egx_journal للتوافق مع التطبيق الأصلي) */

import { useEffect, useState } from "react";
import { NAMES, SECTORS } from "@/lib/names";
import { SHARIA } from "@/lib/engine";

type Entry = { t: number; sym: string; act: string; why: string };

const jrGet = (): Entry[] => { try { return JSON.parse(localStorage.getItem("egx_journal") || "[]") } catch { return [] } };
const jrSet = (a: Entry[]) => { try { localStorage.setItem("egx_journal", JSON.stringify(a)) } catch {} };

export default function JournalCard() {
  const [list, setList] = useState<Entry[]>([]);
  const [sym, setSym] = useState("");
  const [act, setAct] = useState("شراء");
  const [why, setWhy] = useState("");

  useEffect(() => { setList(jrGet()); if (!sym) setSym(SHARIA[0] || ""); }, []);

  const add = () => {
    if (!why.trim()) return;
    const a = jrGet(); a.push({ t: Date.now(), sym, act, why: why.trim() }); jrSet(a);
    setList(a); setWhy("");
  };
  const del = (t: number) => { const a = jrGet().filter(e => e.t !== t); jrSet(a); setList(a) };

  const syms = [...new Set([...SHARIA, ...Object.keys(SECTORS)])].sort();

  return (
    <div className="card">
      <div className="row-between">
        <h3>📓 سجل القرارات — ذاكرتك الاستثمارية</h3>
        <span className="muted small">{list.length ? list.length + " قرار مسجّل" : ""}</span>
      </div>
      <div className="row" style={{ margin: "10px 0" }}>
        <select value={sym} onChange={e => setSym(e.target.value)}>
          {syms.map(s => <option key={s} value={s}>{s}{NAMES[s] ? " — " + NAMES[s] : ""}</option>)}
        </select>
        <select value={act} onChange={e => setAct(e.target.value)}>
          <option>شراء</option><option>بيع</option><option>احتفاظ</option><option>مراجعة</option>
        </select>
        <input placeholder="سبب القرار — لو كلمة واحدة مهمة" value={why} onChange={e => setWhy(e.target.value)} style={{ flex: 1, minWidth: 180 }} />
        <button className="btn primary mini" onClick={add}>➕ سجّل</button>
      </div>
      {list.length === 0 ? (
        <p className="muted small">لسه مفيش قرارات — أول قرار تكتبه هنا هيفيدك في مراجعة أدائك بعدين.</p>
      ) : (
        <table>
          <thead><tr><th>التاريخ</th><th>السهم</th><th>القرار</th><th>السبب</th><th></th></tr></thead>
          <tbody>
            {[...list].reverse().map(e => (
              <tr key={e.t}>
                <td className="num">{new Date(e.t).toLocaleDateString("ar-EG")}</td>
                <td><b>{NAMES[e.sym] || e.sym}</b> <span className="muted small">{e.sym}</span></td>
                <td>{e.act}</td>
                <td className="small" style={{ whiteSpace: "normal", minWidth: 160 }}>{e.why}</td>
                <td><button className="btn mini danger" onClick={() => del(e.t)}>🗑️</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
