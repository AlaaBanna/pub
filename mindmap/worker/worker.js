// Version: v2.0.0 | Updated: 2026-08-01 | Features: Groq AI Proxy + Cloudflare D1 Auth, Saved Maps & Sharing API
export default {
  async fetch(request, env, ctx) {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);

    // Helpers
    const jsonRes = (data, status = 200) => new Response(JSON.stringify(data), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

    const jwtSecret = env.JWT_SECRET || 'metafikra_mindmap_jwt_secret_key_2026';

    // ── WEB CRYPTO AUTH HELPERS ──
    async function hashPassword(password) {
      const encoder = new TextEncoder();
      const data = encoder.encode(password + '_metafikra_salt_2026');
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    async function signJwt(payload, secret) {
      const header = { alg: 'HS256', typ: 'JWT' };
      const encodedHeader = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
      const encodedPayload = btoa(JSON.stringify(payload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
      const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
      const signatureBuffer = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${encodedHeader}.${encodedPayload}`));
      const signatureArray = Array.from(new Uint8Array(signatureBuffer));
      const encodedSignature = btoa(String.fromCharCode(...signatureArray)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
      return `${encodedHeader}.${encodedPayload}.${encodedSignature}`;
    }

    async function verifyJwt(token, secret) {
      if (!token || typeof token !== 'string') return null;
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      const [headerB64, payloadB64, sigB64] = parts;
      try {
        const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
        const rawSig = Uint8Array.from(atob(sigB64.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
        const isValid = await crypto.subtle.verify('HMAC', key, rawSig, new TextEncoder().encode(`${headerB64}.${payloadB64}`));
        if (!isValid) return null;
        const payload = JSON.parse(atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/')));
        if (payload.exp && Date.now() / 1000 > payload.exp) return null;
        return payload;
      } catch (e) {
        return null;
      }
    }

    async function getAuthUser() {
      const authHeader = request.headers.get('Authorization') || '';
      if (!authHeader.startsWith('Bearer ')) return null;
      const token = authHeader.slice(7).trim();
      return await verifyJwt(token, jwtSecret);
    }

    // ── ROOT & HEALTH CHECK ──
    if (url.pathname === '/' || url.pathname === '/health') {
      return jsonRes({ 
        status: 'ok', 
        service: 'Meta-Fikra Mind Map Gateway',
        provider: 'Cloudflare Worker + Groq 70B + D1 SQL',
        timestamp: new Date().toISOString()
      });
    }

    // ── AUTH ENDPOINTS ──
    if (url.pathname === '/api/auth/register' && request.method === 'POST') {
      try {
        const { email, name, password } = await request.json();
        if (!email || !name || !password || password.length < 6) {
          return jsonRes({ error: 'Valid email, name, and password (min 6 chars) are required.' }, 400);
        }
        if (!env.DB) {
          return jsonRes({ error: 'Cloudflare D1 database binding missing.' }, 500);
        }

        const existing = await env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email.toLowerCase().trim()).first();
        if (existing) {
          return jsonRes({ error: 'An account with this email already exists.' }, 400);
        }

        const userId = crypto.randomUUID();
        const pwdHash = await hashPassword(password);
        await env.DB.prepare('INSERT INTO users (id, email, name, password_hash) VALUES (?, ?, ?, ?)').bind(userId, email.toLowerCase().trim(), name.trim(), pwdHash).run();

        const tokenPayload = { sub: userId, email: email.toLowerCase().trim(), name: name.trim(), exp: Math.floor(Date.now() / 1000) + (30 * 86400) };
        const token = await signJwt(tokenPayload, jwtSecret);

        return jsonRes({ success: true, token, user: { id: userId, email: email.toLowerCase().trim(), name: name.trim() } });
      } catch(err) {
        return jsonRes({ error: err.message || 'Registration failed.' }, 500);
      }
    }

    if (url.pathname === '/api/auth/login' && request.method === 'POST') {
      try {
        const { email, password } = await request.json();
        if (!email || !password) {
          return jsonRes({ error: 'Email and password are required.' }, 400);
        }
        if (!env.DB) {
          return jsonRes({ error: 'Cloudflare D1 database binding missing.' }, 500);
        }

        const user = await env.DB.prepare('SELECT id, email, name, password_hash FROM users WHERE email = ?').bind(email.toLowerCase().trim()).first();
        if (!user) {
          return jsonRes({ error: 'Invalid email or password.' }, 401);
        }

        const pwdHash = await hashPassword(password);
        if (user.password_hash !== pwdHash) {
          return jsonRes({ error: 'Invalid email or password.' }, 401);
        }

        const tokenPayload = { sub: user.id, email: user.email, name: user.name, exp: Math.floor(Date.now() / 1000) + (30 * 86400) };
        const token = await signJwt(tokenPayload, jwtSecret);

        return jsonRes({ success: true, token, user: { id: user.id, email: user.email, name: user.name } });
      } catch(err) {
        return jsonRes({ error: err.message || 'Login failed.' }, 500);
      }
    }

    if (url.pathname === '/api/auth/google' && request.method === 'POST') {
      try {
        const { credential } = await request.json();
        if (!credential) return jsonRes({ error: 'Google credential token is missing.' }, 400);

        const verifyRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`);
        if (!verifyRes.ok) return jsonRes({ error: 'Failed to verify Google Token.' }, 401);

        const gUser = await verifyRes.json();
        const googleId = gUser.sub;
        const email = gUser.email.toLowerCase().trim();
        const name = gUser.name || gUser.email.split('@')[0];

        if (!env.DB) return jsonRes({ error: 'Cloudflare D1 database binding missing.' }, 500);

        let user = await env.DB.prepare('SELECT id, email, name FROM users WHERE email = ? OR google_id = ?').bind(email, googleId).first();
        let userId = user ? user.id : crypto.randomUUID();

        if (!user) {
          await env.DB.prepare('INSERT INTO users (id, email, name, google_id) VALUES (?, ?, ?, ?)').bind(userId, email, name, googleId).run();
        } else {
          await env.DB.prepare('UPDATE users SET google_id = ?, name = ? WHERE id = ?').bind(googleId, name, userId).run();
        }

        const tokenPayload = { sub: userId, email, name, exp: Math.floor(Date.now() / 1000) + (30 * 86400) };
        const token = await signJwt(tokenPayload, jwtSecret);

        return jsonRes({ success: true, token, user: { id: userId, email, name } });
      } catch(err) {
        return jsonRes({ error: err.message || 'Google authentication failed.' }, 500);
      }
    }

    // ── MAPS STORAGE & SHARING ENDPOINTS ──
    if (url.pathname === '/api/maps' && request.method === 'GET') {
      const user = await getAuthUser();
      if (!user) return jsonRes({ error: 'Unauthorized. Please login.' }, 401);
      if (!env.DB) return jsonRes({ error: 'D1 DB binding missing.' }, 500);

      const maps = await env.DB.prepare('SELECT id, title, share_id, is_public, created_at, updated_at FROM maps WHERE user_id = ? ORDER BY updated_at DESC').bind(user.sub).all();
      return jsonRes({ success: true, maps: maps.results || [] });
    }

    if (url.pathname === '/api/maps' && request.method === 'POST') {
      const user = await getAuthUser();
      if (!user) return jsonRes({ error: 'Unauthorized. Please login.' }, 401);
      if (!env.DB) return jsonRes({ error: 'D1 DB binding missing.' }, 500);

      try {
        const { id, title, content_json } = await request.json();
        if (!title || !content_json) return jsonRes({ error: 'Title and map content are required.' }, 400);

        const now = new Date().toISOString();
        let mapId = id || crypto.randomUUID();
        let shareId = crypto.randomUUID().slice(0, 8);

        if (id) {
          const existing = await env.DB.prepare('SELECT share_id FROM maps WHERE id = ? AND user_id = ?').bind(id, user.sub).first();
          if (existing) {
            shareId = existing.share_id;
            await env.DB.prepare('UPDATE maps SET title = ?, content_json = ?, updated_at = ? WHERE id = ? AND user_id = ?').bind(title, content_json, now, id, user.sub).run();
            return jsonRes({ success: true, map: { id, title, share_id: shareId, updated_at: now } });
          }
        }

        await env.DB.prepare('INSERT INTO maps (id, user_id, title, content_json, share_id, updated_at) VALUES (?, ?, ?, ?, ?, ?)').bind(mapId, user.sub, title, content_json, shareId, now).run();
        return jsonRes({ success: true, map: { id: mapId, title, share_id: shareId, updated_at: now } });
      } catch(err) {
        return jsonRes({ error: err.message || 'Failed to save map.' }, 500);
      }
    }

    if (url.pathname.startsWith('/api/maps/') && request.method === 'GET') {
      const user = await getAuthUser();
      if (!user) return jsonRes({ error: 'Unauthorized.' }, 401);
      if (!env.DB) return jsonRes({ error: 'D1 DB binding missing.' }, 500);

      const mapId = url.pathname.replace('/api/maps/', '').trim();
      const map = await env.DB.prepare('SELECT id, title, content_json, share_id, updated_at FROM maps WHERE id = ? AND user_id = ?').bind(mapId, user.sub).first();
      if (!map) return jsonRes({ error: 'Map not found.' }, 404);
      return jsonRes({ success: true, map });
    }

    if (url.pathname.startsWith('/api/maps/') && request.method === 'DELETE') {
      const user = await getAuthUser();
      if (!user) return jsonRes({ error: 'Unauthorized.' }, 401);
      if (!env.DB) return jsonRes({ error: 'D1 DB binding missing.' }, 500);

      const mapId = url.pathname.replace('/api/maps/', '').trim();
      await env.DB.prepare('DELETE FROM maps WHERE id = ? AND user_id = ?').bind(mapId, user.sub).run();
      return jsonRes({ success: true, id: mapId });
    }

    if (url.pathname.startsWith('/api/share/') && request.method === 'GET') {
      if (!env.DB) return jsonRes({ error: 'D1 DB binding missing.' }, 500);
      const shareId = url.pathname.replace('/api/share/', '').trim();

      const map = await env.DB.prepare('SELECT m.id, m.title, m.content_json, m.updated_at, u.name as owner_name FROM maps m LEFT JOIN users u ON m.user_id = u.id WHERE m.share_id = ?').bind(shareId).first();
      if (!map) return jsonRes({ error: 'Shared mind map not found.' }, 404);

      return jsonRes({ success: true, map });
    }

    // ── AI GENERATE ENDPOINT ──
    if (url.pathname === '/api/generate' && request.method === 'POST') {
      try {
        const { prompt } = await request.json();
        
        if (!prompt || typeof prompt !== 'string' || prompt.trim().length < 3) {
          return jsonRes({ error: 'Invalid or missing prompt' }, 400);
        }

        if (!env.GROQ_API_KEY) {
          return jsonRes({ error: 'GROQ_API_KEY environment variable is missing on Cloudflare Worker.' }, 500);
        }

        const systemInstruction = `You are a world-class domain expert and Master Mind Map Architect.
Your mission is to construct an exceptionally deep, accurate, multi-level mind map outline enriched with explanatory articles using ' :: Article text'.

STRICT STRUCTURAL & INDENTATION RULES:
1. ZERO DUPLICATION: Every node title MUST be 100% unique across the tree.
2. MULTI-LEVEL HIERARCHY (CRITICAL):
   - Line 1: Root Node (Main Topic :: High-level overview article)
   - Level 1 (1 Tab \\t): 5 to 6 Primary Category Branches :: Explanatory article
   - Level 2 (2 Tabs \\t\\t): 3 to 4 Sub-branches per category :: Explanatory article
   - Level 3 (3 Tabs \\t\\t\\t): 2 to 3 Leaf Nodes with concrete examples :: Explanatory article
3. FORMAT PER LINE:
   - Use 'Title :: Explanatory article text' on every line.
   - Use literal Tab characters (\\t) to define depth levels (Level 1 = 1 Tab, Level 2 = 2 Tabs, Level 3 = 3 Tabs).
4. LANGUAGE MATCHING:
   - Detect the prompt's language (Arabic, English, etc.) and generate ALL titles and articles in THAT language.
5. STRICT OUTPUT SYNTAX:
   - Output ONLY raw outline lines with tabs. No code blocks (\`\`\`), no numbers, no bullet symbols.`;

        const userPrompt = `Generate a master-level multi-level (3 levels deep with tabs \\t) mind map outline with explanatory articles (using ' :: Article text') for the topic:\n"${prompt.trim()}"`;

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
          return jsonRes({ error: data.error?.message || 'Groq API Communication Error across models' }, groqResponse ? groqResponse.status : 500);
        }

        const data = await groqResponse.json();
        const responseText = (data.choices[0]?.message?.content || '').trim();
        const cleanMarkup = responseText.replace(/```[a-z]*\n?/gi, '').replace(/```/g, '').trim();

        return jsonRes({
          success: true,
          provider: 'Cloudflare Worker + Groq',
          model: usedModel,
          topic: prompt.trim(),
          markup: cleanMarkup
        });

      } catch (err) {
        return jsonRes({ error: err.message || 'Server error' }, 500);
      }
    }

    return jsonRes({ error: 'Endpoint Not Found' }, 404);
  },
};
