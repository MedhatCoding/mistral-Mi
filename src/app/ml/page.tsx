import MlCard from "@/components/MlCard";

export const metadata = { title: "التعلم الآلي — mistral-Mi" };

export default function MlPage() {
  return (
    <main style={{ maxWidth: 960, margin: "0 auto", padding: 16, display: "grid", gap: 14 }}>
      <MlCard />
      <p className="muted small" style={{ textAlign: "center" }}>
        <a href="/modern">التوصيات</a> · <a href="/">التطبيق الكامل</a>
      </p>
    </main>
  );
}
