/* ML — منقول حرفيًا من التطبيق الأصلي (انحدار لوجستي داخل المتصفح)
   16 سمة فنية · تدريب على سنة تاريخ · توقع صعود 20 جلسة لأسهم الشريعة */

export const ML_FEATS = ["عائد ٥ جلسات","عائد ١٠ جلسات","عائد ٢٠ جلسة","الموقع من SMA20","تقاطع SMA20/50","RSI","الموقع من مدى ١٢٠ جلسة","التقلب","نسبة السيولة ٥/٢٠","زخم ٦ شهور","هيستوجرام MACD","z-score بولنجر","الموقع من SMA50","عائد ٦٠ جلسة","RSI قصير","ميل الاتجاه"];

const mean = a => a.reduce((x, y) => x + y, 0) / a.length;

function mlFeatures(c, v) {
  const n = c.length; if (n < 60) return null;
  const last = c[n - 1];
  const sma = k => mean(c.slice(-k));
  const vol = k => { const a = c.slice(-k), m = mean(a); return Math.sqrt(mean(a.map(x => (x - m) * (x - m)))) };
  const ret = k => (last - c[n - 1 - k]) / c[n - 1 - k] * 100;
  let g = 0, l = 0;
  for (let i = n - 14; i < n; i++) { const d = c[i] - c[i - 1]; if (d > 0) g += d; else l -= d }
  const rsi = g + l === 0 ? 50 : 100 - 100 / (1 + (g / 14) / ((l / 14) || 1e-9));
  let g7 = 0, l7 = 0;
  for (let i = n - 7; i < n; i++) { const d = c[i] - c[i - 1]; if (d > 0) g7 += d; else l7 -= d }
  const rsi7 = g7 + l7 === 0 ? 50 : 100 - 100 / (1 + (g7 / 7) / ((l7 / 7) || 1e-9));
  const hi = Math.max.apply(null, c.slice(-120)), lo = Math.min.apply(null, c.slice(-120));
  const pavg = k => { const a = (v || []).slice(-k).filter(x => x > 0); return a.length ? mean(a) : null };
  const m5 = pavg(5), m20 = pavg(20);
  const vr = (m5 != null && m20 != null && m20 > 0) ? m5 / m20 : 1;
  const r120 = n >= 121 ? ret(120) : 0;
  const emas = (a, k) => { const al = 2 / (k + 1), o = [a[0]]; for (let i = 1; i < a.length; i++) o.push(al * a[i] + (1 - al) * o[i - 1]); return o };
  const e12 = emas(c, 12), e26 = emas(c, 26);
  const md = e12.map((x, i) => x - e26[i]), sg = emas(md, 9);
  const macdH = (md[n - 1] - sg[n - 1]) / last * 100;
  const s20 = sma(20), std20 = vol(20);
  const bollZ = (last - s20) / (std20 || 1e-9);
  const s20p = n >= 25 ? mean(c.slice(-25, -5)) : s20;
  const slope = (s20 - s20p) / last * 100;
  const r60 = n >= 61 ? ret(60) : 0;
  return [ret(5), ret(10), ret(20), (last / s20 - 1) * 100, (s20 / sma(50) - 1) * 100, rsi, (last - lo) / ((hi - lo) || 1e-9) * 100, std20 / last * 100, vr, r120, macdH, bollZ, (last / sma(50) - 1) * 100, r60, rsi7, slope];
}

const mlGet = () => {
  try { const x = JSON.parse(localStorage.getItem("egx_ml_db")); if (x && typeof x === "object") return { days: x.days || {}, model: x.model || null } } catch (e) {}
  return { days: {}, model: null };
};
const mlSet = db => { try { localStorage.setItem("egx_ml_db", JSON.stringify(db)) } catch (e) {} };

/* لقطة يومية للإغلاقات — hist: {sym:candles} */
export function mlDaily(histMap, liveMap) {
  const db = mlGet();
  const d = new Date();
  const key = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  const p = {};
  Object.keys(histMap).forEach(s => {
    const arr = histMap[s]; const last = arr && arr.length ? arr[arr.length - 1] : null;
    if (!last || !last.c) return;
    const q = liveMap && liveMap[s];
    p[s] = (q && q.price) ? q.price : last.c;
  });
  if (Object.keys(p).length < 10) return { n: Object.keys(db.days).length };
  db.days[key] = p;
  const ks = Object.keys(db.days).sort();
  while (ks.length > 500) delete db.days[ks.shift()];
  mlSet(db);
  return { n: Object.keys(db.days).length };
}

function mlCV(candles) {
  const h = [], v = [];
  (candles || []).forEach(x => { if (x && x.c != null && x.c > 0) { h.push(x.c); v.push(x && x.v != null && x.v > 0 ? x.v : 0) } });
  return { h, v };
}

function mlSamples(histMap) {
  const X = [], Y = [];
  Object.keys(histMap || {}).forEach(s => {
    const cv = mlCV(histMap[s]); const h = cv.h, vols = cv.v;
    if (h.length < 65) return;
    for (let t = 55; t < h.length - 20; t++) { const f = mlFeatures(h.slice(0, t + 1), vols.slice(0, t + 1)); if (f) { X.push(f); Y.push(h[t + 20] > h[t] ? 1 : 0) } }
  });
  return { X, Y };
}

/* تدريب: 80% زمني أول للتعلم و20% آخر للاختبار */
export function mlTrain(histMap) {
  const S = mlSamples(histMap), X = S.X, Y = S.Y;
  if (X.length < 400) return { err: "البيانات المتاحة لسه قليلة (طالع " + X.length + " عينة) — اتأكد إن hist.json فيه سنة كاملة وجرّب تاني" };
  const cut = Math.floor(X.length * 0.8), D = X[0].length;
  const Xtr = X.slice(0, cut), Ytr = Y.slice(0, cut), Xte = X.slice(cut), Yte = Y.slice(cut);
  const sig = z => 1 / (1 + Math.exp(-Math.max(-30, Math.min(30, z))));
  let w = new Array(D).fill(0), b = 0;
  for (let e = 0; e < 250; e++) {
    const gw = new Array(D).fill(0); let gb = 0;
    for (let i = 0; i < Xtr.length; i++) {
      let z = b; for (let k = 0; k < D; k++) z += w[k] * Xtr[i][k];
      const err = sig(z) - Ytr[i];
      for (let k = 0; k < D; k++) gw[k] += err * Xtr[i][k];
      gb += err;
    }
    for (let k = 0; k < D; k++) w[k] -= 0.15 * gw[k] / Xtr.length;
    b -= 0.15 * gb / Xtr.length;
  }
  let ok = 0, ones = 0;
  for (let i = 0; i < Xte.length; i++) { let z = b; for (let k = 0; k < D; k++) z += w[k] * Xte[i][k]; if ((sig(z) >= 0.5 ? 1 : 0) === Yte[i]) ok++; if (Yte[i]) ones++ }
  const baseR = Xte.length ? Math.max(ones, Xte.length - ones) / Xte.length * 100 : 0;
  const model = { w, b, acc: Xte.length ? ok / Xte.length * 100 : 0, base: baseR, n: X.length, nTest: Xte.length, at: Date.now() };
  const db = mlGet(); db.model = model; mlSet(db);
  return { model };
}

/* احتمالية صعود خلال 20 جلسة لسهم معين */
export function mlProb(sym, candles) {
  const db = mlGet(); if (!db.model || !db.model.w) return null;
  const cv = mlCV(candles);
  const f = mlFeatures(cv.h, cv.v); if (!f) return null;
  let z = db.model.b;
  for (let k = 0; k < db.model.w.length && k < f.length; k++) z += db.model.w[k] * f[k];
  return 1 / (1 + Math.exp(-Math.max(-30, Math.min(30, z))));
}

export function trainedModel() { return mlGet().model }
