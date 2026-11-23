/* engine.ts — مستخرج حرفيًا من index.html */
export const NF=(v,d=2)=>v==null?"—":new Intl.NumberFormat("en-US",{maximumFractionDigits:d}).format(v);
const lastOf=a=>a[a.length-1];
let SIGW={t20:1,x50:1,rsi:1,macd:1,hi52:1};
export function sma(a,n){const o=[];let s=0;for(let i=0;i<a.length;i++){s+=a[i];if(i>=n)s-=a[i-n];o.push(i>=n-1?s/n:null)}return o}
function ema(a,n){const k=2/(n+1),o=[a[0]];for(let i=1;i<a.length;i++)o.push(a[i]*k+o[i-1]*(1-k));return o}
export function rsi(c,n=14){const o=[null];let g=0,l=0;for(let i=1;i<c.length;i++){const d=c[i]-c[i-1];if(i<=n){g+=Math.max(d,0);l+=Math.max(-d,0);o.push(null);if(i===n){g/=n;l/=n}}else{g=(g*(n-1)+Math.max(d,0))/n;l=(l*(n-1)+Math.max(-d,0))/n;o.push(l===0?100:100-100/(1+g/l))}}return o}
export function macd(c){const f=ema(c,12),s=ema(c,26),line=f.map((v,i)=>v-s[i]),sig=ema(line,9);return{line,sig,hist:line.map((v,i)=>v-sig[i])}}
export function boll(c,n=20,k=2){const mid=sma(c,n),up=[],lo=[];for(let i=0;i<c.length;i++){if(i<n-1){up.push(null);lo.push(null);continue}let m=0;for(let j=i-n+1;j<=i;j++){const d=c[j]-mid[i];m+=d*d}const sd=Math.sqrt(m/n);up.push(mid[i]+k*sd);lo.push(mid[i]-k*sd)}return{mid,up,lo}}
export function atr(d,n=14){const t=[];for(let i=1;i<d.length;i++)t.push(Math.max(d[i].h-d[i].l,Math.abs(d[i].h-d[i-1].c),Math.abs(d[i].l-d[i-1].c)));return t.length<n?null:t.slice(-n).reduce((a,b)=>a+b,0)/n}
export function analyze(hist){
  const c=hist.map(x=>x.c);
  if(c.length<60)return null;
  const p=lastOf(c);
  const s20=sma(c,20),s50=sma(c,50),r=rsi(c),m=macd(c),b=boll(c);
  const rv=lastOf(r),mv=lastOf(m.line),sv=lastOf(m.sig),hv=lastOf(m.hist);
  const bU=lastOf(b.up),bL=lastOf(b.lo),bM=lastOf(b.mid);
  const hi52=Math.max(...hist.map(x=>x.h)),lo52=Math.min(...hist.map(x=>x.l));
  const a=atr(hist), ag=(a&&a>0)?a:p*0.02, pos=(p-lo52)/(hi52-lo52||1);
  const rec20=hist.slice(-20);
  const sup=Math.min(...rec20.map(x=>x.l),bL||Infinity);
  const res=Math.max(...rec20.map(x=>x.h),bU||-Infinity);
  const vUp=hist.slice(-10).filter(x=>x.c>=x.o).reduce((s,x)=>s+x.v,0);
  const vDn=hist.slice(-10).filter(x=>x.c<x.o).reduce((s,x)=>s+x.v,0);
  let sc=0; const rs=[];
  const s20v=lastOf(s20.filter(x=>x!=null)),s50v=lastOf(s50.filter(x=>x!=null));
  if(p>s20v){sc+=1.2*SIGW.t20;rs.push(["✅","السعر فوق متوسط 20 جلسة — زخم قصير المدى إيجابي"])}else{sc-=1.2*SIGW.t20;rs.push(["⚠️","السعر تحت متوسط 20 جلسة — ضغط هابط قصير المدى"])}
  if(s20v>s50v){sc+=1.3*SIGW.x50;rs.push(["✅","تقاطع ذهبي: SMA20 فوق SMA50 — الاتجاه المتوسط صاعد"])}else{sc-=1.3*SIGW.x50;rs.push(["⚠️","تقاطع هابط: SMA20 تحت SMA50 — الاتجاه المتوسط سلبي"])}
  if(rv<30){sc+=2*SIGW.rsi;rs.push(["✅","RSI في تشبع بيعي ("+NF(rv,1)+") — ارتداد محتمل"])}
  else if(rv>70){sc-=2*SIGW.rsi;rs.push(["⚠️","RSI في تشبع شرائي ("+NF(rv,1)+") — خطر تصحيح"])}
  else{sc+=(rv-50)/25;rs.push(["ℹ️","RSI عند "+NF(rv,1)+" — زخم "+(rv>55?"إيجابي":rv<45?"سلبي":"محايد")])}
  if(mv>sv){sc+=1.5*SIGW.macd;rs.push(["✅","MACD فوق خط الإشارة — زخم شرائي"])}else{sc-=1.5*SIGW.macd;rs.push(["⚠️","MACD تحت خط الإشارة — فقدان الزخم"])}
  const hPrev=m.hist[m.hist.length-2];
  if(hv>0&&hv>hPrev)rs.push(["✅","هيستوجرام MACD يتزايد موجبًا — تسارع صاعد"]);
  if(hv<0&&hv<hPrev)rs.push(["⚠️","هيستوجرام MACD يتزايد سالبًا — تسارع هابط"]);
  if(p<bL){sc+=1;rs.push(["✅","كسر الحد السفلي لبولنجر — تشبع بيعي حاد"])}
  else if(p>bU){sc-=1;rs.push(["⚠️","فوق الحد العلوي لبولنجر — تشبع شرائي"])}
  else rs.push(["ℹ️","داخل نطاق بولنجر — تقلب "+(((bU-bL)/bM*100)>25?"مرتفع":"طبيعي")]);
  if(vUp>vDn*1.2){sc+=0.8;rs.push(["✅","حجم التداول مع أيام الصعود — تجميع"])}
  else if(vDn>vUp*1.2){sc-=0.8;rs.push(["⚠️","حجم التداول مع أيام الهبوط — توزيع"])}
  if(pos>0.85){sc+=0.6*SIGW.hi52;rs.push(["✅","قرب قمة 52 أسبوعًا ("+NF(pos*100,0)+"%) — قوة اتجاه"])}
  else if(pos<0.2){sc-=0.4;rs.push(["ℹ️","قرب قاع 52 أسبوعًا ("+NF(pos*100,0)+"%) — فرصة قيمة أو ضعف مستمر"])}
  let rec,cls,em,stars;
  if(sc>=4.5){rec="شراء قوي";cls="rec-strongbuy";em="🚀";stars=5}
  else if(sc>=1.5){rec="شراء";cls="rec-buy";em="📈";stars=4}
  else if(sc>-1.5){rec="حياد / احتفاظ";cls="rec-hold";em="⚖️";stars=3}
  else if(sc>-4.5){rec="بيع / تجنب";cls="rec-sell";em="📉";stars=2}
  else{rec="بيع قوي";cls="rec-strongsell";em="🔻";stars=1}
  const pn=rs.filter(x=>x[0]==="✅").length,nn=rs.filter(x=>x[0]==="⚠️").length;
  const conf=Math.min(94,Math.round(52+Math.abs(sc)*4.5+Math.abs(pn-nn)/(pn+nn||1)*18));
  return {sc,rec,cls,em,stars,conf,rs,sup,res,rsi:rv,macd:mv,sig:sv,bU,bL,bM,s20:s20v,s50:s50v,hi52,lo52,atr:a,atrPct:ag/p*100,pos,
    risk:(ag/p*100)>4?"عالية":((ag/p*100)>2.5?"متوسطة":"منخفضة"),
    stop:Math.round((p-2*ag)*1000)/1000,t1:Math.round((p+3*ag)*1000)/1000,t2:Math.max(res,p+5*ag),sma20:s20,sma50:s50,rsiArr:r,macdArr:m,closes:c};
}

const SHARIA_IDX = ["ACGC","ETEL","OCDI","PHDC","SKPC","TMGH","ETRS","IFAP","LCSW","MASR","MPCO","ORWE","SAUD","MCQE","AMOC","EGAS","FAIT","ATQA","CIRA","EGAL","FAITA","JUFO","ORHD","ADIB","ARCC","ORAS","EFID","OLFI","MTIE","RACC","ICFC","ISPH","RMDA","EFIH","GOUR","CLHO"];
const SHARIA_EXTRA = ["ABUK","SWDY","MFPC","FWRY","POUL","EGCH","EGTS","ELKA","EMFD","TAQA","MNHD"];
export const SHARIA=[...SHARIA_IDX,...SHARIA_EXTRA];
