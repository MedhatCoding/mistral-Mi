# mistral-Mi — نسخة Next.js للنشر على Vercel

## البنية

- `public/app.html` — التطبيق الكامل (كل الكروت والوظايف زي نسخة Streamlit بالظبط)
- `src/app/page.tsx` — الصفحة الرئيسية بتشغل app.html
- `src/components/IntradayCard.tsx` — أول كارت متحول لـ React (كارت مضاربة الجلسة مع fallback محلي)
- `src/lib/fetchJSON.ts` — جلب مع تخزين آخر نسخة ناجحة (إصلاح مشكلة فشل كارت المضاربة)
- `public/manifest.json` + `public/sw.js` + `public/icon.svg` — PWA

## النشر

1. اربط الفرع ده في Vercel (framework: Next.js — هيكتشفه تلقائيًا).
2. الـ PWA Icons الـ PNG لازم يكونوا موجودين في `public/` — أنسخهم من `main` في mistral-Mi.

## LLM API

متغير بيئة `LLM_API_KEY` في Vercel.