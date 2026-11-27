import dynamic from "next/dynamic";

const StrategyLab = dynamic(() => import("@/components/StrategyLab"), { ssr: false });
const QuantLab = dynamic(() => import("@/components/QuantLab"), { ssr: false });
const EngineCertCard = dynamic(() => import("@/components/EngineCertCard"), { ssr: false });

export const metadata = { title: "المختبر الكمي — mistral-Mi" };

export default function LabPage() {
  return (
    <main style={{ maxWidth: 960, margin: "0 auto", padding: 16, display: "grid", gap: 14 }}>
      <EngineCertCard />
      <StrategyLab />
      <QuantLab />
      <p className="muted small" style={{ textAlign: "center" }}>
        <a href="/modern">التوصيات</a> · <a href="/portfolio">💼 محفظتي</a> · <a href="/">التطبيق الكامل</a>
      </p>
    </main>
  );
}
