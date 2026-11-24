import AlertsCard from "@/components/AlertsCard";

export const metadata = { title: "التنبيهات — mistral-Mi" };

export default function AlertsPage() {
  return (
    <main style={{ maxWidth: 960, margin: "0 auto", padding: 16, display: "grid", gap: 14 }}>
      <AlertsCard />
      <p className="muted small" style={{ textAlign: "center" }}>
        <a href="/modern">التوصيات</a> · <a href="/">التطبيق الكامل</a>
      </p>
    </main>
  );
}
