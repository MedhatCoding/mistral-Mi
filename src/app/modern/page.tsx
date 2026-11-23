/* تبويب "التوصيات" بنسخة React — تقرأ من نفس مصادر الريليه */
import IntradayCard from "@/components/IntradayCard";
import ServerPicksCard from "@/components/ServerPicksCard";
import PaperBotCard from "@/components/PaperBotCard";
import LiveMoversCard from "@/components/LiveMoversCard";
import GoldCard from "@/components/GoldCard";

export const metadata = {
  title: "التوصيات — mistral-Mi",
};

export default function ModernPage() {
  return (
    <main style={{ maxWidth: 960, margin: "0 auto", padding: 16, display: "grid", gap: 14 }}>
      <LiveMoversCard />
      <IntradayCard />
      <ServerPicksCard />
      <PaperBotCard />
      <GoldCard />
      <p className="muted small" style={{ textAlign: "center" }}>
        نسخة React التدريجية — الإدخالات والمحفظة والإعدادات لسه في <a href="/">التطبيق الكامل</a>.
      </p>
    </main>
  );
}