/* مسار الذكاء الاصطناعي — Gemini أولًا (GEMINI_API_KEY) وMistral احتياطي (LLM_API_KEY / MISTRAL_API_KEY)
   المفاتيح تعيش على Vercel فقط — عمرها ما بتبوصل للمتصفح */
export async function POST(req: Request) {
  let body: { system?: string; user?: string } = {};
  try { body = await req.json() } catch {}
  if (!body.user) return Response.json({ error: "طلب فاضي" }, { status: 400 });
  const system = body.system || "أنت محلل أسهم محترف متخصص في البورصة المصرية.";

  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey) {
    try {
      const model = process.env.GEMINI_MODEL || "gemini-2.0-flash";
      const r = await fetch("https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent?key=" + geminiKey, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: system }] },
          contents: [{ role: "user", parts: [{ text: body.user }] }],
          generationConfig: { temperature: 0.4 },
        }),
      });
      if (r.ok) {
        const j = await r.json();
        const text = j.candidates && j.candidates[0] && j.candidates[0].content && j.candidates[0].content.parts
          ? j.candidates[0].content.parts.map((p: any) => p.text || "").join("")
          : "";
        if (text) return Response.json({ text, provider: "gemini" });
      }
    } catch {}
  }

  const mistralKey = process.env.LLM_API_KEY || process.env.MISTRAL_API_KEY;
  if (!geminiKey && !mistralKey) {
    return Response.json({ error: "مفتاح الذكاء الاصطناعي مش مربوط — أضف GEMINI_API_KEY في إعدادات Vercel (Environment Variables) وبعدها اعلم Redeploy" }, { status: 503 });
  }
  try {
    const r = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": "Bearer " + mistralKey },
      body: JSON.stringify({
        model: process.env.LLM_MODEL || "mistral-small-latest",
        messages: [
          { role: "system", content: system },
          { role: "user", content: body.user },
        ],
        temperature: 0.4,
      }),
    });
    if (!r.ok) return Response.json({ error: "HTTP " + r.status }, { status: 502 });
    const j = await r.json();
    return Response.json({ text: j.choices && j.choices[0] ? j.choices[0].message.content : "", provider: "mistral" });
  } catch {
    return Response.json({ error: "تعذر الاتصال بمزود النموذج" }, { status: 502 });
  }
}
