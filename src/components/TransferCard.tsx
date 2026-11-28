"use client";

/* 📦 نقل البيانات من النسخة القديمة (Streamlit) — استيراد ملف النسخة الاحتياطية أو لصقها
   يقبل: ملف aqqar-backup كامل (aqqar-egx) · أو مصفوفة egx_holdings مجردة [{t,qty,avg}] */

import { useRef, useState } from "react";

type Holding = { t: string; qty: number; avg: number };

const readHoldings = (): Holding[] => { try { return JSON.parse(localStorage.getItem("egx_holdings") || "[]") } catch { return [] } };

export default function TransferCard() {
  const [state, setState] = useState("");
  const [paste, setPaste] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const normalize = (obj: any): Holding[] => {
    let raw: any = null;
    if (Array.isArray(obj)) raw = obj;
    else if (obj && typeof obj === "object") {
      if (obj.egx_holdings) raw = obj.egx_holdings;
      else if (obj.holdings) raw = obj.holdings;
    }
    if (!Array.isArray(raw)) return [];
    return raw.map((h: any) => ({
      t: String(h.t || h.sym || h.s || "").trim().toUpperCase(),
      qty: +h.qty,
      avg: +h.avg,
    })).filter((h: Holding) => h.t && h.qty > 0 && h.avg > 0);
  };

  const applyHoldings = (list: Holding[], alsoFunds: any[] | null) => {
    if (!list.length) { setState("⚠️ مفيش أسهم صالحة في اللي لزيزته — راجع الصيغة."); return }
    const cur = readHoldings();
    const merged = [...cur];
    list.forEach(h => {
      const i = merged.findIndex(x => x.t === h.t);
      if (i > -1) merged[i] = h; else merged.push(h);
    });
    try {
      localStorage.setItem("egx_holdings", JSON.stringify(merged));
      if (alsoFunds && alsoFunds.length) localStorage.setItem("egx_funds", JSON.stringify(alsoFunds));
    } catch {}
    setState("✅ اتنقلت " + list.length + " سهم" + (alsoFunds && alsoFunds.length ? " و" + alsoFunds.length + " صندوق" : "") + " — المحفظة بتظهر فوق بعد تحديث الصفحة.");
  };

  const handleFile = (f: File | null) => {
    if (!f) return;
    const rd = new FileReader();
    rd.onload = () => {
      try {
        const obj = JSON.parse(String(rd.result));
        applyHoldings(normalize(obj), Array.isArray(obj && obj.egx_funds) ? obj.egx_funds : null);
      } catch { setState("⚠️ الملف مش JSON صالح — نزّله تاني من النسخة القديمة."); }
    };
    rd.readAsText(f);
  };

  const handlePaste = () => {
    try {
      const obj = JSON.parse(paste.trim());
      applyHoldings(normalize(obj), Array.isArray(obj && obj.egx_funds) ? obj.egx_funds : null);
    } catch { setState("⚠️ اللي لزيزته مش JSON صالح — انسخه تاني كامل."); }
  };

  return (
    <div className="card">
      <h3>📦 نقل بيانات النسخة القديمة (Streamlit)</h3>
      <p className="small muted" style={{ lineHeight: 1.8, margin: "6px 0 10px" }}>
        من التطبيق القديم: افتح <b>الإعدادات → النسخة الاحتياطية</b> واضغط <b>«📋 نسخ للمشاركة»</b> (أو نزّل ملف aqqar-backup)،
        وبعدين لزق النص هنا أو اختار الملف. الملف فيه محفظتك وصناديقك وسجل قراراتك كامل — من غير أي تشفير.
      </p>
      <div className="row" style={{ margin: "10px 0" }}>
        <button className="btn primary mini" onClick={() => fileRef.current && fileRef.current.click()}>📁 اختار ملف النسخة الاحتياطية</button>
        <input ref={fileRef} type="file" accept=".json,application/json" style={{ display: "none" }} onChange={e => handleFile(e.target.files && e.target.files[0])} />
      </div>
      <textarea placeholder="أو الصق محتوى النسخة الاحتياطية هنا..." value={paste} onChange={e => setPaste(e.target.value)} style={{ width: "100%", height: 110, fontSize: 12, fontFamily: "monospace" }} />
      <div className="row" style={{ marginTop: 8 }}>
        <button className="btn mini" onClick={handlePaste} disabled={!paste.trim()}>📥 استيراد</button>
        {state && <span className="small">{state}</span>}
      </div>
      <p className="small muted" style={{ marginTop: 8 }}>
        الأسهم الموجودة عندك حاليًا: {readHoldings().length} — الاستيراد بيدمج (السهم المكرر بيتحدث بالقيمة الجديدة) وما بيمسحش أي حاجة.
        محفظتك بتفضل محفوظة على جهازك بس.
      </p>
    </div>
  );
}
