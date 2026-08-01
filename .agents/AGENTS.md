# Agent Rules for `pub/mindmap` (Meta-Fikra)

## Production Infrastructure & URLs
- **Primary Production Domain**: `https://metafikra.com`
- **Cloudflare Pages Host**: `https://metafikra.pages.dev`
- **GitHub Pages Target**: `https://alaabanna.github.io/pub/mindmap/`
- **Cloudflare Worker API**: `https://metafikra-mindmap-ai.alaabanna.workers.dev`
- **Cloudflare D1 Database**: `metafikra-db` (`e20b926a-b69a-4e9e-94e7-5d5f4e5d78d2`)

## Automated Deployment Shortcut Command
Whenever the user says "deploy", "deployyy", "publish", or asks to deploy the mindmap project, automatically follow the exact 5-step workflow defined in `mindmap/mind-map-deployer.md`:

1. **Run Testing Script**:
   Run syntax verification on all JS files (`node -c mindmap/js/...`) and test the live Cloudflare Worker API.
2. **Tag Version Headers**:
   If version bump or timestamp updates are needed, update script query strings (`?v=X.Y.Z`) in `index.html`.
3. **Deploy Cloudflare Worker (If Worker Modified)**:
   Run `npx wrangler deploy --config mindmap/worker/wrangler.toml` from repo root if `mindmap/worker/` files changed.
4. **Deploy Cloudflare Pages**:
   Run `cd mindmap && npx wrangler pages deploy . --project-name=metafikra` to deploy static frontend assets to Cloudflare Pages (`metafikra.com` & `metafikra.pages.dev`).
5. **Deploy to GitHub**:
   Run `git status`, auto-generate a Conventional Commit message based on `git diff`, commit, and run `git push origin main`.
