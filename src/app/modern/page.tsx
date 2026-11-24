/* تبويب "التوصيات" بنسخة React — تقرأ من نفس مصادر الريليه */
import dynamic from "next/dynamic";
import IntradayCard from "@/components/IntradayCard";
import ServerPicksCard from "@/components/ServerPicksCard";
import PaperBotCard from "@/components/PaperBotCard";
import LiveMoversCard from "@/components/LiveMoversCard";
import GoldCard from "@/components/GoldCard";
import Egx30Card from "@/components/Egx30Card";

const ScannerCard = dynamic(() => import("@/components/ScannerCard"), { ssr: false });
const AiSummaryCard = dynamic(() => import("@/components/AiSummaryCard"), { ssr: false });

export const metadata = {
  title: "التوصيات — mistral-Mi",
};

export default function ModernPage() {
  return (
    <main style={{ maxWidth: 960, margin: "0 auto", padding: 16, display: "grid", gap: 14 }}>
      <Egx30Card />
      <LiveMoversCard />
      <IntradayCard />
      <ScannerCard />
      <AiSummaryCard />
      <ServerPicksCard />
      <PaperBotCard />
      <GoldCard />
      <nav className="row" style={{ justifyContent: "center", flexWrap: "wrap", gap: 8 }}>
        <a className="btn mini" href="/stocks">📋 كل الأسهم</a>
        <a className="btn mini" href="/sharia">☪️ الشريعة</a>
        <a className="btn mini" href="/ml">🧠 التعلم الآلي</a>
        <a className="btn mini" href="/alerts">🚨 التنبيهات</a>
        <a className="btn mini" href="/journal">📓 سجل القرارات</a>
        <a className="btn mini" href="/portfolio">💼 محفظتي</a>
        <a className="btn mini" href="/">التطبيق الكامل</a>
      </nav>
    </main>
  );
}
