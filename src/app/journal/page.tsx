import JournalCard from "@/components/JournalCard";

export const metadata = { title: "سجل القرارات — mistral-Mi" };

export default function JournalPage() {
  return (
    <main style={{ maxWidth: 960, margin: "0 auto", padding: 16, display: "grid", gap: 14 }}>
      <JournalCard />
      <p className="muted small" style={{ textAlign: "center" }}>
        <a href="/modern">التوصيات</a> · <a href="/">التطبيق الكامل</a>
      </p>
    </main>
  );
}
