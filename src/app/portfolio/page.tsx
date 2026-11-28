import dynamic from "next/dynamic";

import PortfolioCard from "@/components/PortfolioCard";

const TransferCard = dynamic(() => import("@/components/TransferCard"), { ssr: false });

export const metadata = { title: "محفظتي — mistral-Mi" };

export default function PortfolioPage() {
  return (
    <main style={{ maxWidth: 960, margin: "0 auto", padding: 16, display: "grid", gap: 14 }}>
      <PortfolioCard />
      <TransferCard />
      <p className="muted small" style={{ textAlign: "center" }}>
        <a href="/modern">التوصيات</a> · <a href="/lab">🔬 المختبر الكمي</a> · <a href="/">التطبيق الكامل</a>
      </p>
    </main>
  );
}
