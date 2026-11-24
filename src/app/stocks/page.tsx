import StocksAllCard from "@/components/StocksAllCard";

export const metadata = { title: "كل الأسهم — mistral-Mi" };

export default function StocksPage() {
  return (
    <main style={{ maxWidth: 960, margin: "0 auto", padding: 16, display: "grid", gap: 14 }}>
      <StocksAllCard />
      <p className="muted small" style={{ textAlign: "center" }}>
        <a href="/modern">التوصيات</a> · <a href="/sharia">☪️ الشريعة</a> · <a href="/">التطبيق الكامل</a>
      </p>
    </main>
  );
}
