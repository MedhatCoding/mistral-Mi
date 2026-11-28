"use client";

/* 📦 نقل البيانات من النسخة القديمة (Streamlit) — استيراد ملف النسخة الاحتياطية أو لصقها
   يقبل: ملف aqqar-backup كامل (aqqar-egx) — محفظة + صناديق + سجل قرارات · أو مصفوفة egx_holdings مجردة */

import { useRef, useState } from "react";

type Holding = { t: string; qty: number; avg: number };
type JEntry = { t: number; sym: string; act: string; why: string };

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

  const applyJournal = (entries: JEntry[] | null) => {
    if (!entries || !entries.length) return;
    const clean = entries.filter(e => e && e.t && e.sym && e.act).map(e => ({ t: +e.t, sym: String(e.sym).toUpperCase(), act: String(e.act), why: String(e.why || "") }));
    if (!clean.length) return;
    const cur = (() => { try { return JSON.parse(localStorage.getItem("egx_journal") || "[]") } catch { return [] } })();
    const seen = new Set(cur.map((e: JEntry) => e.t + "|" + e.sym + "|" + e.act));
    const merged = cur.concat(clean.filter(e => !seen.has(e.t + "|" + e.sym + "|" + e.act)));
    try { localStorage.setItem("egx_journal", JSON.stringify(merged)) } catch {}
    setState((s) => (s.indexOf("✅") === 0 ? s + " وسجل القرارات اتنقل (" + clean.length + " قرار)" : "✅ سجل القرارات اتنقل: " + clean.length + " قرار."));
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
        applyJournal(Array.isArray(obj && obj.egx_journal) ? obj.egx_journal : null);
      } catch { setState("⚠️ الملف مش JSON صالح — نزّله تاني من النسخة القديمة."); }
    };
    rd.readAsText(f);
  };

  const handlePaste = () => {
    try {
      const obj = JSON.parse(paste.trim());
      applyHoldings(normalize(obj), Array.isArray(obj && obj.egx_funds) ? obj.egx_funds : null);
      applyJournal(Array.isArray(obj && obj.egx_journal) ? obj.egx_journal : null);
    } catch { setState("⚠️ اللي لزيزته مش JSON صالح — انسخه تاني كامل."); }
  };

  const lsGet = (k: string) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : null } catch { return null } };

  const doExport = async () => {
    const o: any = { app: "mistral-Mi", v: 2, at: new Date().toISOString() };
    ["egx_holdings","egx_funds","egx_journal","egx_paper","egx_ml_db","egx_prefs","egx_pricealerts"].forEach((k) => { const v = lsGet(k); if (v != null) o[k] = v; });
    const j = JSON.stringify(o);
    const blob = new Blob([j], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "mistral-mi-backup-" + new Date().toISOString().slice(0, 10) + ".json";
    document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 3000);
    setState("✅ النسخة الاحتياطية اتنزلت — احتفظ بيها في مكان آمن (وعمرها ما تشاركها).");
  };

  return (
    <div className="card">
      <h3>📦 النسخ الاحتياطي ونقل البيانات</h3>
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
      <div className="row" style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--border)" }}>
        <button className="btn ok mini" onClick={doExport}>💾 نزّل نسخة احتياطية جديدة</button>
        <span className="small muted">محفظتك وصناديقك وسجل قراراتك وتنبيهاتك وإعداداتك — في ملف واحد.</span>
      </div>
      <p className="small muted" style={{ marginTop: 8 }}>
        الأسهم الموجودة عندك حاليًا: {readHoldings().length} — الاستيراد بيدمج (السهم المكرر بيتحدث بالقيمة الجديدة) وما بيمسحش أي حاجة.
        محفظتك بتفضل محفوظة على جهازك بس.
      </p>
    </div>
  );
}
