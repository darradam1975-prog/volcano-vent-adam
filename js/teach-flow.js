/**
 * Teach by questions — brief summary first, then plain-English Q&A (not a lecture).
 */
const VOLCANO_VENT_TEACH = {
  briefSummary:
    '**Volcano Vent in one breath:** **6 dice** shared, **3 tokens** each, countdown **6→1**. '
    + 'Miss a number → **Vent** → your **lucky charm** saves you or you lose a token. **Last tokens wins.**',
  teachNote:
    'I teach by **questions**, not a lecture — ask anything in plain English, or pick a starter below.',
  categories: [
    {
      id: 'basics',
      label: 'Basics',
      starters: ['What do I need to play?', 'How many players?', 'How many dice?']
    },
    {
      id: 'countdown',
      label: 'Countdown',
      starters: ['How does the countdown work?', 'Can three dice equal 6?', 'What happens after 1?']
    },
    {
      id: 'vent',
      label: 'Vent',
      starters: ['What happens on the Vent?', 'What is a rescue roll?']
    },
    {
      id: 'lucky_charm',
      label: 'Lucky charm',
      starters: ['What is a lucky charm?', 'Who rolls after a lucky charm save?']
    },
    {
      id: 'scoring',
      label: 'Scoring',
      starters: ['How does scoring work?', 'Who wins?', 'How many rounds?']
    },
    {
      id: 'variants',
      label: 'Game modes',
      starters: ['Can kids play?', 'What is the short game?', 'What is gentle Vent?']
    },
    {
      id: 'house_rules',
      label: 'House rules',
      starters: ['What is House Rule 1?', 'What is a napkin vote?', 'How do we decide?']
    },
    {
      id: 'antes',
      label: 'Antes & craft tokens',
      starters: ['How do beads work?', 'How do buttons work?', 'How do antes work?', 'What can be used for bets?']
    },
    {
      id: 'keeper',
      label: 'Keeper & safety',
      starters: ['When is keeper okay?', 'When should we avoid House Rule 2?', 'No chasing losses?']
    }
  ],
  nextByCategory: {
    basics: '**Try next:** "How does the countdown work?"',
    countdown: '**Try next:** "What happens on the Vent?"',
    vent: '**Try next:** "What is a lucky charm?"',
    lucky_charm: '**Try next:** "How does scoring work?"',
    scoring: '**Try next:** "Can kids play?" or house-rules questions if **18+**.',
    variants: '**Try next:** "What is House Rule 1?" (pretend bets, **18+** only).',
    house_rules: '**Try next:** "How do antes work?"',
    antes: '**Try next:** "When should we avoid House Rule 2?"',
    keeper: '**Try next:** say **"teach menu"** for another topic, or ask your own question.',
    general: '**Try next:** pick any starter from **"teach menu"**.'
  }
};

/** Plain-English questions → short answer + category (for teach flow). */
const VOLCANO_VENT_TEACH_QA = [
  { cat: 'basics', test: m => /what\s+do\s+(?:i|we)\s+need|need\s+to\s+play|setup|set\s*up/.test(m) && !/gold|craft/.test(m),
    answer: '**You need:** 6 d6 dice, 3 tokens per player, paper for lucky charms (**1–6**). Pick who goes first, then roll all **6** for tribute **6**.' },
  { cat: 'basics', test: m => /how\s+many\s+player/.test(m),
    answer: '**2 or more** players. Sweet spot **3–6**. Still only **6 dice total** for the whole table.' },
  { cat: 'basics', test: m => /how\s+many\s+dice/.test(m),
    answer: '**Six d6 dice** — shared by everyone, not six per person.' },
  { cat: 'basics', test: m => /how\s+many\s+token/.test(m) && !/pretend|ante|bet/.test(m),
    answer: '**Three tokens** per player. Lose **one** only when you **fail** a Vent rescue.' },
  { cat: 'countdown', test: m => /how\s+(?:does|do)\s+(?:the\s+)?countdown|6.*5.*4|target\s+number/.test(m),
    answer: 'Countdown **6→5→4→3→2→1**. Pay each with a die or **sum**, set those dice aside, pass the rest. After **1**, all dice return — **next player** starts at **6**.' },
  { cat: 'countdown', test: m => /can\s+(?:three|3)\s+dice|2[\s-]*2[\s-]*2/.test(m),
    answer: '**Yes — 2+2+2=6** uses three dice. **3 dice** pass on; next target is **5**.' },
  { cat: 'countdown', test: m => /after\s+(?:you\s+)?(?:hit|make)\s+(?:a\s+)?1|what\s+after\s+1/.test(m),
    answer: 'After tribute **1**, all **6 dice** return, reset to **6**, **next player** rolls.' },
  { cat: 'countdown', test: m => /do\s+sums?\s+count/.test(m),
    answer: '**Yes** — use as many dice as needed if they add to the target.' },
  { cat: 'vent', test: m => /charm.*(?:miss|failed|vent)|miss.*charm|automatic.*safe|reroll.*charm|two\s+rolls?.*charm/.test(m),
    answer: '**Two rolls:** miss puts you on the **Vent**. Charm in the miss roll does **not** auto-save unless it paid the tribute. **Rescue roll** (reroll same dice count) — charm there → safe; no charm → **lose 1 token**.' },
  { cat: 'vent', test: m => /what\s+(?:is|happens)\s+(?:on\s+)?(?:the\s+)?vent|miss\s+the/.test(m),
    answer: '**Miss the target** → **Vent** (even on the **first roll** for tribute **6**). **Rescue reroll:** roll the **same dice count again** — fresh roll. Charm on **rescue** saves you; miss rescue → **lose 1 token**. All **6** back, **next player** at **6**.' },
  { cat: 'vent', test: m => /first\s+roll.*vent|wind\s+up\s+on.*vent|vent.*first\s+roll|opening\s+roll.*vent/.test(m),
    answer: '**Yes — first-roll Vent is real.** Open with all **6** for tribute **6**; miss → **Vent**. **Rescue reroll** all **6** again. Lucky charm on **rescue** saves you; miss rescue → **lose 1 token**.' },
  { cat: 'vent', test: m => /rescue\s+roll/.test(m),
    answer: '**Reroll** the same number of dice you failed with. Your **lucky charm** on **this rescue roll** → safe. No charm → lose **1 token**.' },
  { cat: 'lucky_charm', test: m => /what\s+(?:is\s+)?(?:a\s+)?lucky\s+charm|charm\s+number/.test(m),
    answer: 'Pick **1–6** at setup, write on **paper**, keep all game. Matters on **Vent** rescues only.' },
  { cat: 'lucky_charm', test: m => /who\s+(?:gets?|rolls?).*(?:6\s+dice|dice|restart)|lucky\s+charm.*who/.test(m),
    answer: 'All **6 dice** return to the pool — **next player** rolls at **6**. The rescuer does **not** roll again.' },
  { cat: 'scoring', test: m => /how\s+(?:does|do)\s+scor|keep\s+score/.test(m),
    answer: '**Only Vent tokens count** — start with **3**, lose **1** on failed rescue. Countdown and charms are **not** points.' },
  { cat: 'scoring', test: m => /who\s+win/.test(m),
    answer: '**Last player with tokens wins.**' },
  { cat: 'scoring', test: m => /how\s+many\s+round/.test(m),
    answer: '**No fixed rounds** — play until one player has tokens left. One **chain** = countdown **6→1** (or until a Vent).' },
  { cat: 'variants', test: m => /kid|child|paper\s+lives/.test(m),
    answer: '**8+** with **paper lives** (stickers) for kids — no pretend bets. Adults can use tokens or optional **18+** antes.' },
  { cat: 'variants', test: m => /short\s+game|2\s+token/.test(m),
    answer: '**Short game:** **2 tokens** each instead of 3 — faster night.' },
  { cat: 'variants', test: m => /gentle\s+vent/.test(m),
    answer: '**Gentle Vent:** lose a token only on the **second** failed rescue **in a row**.' },
  { cat: 'house_rules', test: m => /house\s+rule\s*1|return\s+all/.test(m) && !/house\s+rule\s*2/.test(m),
    answer: '**House Rule 1 (default):** everyone gets every craft token back after play. Winner = last **Vent tokens**.' },
  { cat: 'keeper', test: m => /avoid\s+house\s+rule\s*2|when.*avoid.*(?:house\s+rule\s*2|keeper)|keeper\s+not/.test(m),
    answer: '**Avoid House Rule 2** when anyone hesitates, kids are present, mood is tense, or someone mentioned **chasing losses** / **double-or-nothing**.' },
  { cat: 'keeper', test: m => /chas(?:e|ing)\s+loss|double[\s-]?or[\s-]?nothing/.test(m),
    answer: '**No chasing losses, no double-or-nothing.** Use **return-all** or drop antes if the bowl feels heavy.' },
  { cat: 'house_rules', test: m => /house\s+rule\s*2|keeper\s+pot/.test(m) && !/avoid|skip|when\s+(?:to|should)/.test(m),
    answer: '**House Rule 2:** winner may keep ante bowl only after **unanimous napkin vote** before the first roll.' },
  { cat: 'house_rules', test: m => /napkin\s+vote|what\s+is\s+(?:a\s+)?napkin/.test(m),
    answer: '**Napkin vote:** write rules before first roll; **every player** takes part. Keeper needs **all yes**.' },
  { cat: 'house_rules', test: m => /how\s+(?:do|does)\s+we\s+decide/.test(m),
    answer: 'Pass a **napkin** — ante size, return-all or keeper. **Everyone** votes; keeper = **unanimous yes** only.' },
  { cat: 'antes', test: m => /how\s+(?:do|does)\s+antes?\s+work/.test(m),
    answer: 'Drop agreed craft tokens when countdown **resets to 6** — not every roll. Separate from **Vent tokens**.' },
  { cat: 'antes', test: m => /how\s+do\s+beads?\s+work|what\s+do\s+beads?\s+do/.test(m) && !/button/.test(m),
    answer: '**Beads** = craft pretend tokens in a shared bowl — optional **antes** when countdown resets to **6**. Separate from your **3 Vent tokens**. Default: **return all** after play.' },
  { cat: 'antes', test: m => /how\s+do\s+buttons?\s+work|what\s+do\s+buttons?\s+do/.test(m) && !/bead/.test(m),
    answer: '**Buttons** = sewing buttons (any size) for pretend **antes** — same bowl rules as beads. **Vent tokens** still track who is in. Default: **House Rule 1** (return all).' },
  { cat: 'antes', test: m => /what\s+can\s+(?:be|i|we)\s+use\s+for\s+(?:bets?|antes?)/.test(m),
    answer: 'Beads, buttons, seeds, pebbles, clips, **marbles**, jacks — **never poker chips** or cash.' },
  { cat: 'keeper', test: m => /when\s+(?:is\s+)?keeper\s+okay|keeper\s+okay/.test(m),
    answer: 'Keeper OK: **adults-only**, **unanimous napkin vote**, tiny craft tokens, relaxed table.' }
];

function formatTeachStartMarkdown() {
  const t = VOLCANO_VENT_TEACH;
  let out = `${t.briefSummary}\n\n${t.teachNote}\n\n**Pick a topic — ask in plain English:**\n`;
  t.categories.forEach(c => {
    out += `\n**${c.label}:** ${c.starters.map(s => `"${s}"`).join(' · ')}`;
  });
  out += '\n\nSay **"teach menu"** anytime to see this list. Say **"full rules"** only if you want the long lecture.';
  return out;
}

function formatTeachMenuMarkdown() {
  return formatTeachStartMarkdown();
}

function matchTeachQuestion(message) {
  const m = String(message || '').toLowerCase().trim();
  for (const item of VOLCANO_VENT_TEACH_QA) {
    if (item.test(m)) {
      const next = VOLCANO_VENT_TEACH.nextByCategory[item.cat] || VOLCANO_VENT_TEACH.nextByCategory.general;
      return { answer: item.answer, next, category: item.cat };
    }
  }
  return null;
}

function formatTeachAnswer(message) {
  const hit = matchTeachQuestion(message);
  if (!hit) return null;
  const offer = /example|try next|say\s+\*\*?(?:yes|sure)/i.test(hit.next)
    ? hit.next
    : `${hit.next}\n\nWant a **mini example**? Reply **yes** or **sure**.`;
  return `${hit.answer}\n\n${offer}`;
}

if (typeof globalThis !== 'undefined') {
  globalThis.VOLCANO_VENT_TEACH = VOLCANO_VENT_TEACH;
  globalThis.formatTeachStartMarkdown = formatTeachStartMarkdown;
  globalThis.formatTeachMenuMarkdown = formatTeachMenuMarkdown;
  globalThis.matchTeachQuestion = matchTeachQuestion;
  globalThis.formatTeachAnswer = formatTeachAnswer;
}