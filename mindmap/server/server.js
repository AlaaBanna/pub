// Version: v4.1.0 | Updated: 2026-07-31 18:49 | Features: Enriched Groq systemInstruction with inline node notes (:: syntax)
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Groq from 'groq-sdk';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

// Initialize Groq API Client
const apiKey = process.env.GROQ_API_KEY;
const groq = apiKey && apiKey !== 'gsk_your_groq_api_key_here' ? new Groq({ apiKey }) : null;

// ── GUARDRAIL TOPIC VALIDATION ──
function isMindMapTopicValid(prompt) {
    if (!prompt || typeof prompt !== 'string') return false;
    const clean = prompt.trim();
    if (clean.length < 3 || clean.length > 300) return false;
    
    const forbiddenPatterns = [
        /ignore previous instructions/i,
        /system prompt/i,
        /execute code/i,
        /<script/i,
        /sudo /i
    ];
    return !forbiddenPatterns.some(pattern => pattern.test(clean));
}

// ── ROOT & HEALTH CHECK ──
app.get('/', (req, res) => {
    res.json({ message: 'Meta-Fikra MP Groq Serverless AI API is running', health: '/health' });
});

app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString(), aiConfigured: !!groq, provider: 'Groq (llama-3.1-8b-instant)' });
});

// ── GENERATE MIND MAP API ──
app.post('/api/generate', async (req, res) => {
    try {
        const { prompt } = req.body;
        
        if (!prompt || !isMindMapTopicValid(prompt)) {
            return res.status(400).json({ 
                error: 'Invalid or off-topic prompt. Please provide a clear educational or conceptual topic in Arabic or English.' 
            });
        }

        if (!groq) {
            return res.status(400).json({ 
                error: 'Groq API key is not configured in server/.env file. Please paste your Groq API key (starts with gsk_) in GROQ_API_KEY.' 
            });
        }

        const systemInstruction = `You are a world-class domain expert and Master Mind Map Architect.
Your task is to organize any topic or concept into an extraordinarily rich, comprehensive, accurate, and deeply structured mind map with insightful explanatory notes.

CRITICAL STRUCTURAL & CONTENT RULES:
1. LANGUAGE CONSISTENCY: Detect the user's prompt language (Arabic, English, French, Spanish, etc.) and generate the ENTIRE mind map (all titles and all explanatory notes) strictly in THAT EXACT SAME LANGUAGE.
2. DEPTH & BREADTH HIERARCHY:
   - Root Node (Line 1): Main topic title + comprehensive introductory note.
   - 5 to 8 Primary Branches (1 tab \\t): Covering foundational concepts, architecture/components, workflows/methodologies, tools/tech stack, practical applications, and best practices/challenges.
   - 2 to 4 Secondary Sub-branches (2 tabs \\t\\t): Expanding each primary branch with specific sub-components.
   - 2 to 3 Tertiary Leaves (3 tabs \\t\\t\\t) where relevant: Providing concrete examples, technical details, or actionable steps.
3. MANDATORY DETAILED NOTES (:: Note Syntax):
   - Append ' :: Explanatory note text' to EVERY node.
   - Notes MUST be rich, informative, and educational (1-3 clear sentences). Provide actionable insights, key technical definitions, practical context, or core mechanisms rather than brief 2-word labels.
4. SYNTAX & FORMATTING:
   - Use plain text outline format with Tab characters (\\t) for indentation levels.
   - Format per line: Node Title :: Rich explanatory note
   - Do NOT include markdown code blocks (\`\`\`json or \`\`\`markdown), numbers (1., 2.), bullet symbols (-, *), or extra chat text. Output ONLY the raw mind map outline lines.

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

        const userPrompt = `Generate an exceptionally rich, multi-level, comprehensive mind map outline with detailed explanatory notes (using ' :: Note' on every single node) for the topic:\n"${prompt.trim()}"`;

        const chatCompletion = await groq.chat.completions.create({
            messages: [
                { role: 'system', content: systemInstruction },
                { role: 'user', content: userPrompt }
            ],
            model: 'llama-3.1-8b-instant',
            temperature: 0.4,
            max_tokens: 4096,
        });

        const responseText = (chatCompletion.choices[0]?.message?.content || '').trim();
        
        // Clean out any accidental markdown triple backticks
        const cleanMarkup = responseText.replace(/```[a-z]*\n?/gi, '').replace(/```/g, '').trim();

        return res.json({
            success: true,
            provider: 'Groq',
            model: 'llama-3.1-8b-instant',
            topic: prompt.trim(),
            markup: cleanMarkup
        });

    } catch (error) {
        console.error('Error generating mind map via Groq:', error);
        return res.status(500).json({ 
            error: error.message || 'Failed to generate mind map via Groq API.', 
            details: error.statusText || error.stack || '' 
        });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Meta-Fikra MP Server (Groq Llama-3.1-8b-instant) running on port ${PORT}`);
});
