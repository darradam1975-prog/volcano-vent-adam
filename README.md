# Adam The Volcano Vent Bot

A browser-based chat guide for **Volcano Vent Dice** — home-table rules, teach-by-questions mode, optional GPT polish, and age-verified pretend-bet chat for adults.

**Live app:** [volcano-vent-adam.netlify.app](https://volcano-vent-adam.netlify.app)

## What it does

- Explains **Volcano Vent Dice** in plain English (Vent, countdown, lucky charm, 2+2+2, variants).
- **Teach mode** — brief summary, then learn by questions (not a lecture).
- **Pretend bets (18+)** — only craft tokens: buttons, beads, seeds, pebbles, marbles, paper clips, jacks. House Rule 1 (return all) and House Rule 2 (unanimous napkin vote / keeper).
- Optional **OpenAI GPT** for plain-English answers; off-topic help stays brief and **never discusses other dice games**.
- English **text-to-speech**, conversation history, and optional Netlify Blobs sync.

## Run locally

Static site — open `index.html` in a browser, or serve the folder:

```bash
cd volcano-vent-adam
npx serve .
```

Optional GPT: add an OpenAI API key in **Settings** (stored on device only).

## Tests

```bash
node scripts/test-adam.mjs
node scripts/test-sync-merge.mjs
```

## Deploy (Netlify)

```bash
npx netlify-cli deploy --prod --dir .
```

## Project layout

| Path | Purpose |
|------|---------|
| `index.html` | App shell |
| `js/adam.js` | Rule-based bot logic |
| `js/llm.js` | Optional GPT layer |
| `js/rules.js` | Canonical Volcano Vent Dice rules |
| `scripts/test-adam.mjs` | Bot regression tests |

## Privacy

- Chats are **strictly confidential** — never shared with other users, like any private GPT session.
- Conversation history stays on your device unless you optionally sync with **your own** Sync ID (keep it secret).
- Birthday and API keys stay on your device only.

## Guardrails

- **Volcano Vent Dice only** — no Yahtzee, Craps, Farkle, or other dice-game advice.
- **Betting** — pretend antes with buttons, beads, and craft things only; no real money, poker chips, or casino play.