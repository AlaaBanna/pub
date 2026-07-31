# Deployment & Quality Assurance Workflow (`mind-map-deployer.md`)

This document defines the strict, step-by-step technical procedures for testing, version tagging, Cloudflare Worker deployment, and GitHub publishing for the `meta.fikra` Mind Map application.

---

## Workspace & Target Context

- **Local Repository Root**: `/Users/alaabanna/meta-fikra/pub`
- **Mind Map App Path**: `mindmap/`
- **GitHub Target Repository**: `https://github.com/AlaaBanna/pub.git` (`main` branch)
- **GitHub Pages Live App**: `https://alaabanna.github.io/pub/mindmap/`
- **Cloudflare Worker Service**: `metafikra-mindmap-ai` (`https://metafikra-mindmap-ai.alaabanna.workers.dev`)

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

## 2. Version Tagging & Timestamp Rules

Every modified entrypoint file must contain a standardized version comment header reflecting the current release version, ISO date/time, and feature summary.

### Tagging Format Rules
1. **JavaScript Files (`mindmap/js/main.js`)**:
   Add or update line 1:
   ```javascript
   // Version: vX.Y.Z | Updated: YYYY-MM-DD HH:MM | Features: Feature summary description
   ```

2. **HTML Files (`mindmap/index.html`)**:
   Add or update line 1:
   ```html
   <!-- Version: vX.Y.Z | Updated: YYYY-MM-DD HH:MM | Features: Feature summary description -->
   ```

---

## 3. Cloudflare Worker Deployment

When backend serverless logic (`mindmap/worker/worker.js`) or configuration (`mindmap/worker/wrangler.toml`) is modified, deploy to Cloudflare.

### Step 3.1: Environment Secrets (If Modifying Groq API Key)
If updating the backend API secret, upload `GROQ_API_KEY` to Cloudflare Worker secrets:

```bash
npx wrangler secret put GROQ_API_KEY --config mindmap/worker/wrangler.toml
```

### Step 3.2: Worker Deployment
Deploy the updated Cloudflare Worker script using Wrangler from the repository root (`/Users/alaabanna/meta-fikra/pub`):

```bash
npx wrangler deploy --config mindmap/worker/wrangler.toml
```

---

## 4. Git Versioning & GitHub Publishing

Once local testing and Cloudflare deployments pass successfully, commit and push to GitHub.

### Step 4.1: Inspect Git Status
Check working tree state:

```bash
git status
```

### Step 4.2: Stage & Commit Changes
Stage files under `mindmap/` and commit with a structured Conventional Commit message:

```bash
git add mindmap/
git commit -m "feat(mindmap): vX.Y.Z - Short feature summary description"
```

### Step 4.3: Push to Production Branch
Push local `main` branch directly to GitHub:

```bash
git push origin main
```
