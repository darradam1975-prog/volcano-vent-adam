# Adam The Volcano Vent Bot

A browser-based chat guide for **Volcano Vent Dice** — home-table rules, teach-by-questions mode, and age-verified pretend-bet chat for adults.

## Launch the app

| How | Link / action |
|-----|----------------|
| **Live on GitHub Pages** | **[Open Adam The Volcano Vent Bot](https://darradam1975-prog.github.io/volcano-vent-adam/)** |
| **Run locally (Windows)** | Double-click **[`preview.bat`](preview.bat)** — opens http://localhost:8765 |
| **Run locally (Mac/Linux)** | Clone the repo, then run `npm start` and open http://localhost:8765 |

```bash
git clone https://github.com/darradam1975-prog/volcano-vent-adam.git
cd volcano-vent-adam
npm start
```

No install required beyond Node.js — `npm start` uses `npx serve`.

## What works where

| Feature | GitHub Pages | GitHub Pages + [Cloudflare Worker](cloudflare/README.md) | Local (`npm start`) |
|---------|--------------|----------------------------------------------------------|---------------------|
| Rule-based Adam (full guide) | Yes | Yes | Yes |
| Teach mode, lore, pretend-bet rules | Yes | Yes | Yes |
| Conversation history (this device) | Yes | Yes | Yes |
| Export / Import chat bundle | Yes | Yes | Yes |
| OpenAI GPT proxy (your API key) | No | **Yes** | Yes* |
| Cloud sync | No | Yes** | No* |
| Create new share links | No | Yes** | No* |

\*Local: set `ADAM_CLOUD_API_BASE` in `js/cloud-config.js` to your Worker URL (or `http://localhost:8787` during `npm run worker:dev`).

\*\*Sync and share need a Cloudflare KV namespace on the Worker (optional; GPT `/chat` works without KV).

### Enable GPT on GitHub Pages

1. Deploy the Worker: `npm run worker:deploy` (see [cloudflare/README.md](cloudflare/README.md))
2. Paste the Worker URL into `js/cloud-config.js` → `ADAM_CLOUD_API_BASE`
3. Push to `main` — GitHub Pages picks up the config; paste your OpenAI key in **Settings**

## What it does

- Explains **Volcano Vent Dice** in plain English (Vent, countdown, lucky charm, 2+2+2, variants).
- **Lore** — why the Vent, crawling down the volcano, countdown story.
- **Teach mode** — brief summary, then learn by questions (not a lecture).
- **Pretend bets (18+)** — buttons, beads, and craft tokens only.
- English **text-to-speech** and conversation history on your device.

## Tests

```bash
npm test
```

Or:

```bash
node scripts/test-adam.mjs
node scripts/test-sync-merge.mjs
node scripts/test-share.mjs
node scripts/test-share-view.mjs
```

## GitHub Pages deploy

Pushes to `main` deploy automatically via [`.github/workflows/pages.yml`](.github/workflows/pages.yml).

If the live link 404s: open **Settings → Pages** on the repo and confirm **Source = GitHub Actions**, then re-run the **Deploy GitHub Pages** workflow under **Actions**.

## Project layout

| Path | Purpose |
|------|---------|
| `index.html` | App shell |
| `preview.bat` | One-click local launch (Windows) |
| `js/adam.js` | Rule-based bot logic |
| `js/cloud-config.js` | Cloudflare Worker URL (enables GPT on GitHub Pages) |
| `js/site-config.js` | Hosting + API routing |
| `cloudflare/` | Worker: `/chat`, `/sync`, `/share` |
| `js/rules.js` | Canonical rules + lore |

## Privacy

- Chats are **private by default** on your device.
- Birthday stays local. No data sold.

## Guardrails

- **Volcano Vent Dice only** — no other dice-game advice.
- **Betting** — pretend craft tokens only; no real money or casino play.