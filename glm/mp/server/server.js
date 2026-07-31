// Version: v2.0.0 | Updated: 2026-07-31 17:19 | Features: Migrated to modern @google/genai SDK with gemini-3.6-flash
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

// Initialize Modern Gemini Client
const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

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
    res.json({ message: 'Meta-Fikra MP Serverless AI API is running', health: '/health' });
});

app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString(), aiConfigured: !!ai });
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

        if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY_HERE') {
            return res.status(400).json({ 
                error: 'Gemini API key is not configured in server/.env file. Please paste your Gemini API key in GEMINI_API_KEY.' 
            });
        }

        const systemInstruction = `You are an expert Arabic Mind Map generator.
Your task is to take a topic or idea and organize it into a structured, clear mind map.

RULES:
1. Output MUST use plain indented outline format using tab characters (\\t) or 2 spaces for indentation.
2. The first line MUST be the main Root Node topic.
3. Every main branch line MUST be indented with 1 tab.
4. Sub-branches MUST be indented with 2 tabs.
5. Use clear, concise Arabic (or English if the user asked in English) for each node label.
6. Do NOT include markdown code blocks, explanations, numbers, or extra text. Output ONLY the mind map outline lines.

Example Output:
أقسام علوم الحاسوب
\tالذكاء الاصطناعي
\t\tتعلم الآلة
\t\tالشبكات العصبية
\tهندسة البرمجيات
\t\tالتصميم والتخطيط
\t\tالتطوير والاختبار
\tأمن المعلومات
\t\tالتشفير
\t\tالأمن السيبراني`;

        const userPrompt = `أنشئ خريطة ذهنية غنية وشاملة للموضوع التالي:\n"${prompt.trim()}"`;
        
        const candidateModels = [
            'gemini-3.6-flash',
            'gemini-3.5-flash',
            'gemini-2.5-flash',
            'gemini-2.0-flash',
            'gemini-flash-latest'
        ];
        
        let responseText = '';
        let lastError = null;

        for (const modelName of candidateModels) {
            try {
                const response = await ai.models.generateContent({
                    model: modelName,
                    contents: userPrompt,
                    config: {
                        systemInstruction: systemInstruction
                    }
                });
                responseText = response.text || '';
                if (responseText) {
                    console.log(`Successfully generated mind map using modern @google/genai SDK with model: ${modelName}`);
                    break;
                }
            } catch (err) {
                lastError = err;
                console.warn(`Model '${modelName}' attempted failed:`, err.message);
            }
        }

        if (!responseText) {
            throw lastError || new Error('No supported Gemini model was found for this API key.');
        }

        responseText = responseText.trim();
        
        // Clean out any accidental markdown triple backticks
        const cleanMarkup = responseText.replace(/```[a-z]*\n?/gi, '').replace(/```/g, '').trim();

        return res.json({
            success: true,
            topic: prompt.trim(),
            markup: cleanMarkup
        });

    } catch (error) {
        console.error('Error generating mind map:', error);
        return res.status(500).json({ 
            error: error.message || 'Failed to generate mind map via Gemini API.', 
            details: error.statusText || error.stack || '' 
        });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Meta-Fikra MP Server running on port ${PORT}`);
});
