/* 🔬 مختبر المحفظة الكمي — منقول من التطبيق الأصلي
   ارتباط · مونت كارلو · ماركوفيتز · شهادة المحرك · مختبر الاستراتيجيات */

export const qReturns = (h, n) => {
  const L = Math.min(n, h.length - 1); const out = [];
  for (let i = h.length - L; i < h.length; i++) out.push(h[i] / h[i - 1] - 1);
  return out;
};

export const qPearson = (a, b) => {
  const n = Math.min(a.length, b.length); if (n < 30) return null;
  let ma = 0, mb = 0;
  for (let i = 0; i < n; i++) { ma += a[i]; mb += b[i] }
  ma /= n; mb /= n;
  let sa = 0, sb = 0, sab = 0;
  for (let i = 0; i < n; i++) { const da = a[i] - ma, db = b[i] - mb; sa += da * da; sb += db * db; sab += da * db }
  const d = Math.sqrt(sa * sb); return d < 1e-12 ? 0 : sab / d;
};

/* خريطة الارتباط — ترجع SVG جاهز + متوسط الارتباط + التركيز + مقترحات تنويع */
export function corrLab(syms, closes, holdings, weights) {
  const R = {}; let L = 1e9;
  syms.forEach(s => { R[s] = qReturns(closes[s] || [], 120); L = Math.min(L, R[s].length) });
  if (!isFinite(L) || L < 30) return { err: "مفيش تاريخ كافي — محتاجين 30 جلسة على الأقل لكل سهم." };
  syms.forEach(s => { R[s] = R[s].slice(-L) });
  const n = syms.length, cell = Math.max(16, Math.min(26, Math.floor(520 / Math.max(n, 1)))), pad = 40;
  let svg = '<svg viewBox="0 0 ' + (pad + n * cell + 10) + ' ' + (pad + n * cell + 10) + '" style="width:100%;max-width:660px;height:auto">';
  for (let r = 0; r < n; r++) {
    svg += '<text x="' + (pad - 4) + '" y="' + (pad + r * cell + cell * 0.7) + '" font-size="' + Math.min(11, cell * 0.55) + '" fill="#8da3c9" text-anchor="end">' + syms[r] + '</text>';
    svg += '<text x="' + (pad + r * cell + cell / 2) + '" y="' + (pad - 6) + '" font-size="' + Math.min(11, cell * 0.55) + '" fill="#8da3c9" text-anchor="middle" transform="rotate(-45 ' + (pad + r * cell + cell / 2) + ' ' + (pad - 6) + ')">' + syms[r] + '</text>';
  }
  let sum = 0, cnt = 0;
  for (let r = 0; r < n; r++) for (let k = r + 1; k < n; k++) { const v = qPearson(R[syms[r]], R[syms[k]]); if (v != null) { sum += v; cnt++ } }
  for (let r = 0; r < n; r++) for (let k = 0; k < n; k++) {
    if (r === k) { svg += '<rect x="' + (pad + k * cell) + '" y="' + (pad + r * cell) + '" width="' + (cell - 1) + '" height="' + (cell - 1) + '" rx="2" fill="#27406e"/>'; continue }
    const v = qPearson(R[syms[r]], R[syms[k]]);
    let col, op;
    if (v == null) { col = "#0a1122"; op = 1 }
    else if (v > 0.7) { col = "#ff5c72"; op = (0.35 + 0.65 * Math.min(1, (v - 0.7) / 0.3)).toFixed(2) }
    else if (v > 0.3) { col = "#ffb454"; op = (0.35 + 0.65 * (v - 0.3) / 0.4).toFixed(2) }
    else { col = "#22d3a5"; op = (0.3 + 0.7 * (0.3 - Math.max(-1, v)) / 1.3).toFixed(2) }
    svg += '<rect x="' + (pad + k * cell) + '" y="' + (pad + r * cell) + '" width="' + (cell - 1) + '" height="' + (cell - 1) + '" rx="2" fill="' + col + '" opacity="' + op + '"><title>' + syms[r] + " x " + syms[k] + ": " + (v == null ? "—" : v.toFixed(2)) + '</title></rect>';
  }
  svg += "</svg>";
  const avgR = cnt ? sum / cnt : null;
  const out = { svg, avgR, hhi: null, grade: null, cands: [] };
  if (holdings && holdings.length >= 2) {
    const vals = holdings.map(h => ({ t: h.t, v: h.qty * ((h.price != null ? h.price : h.avg) || h.avg) }));
    const tot = vals.reduce((a, x) => a + x.v, 0) || 1;
    const ws = weights && weights.length === holdings.length ? weights : vals.map(x => x.v / tot);
    const hhi = ws.reduce((a, w) => a + w * w, 0);
    out.hhi = hhi;
    out.grade = (avgR != null && avgR < 0.3 && hhi < 0.25) ? "ممتاز 🌟" : (avgR != null && avgR < 0.5 && hhi < 0.4) ? "كويس ✅" : (avgR != null && avgR < 0.65) ? "متوسط ⚠️" : "ضعيف ❌";
    const held = holdings.map(h => h.t);
    out.cands = syms.filter(s => !held.includes(s)).map(s => {
      const rs = R[s];
      let s2 = 0, cn2 = 0; held.forEach(h2 => { const p = R[h2] ? qPearson(rs, R[h2]) : null; if (p != null) { s2 += p; cn2++ } });
      return { s, avg: cn2 ? s2 / cn2 : null };
    }).filter(x => x.avg != null).sort((a, b) => a.avg - b.avg).slice(0, 5);
  }
  return out;
}

/* مونت كارلو — بوتستراب من عوائد المحفظة الحقيقية */
export function monteCarlo(syms, closes, weights) {
  let L = 1e9; const R = {};
  syms.forEach(s => { R[s] = qReturns(closes[s] || [], 240); L = Math.min(L, R[s].length) });
  if (!isFinite(L) || L < 80) return { err: "التاريخ المتاح لسه قصير (مطلوب 80 جلسة على الأقل)." };
  syms.forEach(s => { R[s] = R[s].slice(-L) });
  const pr = [];
  for (let i = 0; i < L; i++) { let r2 = 0; for (let k = 0; k < syms.length; k++) r2 += weights[k] * R[syms[k]][i]; pr.push(r2) }
  const paths = 2000, days = 60, V0 = 100;
  const perDay = [];
  for (let d = 0; d <= days; d++) perDay.push([]);
  for (let p = 0; p < paths; p++) {
    let v = V0; perDay[0].push(v);
    for (let d = 1; d <= days; d++) { v *= 1 + pr[Math.floor(Math.random() * pr.length)]; perDay[d].push(v) }
  }
  const p5 = [], p25 = [], med = [], p75 = [], p95 = [];
  for (let d = 0; d <= days; d++) {
    const a = perDay[d].slice().sort((x, y) => x - y); const ix = f => Math.min(a.length - 1, Math.floor(f * a.length));
    p5.push(a[ix(0.05)]); p25.push(a[ix(0.25)]); med.push(a[ix(0.5)]); p75.push(a[ix(0.75)]); p95.push(a[ix(0.95)]);
  }
  const lo = Math.min.apply(null, p5) * 0.97, hi = Math.max.apply(null, p95) * 1.03;
  const X = d => (10 + d / days * 860).toFixed(1), Y = v => (10 + (hi - v) / (hi - lo) * 150).toFixed(1);
  const bandPoly = (loA, hiA, fill, op2) => '<polygon points="' + loA.map((v, d) => X(d) + "," + Y(v)).join(" ") + " " + hiA.slice().reverse().map((v, i) => X(days - i) + "," + Y(v)).join(" ") + '" fill="' + fill + '" opacity="' + op2 + '"/>';
  let svg = '<svg viewBox="0 0 880 170" style="width:100%;height:auto">';
  svg += bandPoly(p5, p95, "#4f8cff", 0.16);
  svg += bandPoly(p25, p75, "#4f8cff", 0.34);
  svg += '<polyline points="' + med.map((v, d) => X(d) + "," + Y(v)).join(" ") + '" fill="none" stroke="#22d3a5" stroke-width="2"/>';
  svg += '<line x1="10" y1="' + Y(V0) + '" x2="870" y2="' + Y(V0) + '" stroke="#8da3c9" stroke-width="1" stroke-dasharray="5 4"/>';
  svg += "</svg>";
  let nLoss = 0; perDay[days].forEach(v => { if (v < V0) nLoss++ });
  return {
    svg, label: "محفظتك الحالية (القيم مؤشر نسبي — البداية = 100)",
    medPct: (med[days] / V0 - 1) * 100, p5Pct: (p5[days] / V0 - 1) * 100, p95Pct: (p95[days] / V0 - 1) * 100,
    pLoss: nLoss / paths * 100,
  };
}

/* ماركوفيتز — 4000 توزيعة أوزان: أعلى شارب + أقل مخاطرة */
export function markowitz(syms, closes) {
  const rets = syms.map(s => qReturns(closes[s] || [], 60));
  if (rets.some(r => r.length < 30)) return { err: "التاريخ المتاح لسه قصير — محتاجين 30 جلسة على الأقل لكل سهم." };
  const n = syms.length;
  const L = Math.min.apply(null, rets.map(r => r.length));
  const rs = rets.map(r => r.slice(-L));
  const mu = rs.map(a => a.reduce((x, y) => x + y, 0) / a.length);
  const sd = rs.map(a => { const m = a.reduce((x, y) => x + y, 0) / a.length; return Math.sqrt(a.reduce((s, x) => s + (x - m) * (x - m), 0) / a.length) });
  const cov = [];
  for (let i = 0; i < n; i++) { cov[i] = []; for (let j = 0; j < n; j++) { const p = (i === j) ? 1 : qPearson(rs[i], rs[j]); cov[i][j] = (p == null ? 0.2 : p) * sd[i] * sd[j] } }
  let seed = 987654321;
  const rnd = () => { seed = (seed * 48271) % 2147483647; return seed / 2147483647 };
  let shp = null, mnv = null;
  for (let it = 0; it < 4000; it++) {
    const w = []; let tot = 0;
    for (let i = 0; i < n; i++) { const x = rnd(); w.push(x); tot += x }
    for (let i = 0; i < n; i++) w[i] /= tot;
    let r = 0, v = 0;
    for (let i = 0; i < n; i++) r += w[i] * mu[i];
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) v += w[i] * cov[i][j] * w[j];
    v = Math.sqrt(Math.max(v, 1e-12));
    if (!mnv || v < mnv.v) mnv = { w: w.slice(), v, r };
    const s = (r * 250) / ((v * Math.sqrt(250)) || 1e-9);
    if (!shp || s > shp.s) shp = { w: w.slice(), v, r, s };
  }
  const rows = syms.map((s, i) => ({ s, a: shp.w[i], b: mnv.w[i] })).filter(x => x.a >= 0.02 || x.b >= 0.02).sort((x, y) => Math.max(y.a, y.b) - Math.max(x.a, x.b));
  return { rows, shp: { rAnn: shp.r * 250 * 100, vAnn: shp.v * Math.sqrt(250) * 100, s: shp.s }, mnv: { vAnn: mnv.v * Math.sqrt(250) * 100 } };
}

/* 🏛️ شهادة المحرك — تشغيل توصيات المحرك على سنة الماضي */
export function engineCert(closesBySym, analyze) {
  const H = 15, STEP = 5, T0 = 80;
  const closes = {};
  Object.keys(closesBySym || {}).forEach(s => { const c = closesBySym[s]; if (c && c.length >= T0 + H + 1) closes[s] = c });
  if (Object.keys(closes).length < 3) return { err: "مفيش تاريخ كافي — محتاجين تاريخ سنة كاملة لأسهم الشريعة (تظهر أول ما الريليه يتجمع)." };
  const fwdAll = {};
  Object.keys(closes).forEach(function (s) {
    const c = closes[s];
    for (let t = T0; t + H < c.length; t += STEP) (fwdAll[t] = fwdAll[t] || []).push((c[t + H] - c[t]) / c[t] * 100);
  });
  const med = {};
  Object.keys(fwdAll).forEach(function (t) { const a = fwdAll[t].slice().sort(function (x, y) { return x - y }); if (a.length >= 5) med[t] = a[Math.floor(a.length / 2)] });
  const recs = [];
  Object.keys(closes).forEach(function (s) {
    const c = closes[s];
    for (let t = T0; t + H < c.length; t += STEP) {
      const hist = [];
      for (let i = 0; i <= t; i++) { const o = i ? c[i - 1] : c[i]; hist.push({ d: null, o, h: Math.max(o, c[i]), l: Math.min(o, c[i]), c: c[i], v: 0 }) }
      let v = null;
      try { v = analyze(hist) } catch (e) {}
      if (!v || v.sc < 1.5) continue;
      const entry = c[t]; let st = "timeout", exit = c[t + H];
      for (let j = t + 1; j <= t + H; j++) { if (c[j] >= v.t1) { st = "win"; exit = v.t1; break } if (c[j] <= v.stop) { st = "loss"; exit = v.stop; break } }
      const fwd = (exit - entry) / entry * 100;
      recs.push({ sym: s, st, fwd, rel: med[t] != null ? fwd - med[t] : null });
    }
  });
  const n = recs.length;
  const wins = recs.filter(r => r.st === "win").length;
  const losses = recs.filter(r => r.st === "loss").length;
  const rels = recs.filter(r => r.rel != null);
  const avgFwd = n ? recs.reduce((a, b) => a + b.fwd, 0) / n : null;
  const avgRel = rels.length ? rels.reduce((a, b) => a + b.rel, 0) / rels.length : null;
  const beat = rels.filter(r => r.rel > 0).length;
  return {
    n, wins, losses, timeouts: n - wins - losses,
    winPct: n ? wins / n * 100 : null, lossPct: n ? losses / n * 100 : null,
    avgFwd, avgRel, beatPct: rels.length ? beat / rels.length * 100 : null,
    syms: Object.keys(closes).length, at: Date.now(),
  };
}

/* 🔬 مختبر الاستراتيجية على سهم واحد: اتجاه SMA20/50 + RSI + وقف 2xATR وهدف 3xATR */
const btSMA = (a, n) => { const o = []; let s = 0; for (let i = 0; i < a.length; i++) { s += a[i]; if (i >= n) s -= a[i - n]; o.push(i >= n - 1 ? s / n : null) } return o };
const btRSI = (c, n) => { const o = [null]; let g = 0, l = 0; for (let i = 1; i < c.length; i++) { const d = c[i] - c[i - 1]; if (i <= n) { g += Math.max(d, 0); l += Math.max(-d, 0); o.push(null); if (i === n) { g /= n; l /= n } } else { g = (g * (n - 1) + Math.max(d, 0)) / n; l = (l * (n - 1) + Math.max(-d, 0)) / n; o.push(l === 0 ? 100 : 100 - 100 / (1 + g / l)) } } return o };
const btATR = (hi, lo, cl, n) => { const t = []; for (let i = 1; i < cl.length; i++) t.push(Math.max(hi[i] - lo[i], Math.abs(hi[i] - cl[i - 1]), Math.abs(lo[i] - cl[i - 1]))); return t.length < n ? cl.map(() => null) : t.map((_, i) => i < n ? null : t.slice(i - n + 1, i + 1).reduce((a, b) => a + b, 0) / n) };

export function backtestSym(candles) {
  const cl = candles.map(x => x.c), hi = candles.map(x => x.h != null ? x.h : x.c), lo = candles.map(x => x.l != null ? x.l : x.c);
  if (cl.length < 80) return { err: "البيانات المتاحة أقل من 80 جلسة — مش كفاية لمحاكاة موثوقة." };
  const s20 = btSMA(cl, 20), s50 = btSMA(cl, 50), rsi = btRSI(cl, 14), atr = btATR(hi, lo, cl, 14);
  let inPos = false, pend = false, eCash = 1, entry = 0, stop = 0, target = 0, eAt = 0;
  const trades = [], eq = [];
  for (let i = 50; i < cl.length; i++) {
    if (!inPos && !pend) {
      if (s20[i] != null && s50[i] != null && s20[i] > s50[i] && rsi[i] != null && rsi[i] < 70 && cl[i] > s20[i] && atr[i] != null) pend = true;
    } else if (pend && !inPos) {
      pend = false; inPos = true; entry = cl[i]; eAt = i; stop = entry - 2 * atr[i]; target = entry + 3 * atr[i];
    } else if (inPos) {
      let exit = null, why = "";
      if (lo[i] <= stop) { exit = stop; why = "وقف" }
      else if (hi[i] >= target) { exit = target; why = "هدف" }
      else if (s20[i] != null && s50[i] != null && s20[i] < s50[i]) { exit = cl[i]; why = "انعكاس" }
      else if (i - eAt >= 40) { exit = cl[i]; why = "مهلة" }
      if (exit != null) { const ret = (exit - entry) / entry; eCash *= 1 + ret; trades.push({ en: entry, ex: exit, ret, why, days: i - eAt }); inPos = false }
    }
    eq.push(inPos ? eCash * (cl[i] / entry) : eCash);
  }
  const n = trades.length, wins = trades.filter(t => t.ret > 0).length, wr = n ? 100 * wins / n : 0;
  const tot = 100 * (eCash - 1), bh = 100 * (cl[cl.length - 1] / cl[50] - 1);
  const gains = trades.filter(t => t.ret > 0).reduce((s, t) => s + t.ret, 0);
  const lossesAbs = Math.abs(trades.filter(t => t.ret < 0).reduce((s, t) => s + t.ret, 0));
  const pfs = lossesAbs > 0 ? (gains / lossesAbs).toFixed(2) : (gains > 0 ? "∞" : "—");
  let peak = 0, mdd = 0; for (const v of eq) { if (v > peak) peak = v; if (peak > 0) mdd = Math.max(mdd, 100 * (peak - v) / peak) }
  const rets = []; for (let i = 1; i < cl.length; i++) rets.push(cl[i] / cl[i - 1] - 1);
  const mu = rets.reduce((a, b) => a + b, 0) / (rets.length || 1);
  const vol = Math.sqrt(rets.reduce((s, x) => s + (x - mu) * (x - mu), 0) / (rets.length || 1)) * Math.sqrt(252) * 100;
  const aw = wins ? gains / wins : 0, al = (n - wins) ? lossesAbs / (n - wins) : 0;
  const kelly = (aw > 0 && al > 0) ? Math.max(0, 100 * ((wr / 100) - ((1 - wr / 100) / (aw / al)))) : 0;
  const W = 880, H2 = 150, pad = 10;
  const mn = Math.min.apply(null, eq.concat([1])), mx = Math.max.apply(null, eq.concat([1]));
  const X = i => pad + (i / ((eq.length - 1) || 1)) * (W - 2 * pad), Y = v => 10 + (H2 - 25) * (1 - ((v - mn) / ((mx - mn) || 1)));
  const pts = eq.map((v, i) => X(i) + "," + Y(v)).join(" ");
  const bpts = cl.map((v, i) => i < 50 ? null : (X(i - 50) + "," + Y(v / cl[50]))).filter(Boolean).join(" ");
  return { n, wr, tot, bh, mdd, pfs, vol, kelly, svg: '<svg viewBox="0 0 880 150" style="width:100%;height:auto"><polyline points="' + pts + '" fill="none" stroke="#22d3a5" stroke-width="2"/><polyline points="' + bpts + '" fill="none" stroke="#8da3c9" stroke-width="1.2" stroke-dasharray="5 4"/></svg>', trades: trades.slice(-6).reverse() };
}
