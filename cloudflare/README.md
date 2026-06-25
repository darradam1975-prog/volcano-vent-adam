# Cloudflare Worker — Adam API (GitHub Pages backend)

GitHub Pages serves the static app. This Worker handles:

| Route | Purpose | Needs KV? |
|-------|---------|-----------|
| `POST /chat` | OpenAI proxy (your API key from Settings) | No |
| `GET/POST /sync` | Conversation sync by Sync ID | Yes |
| `GET/POST/DELETE /share` | Public read-only share links | Yes |
| `GET /health` | Health check | No |

## 1. Deploy the Worker (GPT only — no KV)

```bash
cd volcano-vent-adam
npx wrangler login
npx wrangler deploy
```

Copy the URL Wrangler prints, e.g. `https://volcano-vent-adam-api.<you>.workers.dev`.

## 2. Wire GitHub Pages to the Worker

Edit [`js/cloud-config.js`](../js/cloud-config.js):

```js
const ADAM_CLOUD_API_BASE = 'https://volcano-vent-adam-api.<you>.workers.dev';
```

Commit and push to `main`. GitHub Pages redeploys; GPT works on the live site.

## 3. Optional — sync & share (KV)

```bash
npx wrangler kv namespace create ADAM_KV
```

Uncomment the `[[kv_namespaces]]` block in [`wrangler.toml`](../wrangler.toml) and paste the namespace `id`.

Optional — set your public site URL for share links:

```toml
[vars]
ADAM_SITE_BASE = "https://darradam1975-prog.github.io/volcano-vent-adam"
```

Redeploy:

```bash
npx wrangler deploy
```

## 4. Local dev

```bash
npx wrangler dev
```

Point `ADAM_CLOUD_API_BASE` at `http://localhost:8787` while testing.

## Privacy

- **Chat:** Your OpenAI key is sent from the browser to this Worker, then to OpenAI. The Worker does not store keys.
- **Sync/share:** Data is stored in your Cloudflare KV namespace under user-chosen IDs.