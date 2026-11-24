/* بيانات الشريعة: نسب التطهير + كتالوج الصناديق — من الأصول الأصلية */

export const PURIFY: Record<string, number> = { EGAS: 0.06, EGAL: 0.73, MPCO: 0.62, MTIE: 0.60, ORAS: 0.87, RACC: 2.00, ACGC: 1.37, ARCC: 2.02, ATQA: 3.54, ETRS: 1.20, MCQE: 3.22, CIRA: 3.49, ETEL: 0.20, ISPH: 0.01, ORWE: 1.87, SKPC: 3.40 };

export const FUNDS_CATALOG = [
  { name: "صندوق أزيموت ذهب (AZG)", nav: 24, type: "ذهب", sh: true },
  { name: "صندوق الشكمجية للمعادن — الإصدار الأول", nav: 0.91, type: "ذهب", sh: true },
  { name: "صندوق الأهلي كابيتال للذهب", nav: 180, type: "ذهب", sh: false },
  { name: "صندوق بلتون إيفولف للذهب", nav: 1.69, type: "ذهب", sh: false },
  { name: "صندوق مباشر للذهب", nav: 12.478, type: "ذهب", sh: false },
  { name: "صندوق CI Asset للذهب — عائد يومي", nav: 1.095, type: "ذهب", sh: false },
  { name: "صندوق هيرميس للذهب — تراكمي يومي", nav: 91.58, type: "ذهب", sh: false },
  { name: "صندوق ثاندر للذهب — الإصدار الأول", nav: 1.087, type: "ذهب", sh: false },
  { name: "صندوق بلتون وفرة — مؤشر الشريعة EGX33", nav: 2.0013, type: "مؤشر شريعة", sh: true },
  { name: "صندوق مصر شريعة إكويتي (CMS) — يتعقب EGX33", nav: null, type: "مؤشر شريعة", sh: true },
];
