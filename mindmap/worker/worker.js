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

        const systemInstruction = `You are a world-class domain expert and Master Mind Map Architect.
Your mission is to construct an exceptionally deep, accurate, non-repetitive, and comprehensive mind map outline enriched with high-value explanatory notes.

STRICT STRUCTURAL & DEDUPLICATION RULES:
1. ZERO DUPLICATION (CRITICAL):
   - EVERY node title across the entire mind map MUST be 100% unique. Never repeat node titles or identical concept names in different branches.
   - Do NOT duplicate sub-topics or concepts anywhere in the tree.
2. DISTINCT ORTHOGONAL BRANCHES:
   - Each Level-1 primary branch must cover a completely distinct, non-overlapping dimension of the main topic (e.g. Branch 1: Core Fundamentals & Principles, Branch 2: Key Architecture & Sub-systems, Branch 3: Practical Tools & Tech Stack, Branch 4: Step-by-Step Workflow, Branch 5: Advanced Applications, Branch 6: Security, Risks & Best Practices).
3. HIERARCHY & DEPTH:
   - Line 1: Root Node (Main Topic :: Comprehensive high-level overview note)
   - Level 1 (1 Tab \\t): 5 to 7 Primary Branches
   - Level 2 (2 Tabs \\t\\t): 3 to 4 Detailed Sub-branches per branch
   - Level 3 (3 Tabs \\t\\t\\t): 2 to 3 Specific Leaf nodes with concrete examples, tools, or implementation mechanisms.
4. MANDATORY RICH & EXPERT NOTES (:: Note Syntax):
   - EVERY node must have an insightful note attached via ' :: Note text'.
   - Notes MUST be detailed, educational, and precise (1-3 sentences). Include core definitions, technical mechanisms, practical value, or real-world examples. Avoid superficial 2-word labels.
5. LANGUAGE MATCHING:
   - Detect the prompt's language (Arabic, English, French, etc.) and generate ALL node titles and ALL notes exclusively in THAT language.
6. STRICT OUTPUT SYNTAX:
   - Format per line: Node Title :: Rich explanatory note
   - Indentation: Use literal Tab characters (\\t) for levels.
   - Do NOT wrap output in markdown code blocks (\`\`\`json or \`\`\`markdown), numbers (1., 2.), or bullet symbols (-, *). Output ONLY the raw mind map outline lines.

Example Output (Arabic Prompt):
الذكاء الاصطناعي والتعلم الآلي :: منظومة حوسبة متقدمة تهدف لمحاكاة الإدراك البشري واتخاذ القرارات الذكية بناءً على البيانات.
\tأسس ومبادئ الذكاء الاصطناعي :: القواعد النمطية والرياضية التي تمكن الأنظمة من تمثيل المعرفة واستخلاص الاستنتاجات المنطقية.
\t\tالاستدلال وحل المشكلات :: خوارزميات البحث وتحديد المسارات الفعالة في فضاءات الحالات المركبة.
\t\tتمثيل المعرفة :: تحويل البيانات المعقدة إلى هياكل دلالية وشبكات مفاهيمية سهلة المعالجة.
\tفروع التعلم الآلي الرئيسية :: الأساليب التكيفية لتطوير الخوارزميات عبر تحليل أنماط البيانات وتحديث الأوزان تلقائياً.
\t\tالتعلم الموجه (Supervised Learning) :: تدريب النماذج على بيانات معنونة مسبقاً للتنبؤ الدقيق بالتصنيفات أو القيم المستمرة.
\t\t\tالتصنيف (Classification) :: تقسيم البيانات إلى فئات محددة مثل كشف البريد العشوائي وتصنيف الصور.
\t\t\tالانحدار (Regression) :: التنبؤ بقيم رقمية متصلة مثل التنبؤ بالأسعار وتوقعات الأسواق.
\t\tالتعلم غير الموجه (Unsupervised Learning) :: استكشاف الأنماط والعلاقات الروابطية الخفية داخل البيانات غير المعنونة.
\t\t\tالتجميع (Clustering) :: تجميع النقاط المتشابهة في مجموعات كتقسيم العملاء وتحليل السلوك.
\t\tالتعلم التعزيزي (Reinforcement Learning) :: تدريب الوكلاء الذكيين عبر التعلم بالمنفعة والتجربة والخطأ لتنسيق القرارات.

Example Output (English Prompt):
Cybersecurity & Defense Architecture :: Modern architectural frameworks and proactive protocols designed to secure digital assets, infrastructure, and user data.
\tCore Security Principles (CIA Triad) :: Foundational benchmarks governing information security standards across enterprise environments.
\t\tConfidentiality :: Restricting sensitive data access exclusively to authorized entities via encryption and identity controls.
\t\tIntegrity :: Ensuring data accuracy, immutability, and protection against unauthorized modification during transmission and storage.
\t\tAvailability :: Guaranteeing continuous, reliable system access and service uptime for legitimate authorized users.
\tThreat Vectors & Vulnerabilities :: Key exploit mechanisms targeted by malicious actors in cloud and enterprise networks.
\t\tMalware & Ransomware :: Malicious software payloads designed to encrypt, exfiltrate, or destroy critical business data.
\t\tSocial Engineering & Phishing :: Manipulative tactics targeting human behavior to steal credentials and bypass security layers.
\t\tZero-Day Exploits :: Attacks leveraging previously unknown system vulnerabilities before developers issue patches.`;

        const userPrompt = `Generate a master-level, fully deduplicated, multi-level mind map outline with rich explanatory notes (using ' :: Note' on every single node) for the topic:\n"${prompt.trim()}"`;

        const candidateModels = ['llama-3.3-70b-versatile', 'llama-3.1-70b-versatile', 'llama-3.1-8b-instant'];
        let groqResponse = null;
        let usedModel = candidateModels[0];

        for (const model of candidateModels) {
          try {
            groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
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
                model: model,
                temperature: 0.2,
                max_tokens: 4096,
              }),
            });
            if (groqResponse.ok) {
              usedModel = model;
              break;
            }
          } catch(err) {
            console.warn(`Worker Groq model ${model} fetch failed:`, err.message);
          }
        }

        if (!groqResponse || !groqResponse.ok) {
          const data = groqResponse ? await groqResponse.json() : {};
          return new Response(JSON.stringify({ error: data.error?.message || 'Groq API Communication Error across models' }), {
            status: groqResponse ? groqResponse.status : 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const data = await groqResponse.json();
        const responseText = (data.choices[0]?.message?.content || '').trim();
        const cleanMarkup = responseText.replace(/```[a-z]*\n?/gi, '').replace(/```/g, '').trim();

        return new Response(JSON.stringify({
          success: true,
          provider: 'Cloudflare Worker + Groq',
          model: usedModel,
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
