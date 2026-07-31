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

        const chatCompletion = await groq.chat.completions.create({
            messages: [
                { role: 'system', content: systemInstruction },
                { role: 'user', content: userPrompt }
            ],
            model: 'llama-3.1-8b-instant',
            temperature: 0.3,
            max_tokens: 2048,
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
