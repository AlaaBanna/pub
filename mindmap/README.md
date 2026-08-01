# 🧠 Meta-Fikra Mind Map (ميتاـفكرة)

> An organic, ultra-fast, interactive Mind Map builder powered by AI, serverless Cloudflare Workers, and native HTML5 Canvas rendering with rich Markdown article support.

[![Production](https://img.shields.io/badge/Production-metafikra.com-gold?style=for-the-badge&logo=cloudflare)](https://metafikra.com)
[![Host](https://img.shields.io/badge/Cloudflare_Pages-metafikra.pages.dev-orange?style=for-the-badge&logo=cloudflare)](https://metafikra.pages.dev)
[![Worker API](https://img.shields.io/badge/Worker_API-metafikra--mindmap--ai-blue?style=for-the-badge&logo=cloudflareworkers)](https://metafikra-mindmap-ai.alaabanna.workers.dev)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

---

## 🌟 Overview

**Meta-Fikra Mind Map** is a modern, high-performance web application designed for conceptual exploration, knowledge organization, and AI-assisted mind mapping. It features a signature **organic bacterial node morphing** canvas, **$O(1)$ constant-time data lookups**, **zero-idle CPU usage**, **rich Markdown articles per node**, and full **RTL Arabic / LTR English** support.

---

## ✨ Key Features

- **⚡ Ultra-Fast Canvas Renderer**: High-FPS HTML5 canvas rendering with $O(1)$ node index mapping and pre-calculated text line layout caching.
- **🤖 AI Map Generation**: Turn any concept or prompt into a multi-level structured mind map with detailed explanatory articles powered by **Groq Llama 3.3 70B**.
- **📖 Rich Node Articles & EasyMDE Editor**: Attach markdown articles to any node. Reads are tracked per-visitor locally (`mf_read_articles`).
- **☁️ Cloud Maps Sync & Sharing**: Authenticate via JWT or Google OAuth 2.0 to save mind maps to Cloudflare D1 SQL database and generate read-only shareable links.
- **🌐 Full Arabic (RTL) & English (LTR) Support**: Native right-to-left UI with one-click language switching.
- **🎹 Universal Keyboard & UX Shortcuts**: Universal `Escape` handler to close modals, drawers, and search; instant shortcuts (`Tab`, `Enter`, `Space`, `Ctrl+S`, `Ctrl+Z`).
- **🌙 Glassmorphic Dark Theme**: Modern slate dark theme UI palette.

---

## 📂 Project Architecture & Modules

```
mindmap/
├── index.html                 # Main application entry point & modal layouts
├── design.css                 # Master Design System (CSS tokens, animations, themes)
├── meta.css                   # Header & shared brand styling
├── mind-map-deployer.md       # Automated Cloudflare & GitHub deployment specification
├── docs/                      # Technical Documentation
│   ├── ARCHITECTURE.md        # Technical architecture, module map & DB schemas
│   └── FUNCTIONALITIES.md     # Complete functional guide & shortcut matrix
├── js/                        # Client-Side JavaScript Modules
│   ├── config.js              # Configuration tokens, colors & animation parameters
│   ├── data.js                # Tree data models, .mt parser/serializer & O(1) index map
│   ├── layout.js              # Radial & organic tree layout positioning algorithms
│   ├── renderer.js            # HTML5 Canvas rendering loop, vector badges & line cache
│   ├── actions.js             # Undo/redo stack, node CRUD, Cloud sync & AI generator
│   ├── input.js               # Keyboard shortcuts & canvas pan/zoom gesture handlers
│   ├── auth.js                # JWT session management & Google OAuth 2.0 integration
│   └── main.js                # UI event bindings, header controls & universal modal manager
└── worker/                    # Serverless Cloudflare Worker Backend
    ├── worker.js              # AI generator endpoint, Auth routes & D1 SQL handlers
    └── wrangler.toml          # Cloudflare Worker & D1 binding configuration
```

For complete technical specifications, view:
- 📖 [Technical Architecture Specification](docs/ARCHITECTURE.md)
- 🛠️ [Functional Guide & User Manual](docs/FUNCTIONALITIES.md)

---

## 🚀 Quick Start (Local Development)

Because Meta-Fikra is built with native client-side web technologies, you can serve it locally using any static web server:

```bash
# Clone repository
git clone https://github.com/AlaaBanna/pub.git
cd pub/mindmap

# Serve using Python, Node, or Live Server
npx serve .
# Or Python 3
python3 -m http.server 3000
```

Open `http://localhost:3000` in your browser.

---

## 🛠️ Automated Deployment Workflow

To deploy updates to production, follow the 5-step workflow defined in `mind-map-deployer.md`:

```bash
# 1. Verify JavaScript syntax
node -c js/main.js && node -c js/actions.js && node -c js/renderer.js && node -c js/auth.js

# 2. Deploy Cloudflare Pages (Frontend)
npx wrangler pages deploy . --project-name=metafikra

# 3. Deploy Cloudflare Worker Backend (if worker updated)
npx wrangler deploy --config worker/wrangler.toml

# 4. Commit and Push to GitHub
git add .
git commit -m "feat(mindmap): release summary"
git push origin main
```

---

## 🌐 Live Production Deployment

- **Primary Domain**: [https://metafikra.com](https://metafikra.com)
- **Cloudflare Pages**: [https://metafikra.pages.dev](https://metafikra.pages.dev)
- **Worker API**: `https://metafikra-mindmap-ai.alaabanna.workers.dev`
