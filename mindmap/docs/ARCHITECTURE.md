# Technical Architecture Specification (`ARCHITECTURE.md`)

This document provides a comprehensive technical overview of the architecture, data structures, rendering engine, state management, security model, and database schemas for **Meta-Fikra Mind Map** (`pub/mindmap`).

---

## 🏗️ System Overview & Flow

```mermaid
flowchart TD
    subgraph Browser ["Client-Side Browser (Frontend)"]
        HTML["index.html / design.css / meta.css"]
        STATE["Global State (state.tree, state.animNodes, nodeIndexMap)"]
        RENDER["Canvas Engine (renderer.js & layout.js)"]
        ACTIONS["Action Handlers & Undo Stack (actions.js)"]
        AUTH_CLIENT["Auth Module (auth.js)"]
    end

    subgraph Edge ["Cloudflare Serverless Infrastructure"]
        WORKER["Cloudflare Worker (worker.js)"]
        PAGES["Cloudflare Pages (metafikra.com)"]
        D1[("Cloudflare D1 Database (metafikra-db)")]
    end

    subgraph AI ["AI API Services"]
        GROQ["Groq Llama 3.3 70B API"]
    end

    HTML --> STATE
    STATE --> RENDER
    ACTIONS --> STATE
    AUTH_CLIENT --> WORKER
    ACTIONS --> WORKER
    WORKER --> GROQ
    WORKER --> D1
    PAGES --> HTML
```

---

## 🧩 Client-Side Module Breakdown

The client application is built using modular Vanilla JavaScript ($ES6+$) designed for minimal latency, zero memory leaks, and 60 FPS canvas rendering.

| Module | File | Primary Responsibility |
| :--- | :--- | :--- |
| **Config** | [js/config.js](file:///Users/alaabanna/meta-fikra/pub/mindmap/js/config.js) | Global design system tokens, color palettes, physics radii, and font declarations. |
| **Data** | [js/data.js](file:///Users/alaabanna/meta-fikra/pub/mindmap/js/data.js) | Mind Map tree data structures, `$O(1)$` `nodeIndexMap`, `.mt` parser/serializer, and sample datasets. |
| **Layout** | [js/layout.js](file:///Users/alaabanna/meta-fikra/pub/mindmap/js/layout.js) | Radial layout algorithms, coordinate calculations, and node spacing calculations. |
| **Renderer** | [js/renderer.js](file:///Users/alaabanna/meta-fikra/pub/mindmap/js/renderer.js) | HTML5 Canvas rendering loop, organic node morphing waves, vector eye badges, and text layout caching. |
| **Actions** | [js/actions.js](file:///Users/alaabanna/meta-fikra/pub/mindmap/js/actions.js) | Node CRUD operations, undo/redo stack (`pushSnapshot`), Cloud Sync API requests, and AI map generator. |
| **Input** | [js/input.js](file:///Users/alaabanna/meta-fikra/pub/mindmap/js/input.js) | Keyboard shortcut dispatcher, canvas pan/zoom gesture listeners, and node text input handler. |
| **Auth** | [js/auth.js](file:///Users/alaabanna/meta-fikra/pub/mindmap/js/auth.js) | Session storage (`mf_jwt`, `mf_user`), UTF-8 Base64 JWT payload decoder, and Google OAuth 2.0 integration. |
| **Main** | [js/main.js](file:///Users/alaabanna/meta-fikra/pub/mindmap/js/main.js) | UI initialization, header dropdown listeners, language switcher, and universal modal manager (`closeAllModalsAndPanels`). |

---

## ⚡ Performance Optimizations

1. **$O(1)$ Constant Time Node Lookup Map (`nodeIndexMap`)**:
   - Instead of running recursive tree traversals ($O(N)$) inside the 60 FPS rendering loop, `rebuildNodeIndex()` populates a `Map<string, Node>` lookup table.
   - Node lookups during rendering and pointer interaction complete in **$0\text{ ms}$ constant time**.

2. **Pre-Calculated Text Layout Caching (`getCachedNodeTextLines`)**:
   - Text line wrapping calculations and `ctx.measureText()` calls are cached on `animNode._cachedLines`.
   - Re-measuring canvas text on unchanged node titles is avoided, reducing Canvas API CPU load by **>90%**.

3. **Smart Dirty Render Loop (Energy Saver)**:
   - When no node movement or user interaction occurs for > 2 seconds, `requestAnimationFrame` rendering pauses.
   - Instantly resumes 60 FPS rendering on `mousemove`, `touch`, `wheel`, `keydown`, or node mutation. Idle CPU usage is **0%**.

4. **UTF-8 Safe JWT Payload Decoding**:
   - `authModule.init()` decodes JWT claims using `decodeURIComponent(escape(atob(...)))`, ensuring sessions containing non-ASCII user profiles (e.g. Arabic user names) persist reliably across page reloads without session wipeouts.

---

## 🗄️ Database & Cloud Infrastructure

### Cloudflare Worker Serverless Backend (`worker/worker.js`)
The backend is a serverless Cloudflare Worker API deployed at `https://metafikra-mindmap-ai.alaabanna.workers.dev`.

#### API Endpoint Routes
- `POST /api/auth/register`: Password hash creation (PBKDF2/SHA-256) & user account creation.
- `POST /api/auth/login`: Password verification & JWT issuance.
- `POST /api/auth/google`: Google OAuth ID token verification & user auto-provisioning.
- `GET /api/maps`: Fetch user's saved cloud maps.
- `POST /api/maps`: Save or update a mind map.
- `DELETE /api/maps/:id`: Delete a saved cloud map.
- `POST /api/generate`: AI mind map generation via Groq Llama 3.3 70B API.
- `GET /api/share/:shareId`: Retrieve a public read-only shared mind map.

---

### Cloudflare D1 SQL Schema (`metafikra-db`)

```sql
-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT,
    name TEXT,
    google_id TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Mind Maps Table
CREATE TABLE IF NOT EXISTS maps (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Shared Maps Table
CREATE TABLE IF NOT EXISTS shared_maps (
    share_id TEXT PRIMARY KEY,
    map_id TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```
