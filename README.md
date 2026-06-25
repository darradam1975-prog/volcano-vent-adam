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

| Feature | GitHub Pages | Local (`npm start` / `preview.bat`) |
|---------|--------------|-------------------------------------|
| Rule-based Adam (full guide) | Yes | Yes |
| Teach mode, lore, pretend-bet rules | Yes | Yes |
| Conversation history (this device) | Yes | Yes |
| Export / Import chat bundle | Yes | Yes |
| OpenAI GPT proxy | No | No* |
| Cloud sync | No | No* |
| Create new share links | No | No* |

\*GPT, cloud sync, and creating share links need a Netlify-style backend. The **rule-based bot is the main experience** on GitHub Pages and locally.

Old share links may still load via the legacy Netlify read API.

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

First time: in the repo on GitHub go to **Settings → Pages** and set source to **GitHub Actions** (if not already enabled).

## Project layout

| Path | Purpose |
|------|---------|
| `index.html` | App shell |
| `preview.bat` | One-click local launch (Windows) |
| `js/adam.js` | Rule-based bot logic |
| `js/site-config.js` | GitHub Pages vs Netlify detection |
| `js/rules.js` | Canonical rules + lore |

## Privacy

- Chats are **private by default** on your device.
- Birthday stays local. No data sold.

## Guardrails

- **Volcano Vent Dice only** — no other dice-game advice.
- **Betting** — pretend craft tokens only; no real money or casino play.