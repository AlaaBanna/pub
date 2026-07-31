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

        const systemInstruction = `You are an expert multilingual Mind Map generator.
Your task is to take a topic or idea and organize it into a structured, rich mind map with helpful node notes.

RULES:
1. CRITICAL LANGUAGE RULE: Detect the language of the user's prompt (Arabic, English, French, Spanish, etc.) and generate the ENTIRE mind map outline and explanatory notes in THAT EXACT SAME LANGUAGE.
2. Output MUST use plain indented outline format using tab characters (\\t) or 2 spaces for indentation.
3. The first line MUST be the main Root Node topic.
4. Every main branch line MUST be indented with 1 tab.
5. Sub-branches MUST be indented with 2 tabs.
6. MANDATORY NOTES: Add helpful explanatory notes to important concepts by appending ' :: Note text' at the end of the node line (e.g. 'Node Title :: Explanatory note').
7. Do NOT include markdown code blocks, explanations, numbers, or extra text. Output ONLY the mind map outline lines.

Example Output (Arabic Prompt):
أقسام علوم الحاسوب :: المدخل الرئيسي لمجالات ونظريات البرمجة والحوسبة
\tالذكاء الاصطناعي :: محاكاة القدرات الذهنية البشرية بواسطة الأنظمة الحاسوبية
\t\tتعلم الآلة :: خوارزميات إحصائية تتعلم وتتحسن ذاتياً من البيانات

Example Output (English Prompt):
Computer Science Branches :: Primary entry point for programming and computing theories
\tArtificial Intelligence :: Simulation of human intelligence by computer systems
\t\tMachine Learning :: Statistical algorithms that learn automatically from data
\t\tNeural Networks :: Computing models inspired by biological brain neurons
\tSoftware Engineering :: Framework for building stable software applications
\t\tDesign & Architecture :: System structure and UI/UX specification
\t\tDevelopment & Testing :: Source code implementation and QA verification`;

        const userPrompt = `Create a rich, comprehensive mind map outline with notes for the following topic:\n"${prompt.trim()}"`;

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
