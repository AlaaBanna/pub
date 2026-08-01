# Deployment & Quality Assurance Workflow (`mind-map-deployer.md`)

This document defines the strict, step-by-step technical procedures for testing, version tagging, Cloudflare Worker deployment, Cloudflare Pages publishing, and GitHub version control for the Meta-Fikra Mind Map application.

---

## Workspace & Target Context

- **Local Repository Root**: `/Users/alaabanna/meta-fikra/pub`
- **Mind Map App Path**: `mindmap/`
- **Primary Production Domain**: `https://metafikra.com`
- **Cloudflare Pages Host**: `https://metafikra.pages.dev`
- **GitHub Target Repository**: `https://github.com/AlaaBanna/pub.git` (`main` branch)
- **GitHub Pages Fallback**: `https://alaabanna.github.io/pub/mindmap/`
- **Cloudflare Worker Backend API**: `metafikra-mindmap-ai` (`https://metafikra-mindmap-ai.alaabanna.workers.dev`)
- **Cloudflare D1 Database**: `metafikra-db` (`e20b926a-b69a-4e9e-94e7-5d5f4e5d78d2`)

---

## 1. Automated Testing & Syntax Verification

Before staging or deploying any changes, verify all JavaScript code syntax and API endpoint connectivity.

### Step 1.1: JavaScript Syntax Validation
Run Node syntax verification across all client-side JavaScript modules from the repository root (`/Users/alaabanna/meta-fikra/pub`):

```bash
node -c mindmap/js/main.js && \
node -c mindmap/js/actions.js && \
node -c mindmap/js/renderer.js && \
node -c mindmap/js/config.js && \
node -c mindmap/js/data.js && \
node -c mindmap/js/input.js && \
node -c mindmap/js/auth.js && \
node -c mindmap/js/layout.js
```

### Step 1.2: AI Backend Endpoint Health Verification
Verify live Cloudflare Worker API connectivity and AI output generation via `curl`:

```bash
curl -X POST https://metafikra-mindmap-ai.alaabanna.workers.dev/api/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Test Topic"}'
```

---

## 2. Version Tagging & Script Query Strings

Every modified entrypoint file must contain a standardized version tag to invalidate browser caches.

### Tagging Format Rules
Update script query strings in `mindmap/index.html`:
```html
<script src="js/main.js?v=X.Y.Z"></script>
```

---

## 3. Cloudflare Worker Backend Deployment

When backend serverless logic (`mindmap/worker/worker.js`) or configuration (`mindmap/worker/wrangler.toml`) is modified, deploy to Cloudflare Workers.

```bash
npx wrangler deploy --config mindmap/worker/wrangler.toml
```

---

## 4. Cloudflare Pages Frontend Deployment

Deploy static frontend assets to Cloudflare Pages (`metafikra.com` / `metafikra.pages.dev`):

```bash
cd mindmap && npx wrangler pages deploy . --project-name=metafikra
```

---

## 5. Git Versioning & GitHub Publishing

Once local testing and Cloudflare deployments pass successfully, commit and push to GitHub.

```bash
git add mindmap/ .agents/AGENTS.md
git commit -m "feat(mindmap): vX.Y.Z - Short feature summary description"
git push origin main
```
