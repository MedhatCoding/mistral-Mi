/* مفتاح الذكاء الاصطناعي يعيش هنا فقط (Vercel env: LLM_API_KEY أو MISTRAL_API_KEY) — عمره ما بيوصل للمتصفح */
export async function POST(req: Request) {
  const key = process.env.LLM_API_KEY || process.env.MISTRAL_API_KEY;
  if (!key) {
    return Response.json({ error: "مفتاح الذكاء الاصطناعي مش مربوط — أضف LLM_API_KEY في إعدادات Vercel (Environment Variables) وبعدها اعلم Deploy من جديد" }, { status: 503 });
  }
  let body: { system?: string; user?: string } = {};
  try { body = await req.json() } catch {}
  if (!body.user) return Response.json({ error: "طلب فاضي" }, { status: 400 });
  try {
    const r = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": "Bearer " + key },
      body: JSON.stringify({
        model: process.env.LLM_MODEL || "mistral-small-latest",
        messages: [
          { role: "system", content: body.system || "أنت محلل أسهم محترف متخصص في البورصة المصرية." },
          { role: "user", content: body.user },
        ],
        temperature: 0.4,
      }),
    });
    if (!r.ok) return Response.json({ error: "HTTP " + r.status }, { status: 502 });
    const j = await r.json();
    return Response.json({ text: j.choices && j.choices[0] ? j.choices[0].message.content : "" });
  } catch {
    return Response.json({ error: "تعذر الاتصال بمزود النموذج" }, { status: 502 });
  }
}
