"use client";

/* 🤖 ملخص الذكاء الاصطناعي لفرص اليوم — يقرأ توصيات الريليه ويحكيه عبر /api/ai */

import { useState } from "react";
import { callAI } from "@/lib/ai";
import { RAW, BRANCHES } from "@/lib/repo";
import { fetchJSON } from "@/lib/fetchJSON";

type Picks = { time?: number; buys?: { sym?: string; rec?: string; price?: number }[]; sells?: { sym?: string; rec?: string; price?: number }[] };

const MD = (t: string) => t.split("\n").map((l, i) => ({ line: l.replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").replace(/^#{1,3} (.+)$/, "<b>$1</b>"), i }));

export default function AiSummaryCard() {
  const [text, setText] = useState("");
  const [state, setState] = useState("");

  const run = async () => {
    setState("جارٍ إعداد ملخص اليوم…");
    try {
      const picks = await fetchJSON<Picks>(RAW(BRANCHES.picks, "picks.json"));
      const lite = (x: any) => ({ s: x.sym, rec: x.rec, price: x.price });
      const txt = await callAI(
        "أنت محلل أسهم محترف متخصص في البورصة المصرية وكل اقتراحاتك للأسهم المتوافقة مع الشريعة فقط.",
        "اكتب ملخصًا موجزًا (150 كلمة كحد أقصى) لفرص اليوم في البورصة المصرية من نتائج الفحص التالية: اذكر أقوى فرصتين شراء مع السبب، وأهم تحذير، ونصيحة إدارة مخاطر واحدة:\nفرص شراء:\n" + JSON.stringify((picks && picks.buys || []).slice(0, 8).map(lite), null, 1) + "\nتحذيرات بيع:\n" + JSON.stringify((picks && picks.sells || []).slice(0, 5).map(lite), null, 1) + "\nاختم بتنبيه أن هذا ليس نصيحة استثمارية."
      );
      setText(txt); setState("");
    } catch (e: any) {
      setState("⚠️ " + ((e && e.message) || "تعذر الاتصال بمزود النموذج"));
    }
  };

  return (
    <div className="card">
      <div className="row-between">
        <h3>🤖 ملخص فرص اليوم بالذكاء الاصطناعي</h3>
        <button className="btn primary mini" onClick={run} disabled={state.indexOf("جار") === 0}>{state.indexOf("جار") === 0 ? "⏳…" : "✍️ اكتب الملخص"}</button>
      </div>
      {state && state.indexOf("جار") !== 0 && <p className="small" style={{ color: "var(--amber)", marginTop: 8 }}>{state}</p>}
      {text && (
        <p className="small" style={{ lineHeight: 1.9, marginTop: 10 }}>
          {MD(text).map(x => <span key={x.i}>{x.line.replace(/<b>|<\/b>/g, "")}<br /></span>)}
        </p>
      )}
    </div>
  );
}
