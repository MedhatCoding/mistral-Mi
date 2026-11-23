import PortfolioCard from "@/components/PortfolioCard";

export const metadata = { title: "محفظتي — mistral-Mi" };

export default function PortfolioPage() {
  return (
    <main style={{ maxWidth: 960, margin: "0 auto", padding: 16, display: "grid", gap: 14 }}>
      <PortfolioCard />
      <p className="muted small" style={{ textAlign: "center" }}>
        <a href="/modern">التوصيات</a> · <a href="/">التطبيق الكامل</a>
      </p>
    </main>
  );
}