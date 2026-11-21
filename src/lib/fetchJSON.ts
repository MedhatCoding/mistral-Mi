"use client";

/* جلب JSON مع كاش-باستر + تخزين آخر نسخة ناجحة في localStorage
   — لو الشبكة وقعت، نعرض القديمة مع تاريخها بدل رسالة فشل */
const PREFIX = "mmi_";

export async function fetchJSON<T>(url: string, timeoutMs = 12000): Promise<T | null> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const sep = url.includes("?") ? "&" : "?";
    const res = await fetch(`${url}${sep}cb=${Date.now()}`, { signal: ctrl.signal, cache: "no-store" });
    if (!res.ok) return null;
    const j = (await res.json()) as T;
    try { localStorage.setItem(PREFIX + url.split("?")[0], JSON.stringify({ t: Date.now(), j })); } catch {}
    return j;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/* آخر نسخة ناجحة (أقرب زمن للحد المطلوب) */
export function cachedJSON<T>(url: string, maxAgeMs = 24 * 60 * 60 * 1000): { j: T; age: number } | null {
  try {
    const raw = localStorage.getItem(PREFIX + url.split("?")[0]);
    if (!raw) return null;
    const { t, j } = JSON.parse(raw) as { t: number; j: T };
    if (Date.now() - t > maxAgeMs) return null;
    return { j, age: Date.now() - t };
  } catch {
    return null;
  }
}

export function timeAgoAr(ts: number): string {
  const m = Math.max(0, Math.round((Date.now() - ts) / 60000));
  if (m < 1) return "الآن";
  if (m < 60) return `منذ ${m} دقيقة`;
  const h = Math.round(m / 60);
  if (h < 24) return `منذ ${h} ساعة`;
  return `منذ ${Math.round(h / 24)} يوم`;
}