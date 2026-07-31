// Version: v1.0.0 | Created: 2026-07-31 | Cloudflare Worker for Groq AI Mind Map Generator
export default {
  async fetch(request, env, ctx) {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);

    // Root & Health Check
    if (url.pathname === '/' || url.pathname === '/health') {
      return new Response(JSON.stringify({ 
        status: 'ok', 
        service: 'Meta-Fikra Mind Map AI Proxy',
        provider: 'Cloudflare Worker + Groq (llama-3.1-8b-instant)',
        timestamp: new Date().toISOString()
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Generate Mind Map API Endpoint
    if (url.pathname === '/api/generate' && request.method === 'POST') {
      try {
        const { prompt } = await request.json();
        
        if (!prompt || typeof prompt !== 'string' || prompt.trim().length < 3) {
          return new Response(JSON.stringify({ error: 'Invalid or missing prompt' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        if (!env.GROQ_API_KEY) {
          return new Response(JSON.stringify({ error: 'GROQ_API_KEY environment variable is missing on Cloudflare Worker.' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const systemInstruction = `You are an expert Arabic Mind Map generator.
Your task is to take a topic or idea and organize it into a structured, rich mind map with helpful node notes.

RULES:
1. Output MUST use plain indented outline format using tab characters (\\t) or 2 spaces for indentation.
2. The first line MUST be the main Root Node topic.
3. Every main branch line MUST be indented with 1 tab.
4. Sub-branches MUST be indented with 2 tabs.
5. Use clear, concise Arabic (or English if requested) for node labels.
6. MANDATORY NOTES: Add helpful explanatory notes to important concepts by appending ' :: Note text' at the end of the node line (e.g. 'Node Title :: Explanatory note').
7. Do NOT include markdown code blocks, explanations, numbers, or extra text. Output ONLY the mind map outline lines.

Example Output:
أقسام علوم الحاسوب :: المدخل الرئيسي لمجالات ونظريات البرمجة والحوسبة
\tالذكاء الاصطناعي :: محاكاة القدرات الذهنية البشرية بواسطة الأنظمة الحاسوبية
\t\tتعلم الآلة :: خوارزميات إحصائية تتعلم وتتحسن ذاتياً من البيانات
\t\tالشبكات العصبية :: نماذج حاسوبية مستوحاة من الخلايا العصبية في الدماغ
\tهندسة البرمجيات :: إطار عمل لبناء وتصميم تطبيقات برمجية مستقرة
\t\tالتصميم والتخطيط :: تحديد معمارية النظام وواجهات المستخدم
\t\tالتطوير والاختبار :: كتابة الشفرة المصدريّة والتحقق من جودتها
\tأمن المعلومات :: حماية الأنظمة والبيانات من التهديدات السيبرانية
\t\tالتشفير :: حماية البيانات باستخدام خوارزميات رياضية معقدة
\t\tالأمن السيبراني :: تصدي للهجمات واختبار الثغرات الأمنية`;

        const userPrompt = `أنشئ خريطة ذهنية غنية وشاملة للموضوع التالي:\n"${prompt.trim()}"`;

        const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${env.GROQ_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages: [
              { role: 'system', content: systemInstruction },
              { role: 'user', content: userPrompt }
            ],
            model: 'llama-3.1-8b-instant',
            temperature: 0.3,
            max_tokens: 2048,
          }),
        });

        const data = await groqResponse.json();

        if (!groqResponse.ok) {
          return new Response(JSON.stringify({ error: data.error?.message || 'Groq API Communication Error' }), {
            status: groqResponse.status,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const responseText = (data.choices[0]?.message?.content || '').trim();
        const cleanMarkup = responseText.replace(/```[a-z]*\n?/gi, '').replace(/```/g, '').trim();

        return new Response(JSON.stringify({
          success: true,
          provider: 'Cloudflare Worker + Groq',
          model: 'llama-3.1-8b-instant',
          topic: prompt.trim(),
          markup: cleanMarkup
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      } catch (err) {
        return new Response(JSON.stringify({ error: err.message || 'Server error' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    return new Response(JSON.stringify({ error: 'Endpoint Not Found' }), { 
      status: 404, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  },
};
