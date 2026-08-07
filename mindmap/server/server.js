// Version: v1.0.0 | Updated: 2026-08-07 | Features: Standalone Local Express Dev Server Proxy
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
        let chatCompletion = null;
        let usedModel = candidateModels[0];

        for (const model of candidateModels) {
            try {
                chatCompletion = await groq.chat.completions.create({
                    messages: [
                        { role: 'system', content: systemInstruction },
                        { role: 'user', content: userPrompt }
                    ],
                    model: model,
                    temperature: 0.2,
                    max_tokens: 4096,
                });
                usedModel = model;
                break;
            } catch (err) {
                console.warn(`Groq model ${model} failed, trying fallback...`, err.message);
            }
        }

        if (!chatCompletion) {
            throw new Error('All Groq AI models failed to generate mind map.');
        }

        const responseText = (chatCompletion.choices[0]?.message?.content || '').trim();
        
        // Clean out any accidental markdown triple backticks
        const cleanMarkup = responseText.replace(/```[a-z]*\n?/gi, '').replace(/```/g, '').trim();

        return res.json({
            success: true,
            provider: 'Groq',
            model: usedModel,
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
