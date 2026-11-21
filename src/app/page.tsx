/* الصفحة الرئيسية — بتشغّل التطبيق الكامل (app.html) داخل Next.js
   ودي نقطة البداية للتحويل التدريجي لمكونات React لاحقًا */

export const metadata = {
  title: "mistral-Mi — محلل البورصة المصرية بالذكاء الاصطناعي",
};

export default function Page() {
  return (
    <iframe
      src="/app.html"
      title="mistral-Mi"
      style={{ position: "fixed", inset: 0, width: "100%", height: "100%", border: "none", background: "#0a0f1c" }}
    />
  );
}