/* عميل الذكاء الاصطناعي — بيتمش على /api/ai (المفتاح في Vercel بس، مش في المتصفح) */

export async function callAI(system: string, user: string): Promise<string> {
  const res = await fetch("/api/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ system, user }),
  });
  const j = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(j && j.error ? j.error : "HTTP " + res.status);
  return (j && j.text) || "";
}
