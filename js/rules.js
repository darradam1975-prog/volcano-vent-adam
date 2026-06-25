/**
 * Volcano Vent Dice — correct rules for Adam.
 * Classic Volcano countdown (6 dice, lucky charm, token sacrifice) — not auto-generated filler.
 */
const VOLCANO_VENT_GAME = {
  id: 'volcano_vent_dice',
  name: 'Volcano Vent Dice',
  aliases: ['volcano vent dice', 'volcano vent', 'volcano dice', 'vent dice'],
  players: '2 or more',
  dice: '6 standard six-sided dice (d6)',
  tokens: '3 buttons, beads, or chips per player from a shared bowl',
  difficulty: 'Medium',
  ages: '8+ (paper lives for younger kids — no token loss)',
  summary:
    'Roll a **6→5→4→3→2→1** countdown with six dice. Miss your number and you stand on the **Vent** — rescue yourself with your **lucky charm** or sacrifice a token. Last player with tokens wins.',
  setup: [
    '**6 standard d6 dice** and **3 tokens** per player (buttons, beads, chips from a shared bowl).',
    'Each player picks a **lucky charm** number (**1–6**) for the whole game — duplicates are fine. Everyone writes theirs on a **piece of paper**; the group remembers who has which number.',
    'Pick who goes first — youngest or roll for it.',
    '**Kids at the table:** use paper lives or stickers instead of losing tokens — no pretend bets.',
    '**18+ pretend bets:** equal stacks; agree **House Rule 1** (return all) or **House Rule 2** (keeper pot) before the first roll.'
  ],
  turnFlow: [
    '**Start at 6:** first player rolls **all 6 dice** trying to roll a **6**, or dice that **add up to 6**. **Miss on this opening roll?** You can **wind up on the Vent immediately** — then take a **rescue reroll** (same dice count) for your lucky charm.',
    '**Three dice can count:** **2+2+2=6** — set all **three** twos aside as tribute; **three dice remain** for the next player.',
    'Use **as many dice as you need** (1, 2, 3, or more) as long as their **sum equals the target** — then set only those aside.',
    '**No dice left to pass?** Next player cannot hit the next countdown number with zero dice — that is a **miss** → **Vent** (0-dice rescue usually fails → lose 1 token) → **all 6 dice return** and reset to **6**.',
    'Next player rolls the **remaining** dice trying for **5** (one die showing 5, or a sum like **2+3**).',
    'Pass down the countdown: **6 → 5 → 4 → 3 → 2 → 1**.',
    'After **1** is made, restart at **6** with **all 6 dice** and the **next player**.',
    '**Miss the mark:** if you cannot hit the target, you are on the **Vent** edge.',
    '**Rescue roll:** after a miss, roll **again** the **same number of dice** you failed with — **not** a check of the miss roll. If **your lucky charm** appears on **this rescue roll**, you are **safe** (no token lost; all 6 dice back; reset to **6**). Charm in the miss roll does **not** auto-save unless it paid the tribute. No charm on rescue → lose **1 token**.',
    '**Saved:** restart at 6 with all dice; next player.',
    '**Sacrificed:** lose **1 token**; restart at 6 with all dice; next player.',
    'No tokens left? You are out. **Last player with tokens wins.**'
  ],
  scoring: {
    track: '3 tokens per player',
    rule: 'Lose 1 token each time you fail the lucky-charm rescue on the Vent. Paper lives work the same for kids.'
  },
  winning: 'Last player with any tokens remaining wins.',
  variants: [
    '**Paper lives** — kids lose a sticker instead of a bead.',
    '**Short game** — **2 tokens** each instead of 3.',
    '**Gentle Vent** — only lose a token on the second failed rescue in a row.',
    '**18+ pretend bets** — small antes per countdown; return-all default; keeper pot if everyone agrees.'
  ],
  tips: {
    beginner: [
      'Write the **6→1 countdown** on paper so everyone sees the target each pass.',
      'Your **lucky charm** is your escape number — pick it once, **write it on paper**, and let the group remember it.',
      'Adding dice is allowed — **2+2+2=6** uses three dice; **4+2=6** uses two. Ask: "How many dice can equal 6?"',
      'After **2-2-2**, three dice pass on — next target is **5**, not 6.'
    ],
    intermediate: [
      'Buttons and beads from a bowl make sacrifices tangible — craft tokens only, never cash.',
      'Teach sum shortcuts when several dice stay in play.',
      'Compare to **Going to Boston** for another family scoring night.'
    ],
    advanced: [
      'Agree **House Rule 1** (return all) or **House Rule 2** (keeper pot) on a napkin before play.',
      'If anyone is unsure about keeper mode, use return-all — it is just a game.',
      'Discuss rescue odds when 4–5 dice remain on a failed countdown step.'
    ]
  }
};

/**
 * Table lore & terminology — the Volcano metaphor (flavor, not extra rules).
 */
const VOLCANO_VENT_LORE = {
  tagline: 'A home-table story: six dice, a shared volcano, and a dangerous rim called the Vent.',
  whyVent:
    '**Why "the Vent"?** On a real volcano, the **vent** is the opening where heat and pressure escape — the throat of the mountain. In this game, when you **miss a countdown tribute**, you are not inside the lava yet; you are on the **narrow rim** right over that opening. One shaky **rescue roll** decides whether your **lucky charm** pulls you back or you **sacrifice a token** into the heat.',
  ventEdge:
    '**On the edge?** Yes — that is the picture. You are standing on the **Vent lip** with dice still in your hand for the **rescue reroll**. The table might say *"you are on the Vent"* the way hikers say *"you are on the ledge."* You are one good roll from safety, one bad roll from losing a token.',
  countdown:
    '**What is the countdown?** The numbers **6→5→4→3→2→1** are **rings down the volcano** — each tribute is another step deeper into the cone. Roll a **6** (or dice that sum to 6) and you have paid the top shelf; pass the remaining dice and the next player pays **5**, then **4**, and so on. After **1**, you have touched the bottom of this descent — all **6 dice** climb back to the rim and the **next player** starts a fresh climb at **6**.',
  crawling:
    '**Crawling down the volcano?** That is the **table story**, not a physical crawl. Nobody leaves their chair — but together you are **descending** the mountain number by number. Miss a step and you slip onto the **Vent edge**; make every tribute and the shared dice pool **crawls deeper** until someone reaches **1** or a miss sends someone to the Vent.',
  name:
    '**Volcano Vent Dice** = **Volcano** (the shared mountain you descend) + **Vent** (the dangerous rim when you miss) + **Dice** (the tributes you offer each step). It is a family scoring game dressed in volcano language so misses feel dramatic, not punitive.',
  luckyCharm:
    '**Lucky charm lore:** Pick **1–6** once and write it on paper — that is your **pocket charm** for the whole night. It does not help on normal tribute rolls; it only answers when you are **on the Vent** and take the **rescue reroll**. Roll your charm there and the table imagines you **grabbed the rim** and climbed back.',
  tokens:
    '**Tokens & sacrifice:** Your **3 tokens** are **offerings** — beads, buttons, or chips from the bowl. Fail the rescue and one token **drops into the Vent** (off the table or into a discard pile). Last player still holding tokens wins — everyone else has been swallowed by the mountain.',
  overview:
    '**Volcano Vent lore in one breath:** The table shares **one volcano** and **six dice**. Each countdown number is a **step down the cone**. Miss → stand on the **Vent rim** → **rescue reroll** with your **lucky charm** → safe or sacrifice a **token**. After **1**, climb back to the rim at **6** and the next player leads the descent.'
};

function matchLoreTopic(message) {
  const m = String(message || '').toLowerCase().trim();
  if (!m) return null;
  if (/(?:why|how come).*(?:call(?:ed)?|name(?:d)?).*(?:the\s+)?vent/.test(m)
    || /why.*vent.*(?:call|name|mean)/.test(m)
    || /what\s+(?:does|do)\s+(?:the\s+)?vent\s+mean/.test(m)) {
    return 'whyVent';
  }
  if (/(?:edge|rim|lip|ledge).*(?:volcano|vent)/.test(m)
    || /(?:on|at)\s+the\s+edge/.test(m)
    || /standing\s+on\s+the\s+vent/.test(m)) {
    return 'ventEdge';
  }
  if (/crawl(?:ing)?\s+(?:down|into).*(?:volcano|vent|mountain|countdown)/.test(m)
    || /(?:descend|climb|going|travel|walk|step)(?:ing|s)?\s+(?:down|into|deeper).*(?:volcano|vent|mountain|cone)/.test(m)
    || /down\s+the\s+volcano/.test(m)) {
    return 'crawling';
  }
  if (/(?:what\s+(?:is|does)|explain).*(?:the\s+)?countdown\s+(?:mean|about|represent|story)/.test(m)
    || /countdown.*(?:lore|metaphor|story|theme)/.test(m)
    || /(?:rings?|steps?|shelves?).*(?:volcano|countdown)/.test(m)) {
    return 'countdown';
  }
  if (/lucky\s+charm.*(?:lore|story|mean|metaphor)/.test(m)
    || /why.*lucky\s+charm/.test(m)) {
    return 'luckyCharm';
  }
  if (/token.*(?:lore|sacrifice|metaphor|story|mean)/.test(m)
    || /sacrifice.*(?:token|vent|volcano)/.test(m)) {
    return 'tokens';
  }
  if (/why.*volcano\s+vent(?:\s+dice)?/.test(m)
    || /volcano\s+vent(?:\s+dice)?.*(?:mean|name|called)/.test(m)
    || /what\s+is\s+volcano\s+vent(?:\s+dice)?\s*(?:about|mean)?$/.test(m)) {
    return 'name';
  }
  if (/(?:lore|terminology|theme|metaphor|flavor|flavour|story|table\s+story)/.test(m)
    || /volcano\s+vent\s+lore/.test(m)
    || /tell\s+me\s+(?:the\s+)?(?:lore|story)/.test(m)) {
    return 'overview';
  }
  return null;
}

function matchLoreQuestion(message) {
  return !!matchLoreTopic(message);
}

function formatVolcanoVentLoreMarkdown(topic) {
  const L = VOLCANO_VENT_LORE;
  const key = topic && L[topic] ? topic : 'overview';
  const body = L[key] || L.overview;
  const labels = {
    whyVent: 'Why "the Vent"?',
    ventEdge: 'On the Vent edge',
    countdown: 'The countdown',
    crawling: 'Crawling down the volcano',
    name: 'Why "Volcano Vent Dice"?',
    luckyCharm: 'Lucky charm',
    tokens: 'Tokens & sacrifice',
    overview: 'Volcano Vent lore'
  };
  let out = `**${labels[key] || 'Volcano Vent lore'}**\n\n${body}`;
  if (key !== 'overview') {
    out += '\n\n**Try next:** "What does the countdown mean?" · "Are we on the edge of the volcano?" · **"volcano vent lore"** for the full picture.';
  } else {
    out += '\n\nAsk about **why the Vent**, the **countdown**, **crawling down the volcano**, or **lucky charm lore** — flavor only; rules stay the same.';
  }
  return out;
}

/** Gentle support line — not a lecture; for buttons/beads chat when things feel heavy. */
const VOLCANO_VENT_HELPLINE = {
  name: '1-800-GAMBLER',
  phone: '1-800-426-2537',
  note:
    'If pretend play with buttons and beads ever starts feeling like too much — for you or someone at the table — **1-800-GAMBLER** (**1-800-426-2537**) is free, confidential, and available **24/7**. No judgment — help is there if you need it.'
};

/** Craft tokens only — not jewelry or casino stakes. */
const VOLCANO_VENT_CRAFT_TOKENS = {
  summary:
    'Use cheap **craft tokens** for antes — beads, buttons, seeds, pebbles, clips, **marbles**, **jacks**. Mixed pot is fine. **Never real poker chips, cash, or gold/silver.**',
  categories: [
    {
      name: 'Beads & buttons',
      text:
        '**Craft-shop beads** (plastic, wood, pony) and **sewing buttons** — any size, junk-drawer mismatches OK.'
    },
    {
      name: 'Seeds & beans',
      text:
        '**Dried beans**, corn kernels, pumpkin or sunflower **seeds** — lightweight, abundant, easy to count; rustic like wooden beads. Traditional home-game feel.'
    },
    {
      name: 'Stones & pebbles',
      text:
        'Small smooth **river stones**, aquarium **gravel**, polished **gem chips** — durable; varied colors can mark different pretend amounts (like colored buttons).'
    },
    {
      name: 'Paper clips & fasteners',
      text:
        'Uniform metal or colored plastic **paper clips**, **binder clips**, **brass fasteners** — office supplies that stack and clink; easy to track antes.'
    },
    {
      name: 'Marbles & jacks',
      text:
        'Toy **marbles** and **jacks** — fun, clearly pretend. **Use these instead of real poker chips.**'
    }
  ],
  details: [
    'Everyone starts with **equal stacks** from a shared bowl — tokens need not match.',
    'Write what you are using on the **napkin** before the first roll (especially if mixing types).'
  ],
  avoid:
    '**Never:** real **poker chips**, cash, PayPal/Venmo, gold/silver/precious-metal beads, or anything that feels like a casino or real-money stake. **Marbles or jacks** beat poker chips every time.'
};

/** Two house rules for pretend bets — buttons, beads, and things only. */
const VOLCANO_VENT_BETTING = {
  tokens:
    'Craft tokens for antes — beads, buttons, seeds, pebbles, paper clips, marbles, jacks (pot need not match). **Never real poker chips, cash, gold, or silver.**',
  minAge: 18,
  helpline: VOLCANO_VENT_HELPLINE,
  craftTokens: VOLCANO_VENT_CRAFT_TOKENS,
  houseRules: [
    {
      id: 'return_all',
      name: 'House Rule One — Return All (default)',
      text:
        '**Just for pretend.** Everyone puts equal buttons or beads in the bowl. After the game, **everyone gets their tokens back**. It is only a game — the last player with tokens still won the round.'
    },
    {
      id: 'keeper_pot',
      name: 'House Rule Two — Keeper Pot (optional)',
      text:
        '**Napkin vote required — unanimous only.** Before the first roll, run a **napkin vote** on keeper buttons and beads: **every player must take part**, and **everyone** must vote **yes**. One no, pass, or unsure → **House Rule One** (return all). If unanimous, the winner may **keep the craft pot** — not real money.'
    }
  ],
  allowed: [
    '**3 equal token stacks** per player from a shared bowl.',
    '**Craft tokens** for antes — beads, buttons, seeds, beans, pebbles, clips, marbles, jacks; mixed pot is fine.',
    'Tiny agreed **antes** per countdown cycle — written before play.',
    'House Rule One (return all) as the **default**.',
    'House Rule Two (keeper pot) only after a **napkin vote** where **every player takes part** and **all vote yes** — unanimous before the first roll.',
    'Paper lives for kids — no token betting when children are at the table.'
  ],
  notAllowed: [
    '**Real cash**, coins you keep, PayPal, Venmo, Cash App, or IOUs.',
    '**Real poker chips** — use **marbles**, **jacks**, or other craft tokens instead.',
    '**Gold beads, silver beads**, or precious-metal tokens that feel like real stakes.',
    'Keeper pots without a **unanimous napkin vote** where **every player took part**.',
    'Pretend bets when **kids or teens** are at the table — paper lives only.',
    'Pressuring anyone to bet or keep the pot.',
    '**Chasing losses** — adding more antes, bigger bowls, or extra rounds to “win it back.”',
    '**Double-or-nothing** — rematches, doubled pots, or “all or nothing” bead wagers tied to the next roll.'
  ],
  safetyAdvice: {
    summary:
      'Pretend bets stay light when the table **never chases losses** and **never does double-or-nothing** — if the mood shifts, drop to **House Rule 1** or skip antes entirely.',
    never: [
      '**No chasing losses.** If someone is down beads or feels sour, **do not** raise antes, replay for the bowl, or pressure “one more chain.” Pause → **return-all** or no antes next game.',
      '**No double-or-nothing.** No “double the pot,” “winner takes double,” or Vent rematches to claw tokens back. Volcano Vent is one countdown game — not a casino ladder.',
      '**No IOU beads** — if it is not on the napkin before play, it is off the table.'
    ],
    avoidHouseRule2Summary:
      '**When to avoid House Rule 2 (keeper pot):** default to **House Rule 1 (return all)** whenever the table is new to pretend bets, anyone hesitates, or the night has turned tense.',
    avoidHouseRule2: [
      '**Anyone might chase losses** if keeper is on the line — use **return-all** instead.',
      'Someone already asked for **double-or-nothing** or a bigger pot mid-game — **skip keeper**; reset to return-all.',
      '**First pretend-bet night** at this table — learn antes with return-all first.',
      '**Kids or teens** present — paper lives only, no keeper bowl.',
      '**Unanimous napkin vote did not happen** before the first roll.',
      'Mood is **tense**, beads pile up faster than laughs, or anyone was **pressured** to vote keeper.',
      'Stakes stopped feeling like **craft junk** — gold beads, poker chips, or “you owe me” vibes.',
      '**1-800-GAMBLER** territory — if pretend play feels heavy, drop keeper and return everything; call **1-800-426-2537** if needed.'
    ]
  },
  homePlay:
    'Volcano countdown on six dice. Token sacrifices track Vent failures. Default: return every button and bead. Optional: keeper pot if the whole group votes yes before play.',
  playFit: {
    summary:
      'Pretend bets **ride alongside** the normal rules — they do **not** replace the **3 Vent tokens** that track elimination. Think **small antes**, not a second game.',
    tokensVsBets: [
      '**Vent tokens (3 each)** — game pieces. Lose one when you **fail** a lucky-charm rescue. Last player with tokens **wins**.',
      '**Pretend beads/buttons** — optional **18+** spice from a shared bowl. Same craft stuff can look alike, but **roles stay separate** unless your table writes otherwise.'
    ],
    defaultStyle: 'antes',
    antes: [
      '**Best default: antes, not side bets.** When the countdown **resets to 6** (fresh chain), each player drops **one agreed craft token** into the bowl — tiny, equal, written on a napkin before play.',
      'Antes **coincide with the flow** — they mark the start of a new **6→1** cycle, not every single roll.',
      'The **game winner** (last Vent tokens) is the story; the bowl of antes is **pretend only** — **House Rule 1** returns every bead at wrap-up.'
    ],
    sideBets: [
      '**Side bets are optional extras** — only if everyone agrees **before** play and keeps them simple.',
      'Examples: “add one bead when you hit the **Vent**,” or “one bead to the bowl if you **save** yourself on rescue.”',
      'Skip side bets if they slow the countdown or confuse **Vent tokens** with **bowl beads**.',
      '**Never** chase losses or double-or-nothing — if a side bet starts feeling like that, drop it.'
    ],
    suggestions: [
      '**Light table:** no antes — just play tokens/paper lives.',
      '**Social table:** **1 ante per countdown reset** + **House Rule 1** (return all).',
      '**Spicier table:** antes + one simple side bet (Vent penalty bead) — still **return-all default**.',
      '**Keeper night:** **House Rule 2** only with unanimous yes — winner keeps the **ante bowl**, not anyone’s real property.'
    ]
  },
  keeperGuidance: {
    summary:
      '**House Rule 2 (keeper pot)** is fine only when the whole table is relaxed, adult-only, and **unanimous before the first roll**. If anyone hesitates, use **House Rule 1** — return everything.',
    okWhen: [
      '**Adults-only table (18+)** — no kids or teens playing.',
      '**Napkin vote done right** — **every player took part** and **all voted yes** (unanimous) **before** the first roll.',
      'Stakes are **cheap craft tokens** (beads, seeds, pebbles, clips, marbles…) — clearly pretend, not poker chips or cash.',
      'The ante bowl is **tiny** — nobody would miss a few plastic beads after game night.',
      'The group already plays with **return-all** often and wants a rare “keeper night” for fun.'
    ],
    notOkWhen: [
      '**Kids or teens** are at the table — use **paper lives** only, no pretend bets.',
      '**Anyone is unsure**, quiet, abstaining, or only going along to avoid awkwardness — not unanimous.',
      '**Someone skipped** the napkin vote or was not at the table when it passed.',
      'Someone was **pressured** to bet or to vote for keeper mode.',
      'Tokens feel like **real money** — gold/silver beads, IOUs, Venmo, “you owe me.”',
      'Keeper mode was **not agreed before play** — mid-game rule changes do not count.',
      'The mood is tense, competitive in a bad way, or beads are piling up faster than laughs.',
      '**First time** trying pretend bets at this table — start with **return-all**.',
      'Anyone talked about **chasing losses** or **double-or-nothing** — keeper makes that worse; use **return-all**.',
      'The group wants to **raise antes** or replay for the bowl after someone lost — sign to **avoid House Rule 2**.'
    ],
    default: '**Default:** **House Rule 1** — everyone gets every button and bead back. Keeper is optional spice, not the standard.'
  },
  antesGuide: {
    summary:
      '**Antes** are tiny pretend drops of **craft tokens** (beads, buttons, seeds, pebbles, clips, marbles, jacks…) into a **shared bowl** when a **new countdown chain** starts at **6** — separate from your **3 Vent tokens**.',
    setup: [
      '**Napkin first:** write ante size (often **1 bead each**), **House Rule 1** or **2**, craft tokens only — before the first roll.',
      'Everyone starts with **equal stacks** of cheap craft tokens from a shared bowl — mix types if the napkin says so.',
      'Keep **3 Vent tokens** in front of each player — they track Vent failures; the bowl is pretend spice only.'
    ],
    when: [
      'Pay an ante when the countdown **resets to 6** with **all 6 dice** — the start of a fresh **6→1** chain.',
      'That happens at **game start**, after someone pays tribute **1**, and after any **Vent** (save or sacrifice).',
      'You **do not** ante on every roll — only when a **new chain** begins at **6**.'
    ],
    how: [
      'Each player drops the **same agreed amount** into the bowl (e.g. one bean, bead, marble, or paper clip).',
      'The player whose turn it is rolls **all 6 dice** for tribute **6**.',
      'Play the normal countdown — lose **Vent tokens** only on failed rescues, not for antes.'
    ],
    wrapUp: [
      '**House Rule 1 (default):** after the game, **everyone gets every ante bead/button back**.',
      '**House Rule 2:** winner keeps the **ante bowl** only after a **unanimous napkin vote** before play.',
      '**Kids at the table** → no antes; **paper lives** only.'
    ]
  }
};

/** Casual table agreement — scrap paper counts too. */
const VOLCANO_VENT_NAPKIN_VOTE = {
  summary:
    'A **napkin vote** is a quick **home-table agreement** — jot the rules on a **napkin or scrap paper** before the first roll, and **every player takes part**.',
  keeperRule:
    '**Keeper buttons & beads rule:** **House Rule 2** needs a **napkin vote** where **everyone at the table votes**, and the result must be **unanimous yes**. One **no**, **pass**, **unsure**, or anyone **not voting** → **House Rule 1** (return all).',
  typical: [
    '**House Rule 1** (return all) or **House Rule 2** (keeper pot — unanimous napkin vote)',
    '**Ante size** — e.g. one craft bead per countdown reset',
    '**Lucky charms** — who picked which number',
    '**Kids at the table?** → paper lives only, no pretend bets'
  ],
  howToDecide: [
    '**Before the first roll**, write on the napkin: keeper or return-all, ante size, craft beads/buttons only.',
    '**Pass it around** — each player reads it and says **yes** out loud or **initials**. **Everyone must take part**; no skipping.',
    '**Unanimous yes only** for keeper. Any hesitation → cross out keeper and write **House Rule 1 — return all**.',
    'Play under what is on the napkin. **No re-votes** mid-game — new napkin next night.'
  ],
  note:
    'Not a majority vote — **keeper needs 100% yes**. If the napkin is unclear or someone missed the vote, default to **return-all**.'
};

/** Short answers for plain-language rule questions — not full rule dumps. */
const VOLCANO_VENT_BASIC_QA = [
  {
    test: m => /how\s+(?:do|does)\s+we\s+decide|how\s+to\s+decide|who\s+decides|how\s+(?:do|does)\s+(?:the\s+)?(?:table|group)\s+(?:decide|vote|agree)/.test(m)
      && !/first\s+player|who\s+goes\s+first|goes\s+first/.test(m),
    answer: 'how_we_decide'
  },
  {
    test: m => /napkin\s+vote|napkin\s+agreement|(?:what|explain).*(?:is\s+)?(?:a\s+)?napkin|tell\s+me\s+about\s+(?:the\s+)?napkin|write\s+(?:it\s+)?on\s+(?:a\s+)?napkin|scrap\s+paper\s+vote|paper\s+vote/.test(m),
    answer: 'napkin_vote'
  },
  {
    test: m => /how\s+many\s+round|how\s+many\s+cycle|how\s+many\s+countdown|number\s+of\s+round/.test(m)
      || /how\s+long\s+(?:is\s+)?(?:a\s+)?(?:game|match|night)/.test(m)
      || /how\s+many\s+times\s+(?:do\s+we|does\s+it)\s+(?:play|go\s+around)/.test(m),
    answer: 'rounds'
  },
  {
    test: m => /tie|draw|stalemate|same\s+score/.test(m),
    answer:
      '**No ties** in Volcano Vent Dice — play until **one player** still has tokens. Everyone else is out. If you want a quicker night, try the **short game** variant (**2 tokens** each).'
  },
  {
    test: m => /object(?:ive)?|goal|point\s+of\s+the\s+game|what\s+am\s+i\s+trying/.test(m),
    answer:
      '**Goal:** survive the **6→1** countdown without running out of tokens. Miss a number → **Vent** rescue with your **lucky charm** or lose a token. **Last player with tokens wins.**'
  },
  {
    test: m => /how\s+many\s+dice|what\s+dice|dice\s+do\s+(?:i|we)\s+need|number\s+of\s+dice/.test(m),
    answer:
      '**Six d6 dice total** — shared by the whole table, not six per person. They pass around as the countdown shrinks the pool.'
  },
  {
    test: m => /how\s+many\s+token|how\s+many\s+chip|how\s+many\s+button|how\s+many\s+bead|3\s+token|three\s+token/.test(m)
      && !/pretend|bet|ante|pot|keeper|house\s+rule/.test(m),
    answer:
      '**Three tokens per player** — beads, buttons, or chips from a bowl. Lose **one** when you **fail** a lucky-charm rescue on the **Vent**. Out of tokens = eliminated.'
  },
  {
    test: m => /when\s+do\s+(?:i|you|we)\s+lose\s+(?:a\s+)?token|lose\s+(?:a\s+)?token\s+when/.test(m),
    answer:
      'You lose **one token** only when you **miss** the countdown, stand on the **Vent**, and then **fail** the rescue roll (your **lucky charm** does not show). Hitting 6, 5, 4… does **not** cost a token.'
  },
  {
    test: m => /who\s+goes\s+first|first\s+player|start\s+the\s+game/.test(m),
    answer:
      'Pick a first player any fair way — **youngest** at the table or **roll for it** are common. Then roll all **6 dice** for tribute **6**.'
  },
  {
    test: m => /wind\s+up\s+on|end\s+up\s+on|land\s+on/.test(m) && /vent/.test(m) && /first|opening|start|tribute\s*6|right\s+away|immediately/.test(m)
      || /first\s+roll.*(?:vent|miss)|(?:vent|miss).*first\s+roll/.test(m)
      || /can\s+(?:you|i|we).*(?:vent|miss).*(?:first|opening|start)/.test(m)
      || /vent.*(?:first|opening)\s+roll|(?:first|opening)\s+roll.*vent/.test(m),
    answer: 'first_roll_vent'
  },
  {
    test: m => /after\s+(?:you\s+)?(?:hit|make|get)\s+(?:a\s+)?1\b|what\s+after\s+1|happens\s+after\s+1/.test(m),
    answer:
      'After someone pays tribute **1**, the chain is done — **all 6 dice** come back, countdown **resets to 6**, and the **next player** starts fresh.'
  },
  {
    test: m => /do\s+sums?\s+count|can\s+(?:i|you)\s+add|adding\s+dice|combine\s+dice/.test(m),
    answer:
      '**Yes — sums count.** Use as many dice as you need if they add to the target — lone **6**, **4+2**, **2+2+2**, etc. Set only the paying dice aside; pass the rest.'
  },
  {
    test: m => /who\s+(?:gets?|rolls?|takes?).*(?:6\s+dice|the\s+dice|restart)|who\s+rolls?\s+after.*(?:lucky\s*charm|charm|rescue|save)/.test(m)
      && /lucky\s*charm|charm|vent|rescue|save|restart/.test(m)
      || /(?:restart|reset).*(?:6\s+)?dice.*(?:lucky\s*charm|charm|vent)/.test(m)
      || /do\s+i\s+roll\s+again.*(?:charm|save|rescue|vent)/.test(m)
      || /after.*lucky\s*charm.*(?:who|next\s+player|whose\s+turn)/.test(m)
      || /lucky\s*charm.*who\s+(?:gets?|rolls?)/.test(m),
    answer: 'lucky_charm_dice_reset'
  },
  {
    test: m => /same\s+(?:lucky\s+)?charm|duplicate\s+charm|two\s+people.*charm/.test(m),
    answer:
      '**Duplicates are fine** — two players can both pick **4**. On a rescue roll you only need **your** number on **your** dice.'
  },
  {
    test: m => !/who\s+(?:gets?|rolls?)|do\s+i\s+roll\s+again|after.*(?:save|saved)/.test(m)
      && (/automatic(?:ally)?\s+safe|auto\s+safe/.test(m) && /charm|vent|rescue/.test(m)
      || /charm.*(?:in|on|was\s+in|showed|appeared).*(?:miss|failed)|(?:miss|failed).*(?:charm|lucky).*(?:in|on|showed|appeared)/.test(m)
      || /reroll.*(?:charm|vent|rescue)|(?:charm|vent|rescue).*reroll/.test(m)
      || /charm.*in\s+(?:the\s+)?(?:miss|failed)\s+roll/.test(m)
      || /miss.*target.*charm|charm.*in\s+(?:the\s+)?(?:miss|failed)\s+roll/.test(m)
      || /rule\s+confus.*charm|two\s+rolls?.*charm|charm.*two\s+rolls?/.test(m)
      || /on\s+the\s+vent.*miss.*charm|miss.*(?:on\s+)?the\s+vent.*charm/.test(m)),
    answer: 'vent_charm_miss_clarify'
  },
  {
    test: m => /what\s+happens\s+when\s+(?:i|you|we)\s+miss|if\s+(?:i|you|we)\s+miss|miss\s+the\s+(?:target|mark|number)/.test(m),
    answer:
      '**Miss the target** → you are on the **Vent**. **Rescue roll:** roll the **same number of dice** again. **Lucky charm** on the **rescue** → safe, reset to **6**. No charm on rescue → **lose 1 token**, next player.'
  },
  {
    test: m => /rescue\s+roll|how\s+(?:does|do)\s+(?:the\s+)?rescue/.test(m) && !/lucky\s+charm.*roll/.test(m),
    answer:
      '**Rescue roll:** same dice count as your failed roll. **Your lucky charm** on any die → no token lost, all **6 dice** back, reset to **6**. Miss it → sacrifice **1 token**.'
  },
  {
    test: m => /how\s+many\s+player|player\s+count|minimum\s+player|max(?:imum)?\s+player/.test(m),
    answer:
      '**2 or more players.** Sweet spot is **3–6**. Still **6 dice total** for everyone — more players means more time between your turns.'
  },
  {
    test: m => /what\s+do\s+(?:i|we)\s+need|need\s+to\s+play|stuff\s+(?:do\s+)?i\s+need|materials|equipment/.test(m)
      && !/gold|silver|craft/.test(m),
    answer:
      '**6 d6 dice**, **3 tokens** per player, paper for **lucky charms (1–6)**, and a shared bowl if you like. Pick charms at setup — everyone writes theirs down.'
  },
  {
    test: m => /how\s+(?:does|do)\s+scor|keep\s+score|score\s+work|what\s+counts\s+as\s+scor/.test(m),
    answer:
      '**Only tokens count** toward winning — start with **3**, lose **1** on a failed Vent rescue. The **6→1 countdown** is not points. **Lucky charms** are not points either — they only matter on Vent rescues.'
  },
  {
    test: m => /who\s+win|how\s+(?:do|does)\s+(?:you|i|we)\s+win|win(?:ning)?\s+condition/.test(m),
    answer:
      '**Last player with any tokens wins.** Everyone else is out when their tokens hit zero.'
  },
  {
    test: m => /(?:explain|describe|tell\s+me\s+about)\s+(?:the\s+)?countdown|countdown\s+work|6.*5.*4.*3.*2.*1/.test(m)
      && !/full\s+rules/.test(m),
    answer:
      'Countdown runs **6 → 5 → 4 → 3 → 2 → 1**. Pay each number with a die face or a **sum**, set those dice aside, pass the rest. After **1**, all dice return and the **next player** starts at **6** again.'
  },
  {
    test: m => /(?:my|your|a)\s+turn|what\s+(?:do|happens)\s+on\s+(?:my|a)\s+turn|whose\s+turn/.test(m),
    answer:
      '**Your turn:** roll the dice in front of you for the **current target** (6 down to 1). Hit it → set paying dice aside, pass the rest. Miss → **Vent** rescue. After **1** or a Vent resolution, play moves to the **next player** at **6**.'
  },
  {
    test: m => /how\s+(?:does|do)\s+(?:this|the)\s+game\s+work|what\s+is\s+volcano\s+vent|explain\s+(?:the\s+)?game\b/.test(m)
      && !/full\s+rules|quote/.test(m),
    answer:
      'Shared **6-dice countdown** from **6** down to **1**. Miss → **Vent** → lucky charm saves you or you lose a token. **Last tokens wins.** Say **"full rules"** if you want the whole lecture.'
  },
  {
    test: m => /restart|reset|start\s+over|back\s+to\s+6/.test(m) && /countdown|dice|round|chain/.test(m),
    answer:
      'Countdown **resets to 6** with **all 6 dice** after: someone pays **1**, or after a **Vent** (save or sacrifice). Then the **next player** rolls.'
  },
  {
    test: m => /can\s+(?:i|you)\s+use\s+all\s+(?:the\s+)?dice|every\s+dice|all\s+six/.test(m),
    answer:
      '**Yes** — if they pay the tribute (e.g. **1+1+1+1+1+1=6** uses all six). You do not have to — a lone **6** leaves **5 dice** to pass, which is usually smarter.'
  },
  {
    test: m => /first\s+roll|opening\s+roll|start\s+(?:at|with)\s+6/.test(m),
    answer:
      '**First roll of a chain:** all **6 dice** for tribute **6** — lone **6**, **4+2**, **2+2+2**, etc. Set payers aside; next player needs **5** with what remains.'
  },
  {
    test: m => /is\s+this\s+gambl|gambling\s+game|real\s+money\s+game/.test(m) && !/pretend|bead|button/.test(m),
    answer:
      'It is a **family dice countdown** at heart — tokens track Vent failures. Optional **18+ pretend bets** with craft beads are **not real money** and are off the table when kids are playing.'
  }
];

/** Short answers for buttons, beads, and pretend-bet chat. */
const VOLCANO_VENT_BEADS_QA = [
  {
    test: m => /when\s+(?:is|are)\s+keeper|keeper\s+(?:okay|ok|fine|allowed)|(?:is|are)\s+keeper\s+(?:okay|ok|fine)/.test(m)
      || /when\s+(?:can|should)\s+(?:the\s+)?winner\s+keep/.test(m),
    answer: 'keeper_ok'
  },
  {
    test: m => /when\s+(?:is\s+)?keeper\s+not|keeper\s+not\s+okay|should\s+not\s+keep|avoid\s+keeper|skip\s+keeper/.test(m)
      || /when\s+not\s+(?:to\s+)?keep\s+the\s+pot/.test(m)
      || /avoid\s+house\s+rule\s*2|skip\s+house\s+rule\s*2|when\s+(?:to|should\s+we)\s+avoid\s+(?:house\s+rule\s*2|keeper)/.test(m),
    answer: 'keeper_not'
  },
  {
    test: m => /chas(?:e|ing)\s+loss|cas(?:e|ing)\s+loss|chase\s+what\s+(?:i|you|we)\s+lost|win\s+it\s+back/.test(m)
      && /bet|ante|pretend|bead|button|bowl|pot|keeper/.test(m),
    answer: 'safety_advice'
  },
  {
    test: m => /double[\s-]?or[\s-]?nothing|double\s+the\s+pot|all\s+or\s+nothing|double\s+(?:ante|bet|bowl)/.test(m)
      && /bet|ante|pretend|bead|button|bowl|pot|keeper|volcano/.test(m),
    answer: 'safety_advice'
  },
  {
    test: m => /^(?:no\s+)?(?:chasing\s+loss|double[\s-]?or[\s-]?nothing)/.test(m)
      || /advise.*(?:chasing|double)|should\s+we\s+(?:chase|double)/.test(m),
    answer: 'safety_advice'
  },
  {
    test: m => /how\s+(?:do|does)\s+antes?\s+work|what\s+(?:are|is)\s+(?:an?\s+)?antes?|explain\s+antes?/.test(m)
      || /when\s+(?:do\s+we|to)\s+(?:pay|put|drop|add)\s+antes?/.test(m)
      || /antes?.*(?:button|bead)|(?:button|bead).*antes?/.test(m)
      || /(?:clear\s+)?instructions?\s+(?:on|for)\s+antes?|antes?\s+instructions?/.test(m)
      || /clear\s+instructions.*antes?|instructions?\s+on\s+how\s+antes?/.test(m)
      || /how\s+(?:do|does)\s+antes?\s+work\s+with/.test(m),
    answer: 'antes_guide'
  },
  {
    test: m => /how\s+(?:do|does)\s+we\s+decide|how\s+to\s+decide|who\s+decides|unanimous/.test(m)
      && /keeper|bead|button|house\s+rule|pretend|pot|napkin|return/.test(m),
    answer: 'how_we_decide'
  },
  {
    test: m => /do\s+we\s+need\s+everyone|does\s+everyone\s+need|everyone\s+(?:must\s+)?(?:agree|vote|say\s+yes|take\s+part)|must\s+everyone\s+vote/.test(m)
      && /keeper|bead|button|napkin|house\s+rule|pretend|pot|unanimous|return/.test(m),
    answer: 'how_we_decide'
  },
  {
    test: m => /what\s+can\s+(?:be|i|we)\s+use\s+for\s+(?:pretend\s+)?(?:bets?|antes?|wagering)/.test(m)
      || /what\s+(?:to|can)\s+use\s+for\s+(?:pretend\s+)?bets?/.test(m)
      || /what\s+(?:material|stuff|token)s?\s+(?:can\s+)?(?:be\s+used\s+)?for\s+(?:pretend\s+)?bets?/.test(m)
      || /(?:seed|bean|pebble|paper\s*clip|binder\s*clip|marble|jack|poker\s+chip)/.test(m)
        && /ante|pretend|bet|bead|button|token|bowl|craft/.test(m)
      || /seeds?\s+and\s+beans|stones?\s+and\s+pebble|paper\s+clips?\s+and/.test(m),
    answer: 'craft_tokens_list'
  },
  {
    test: m => /how\s+do\s+beads?\s+work|what\s+do\s+beads?\s+do/.test(m) && !/button/.test(m),
    answer: 'beads_intro'
  },
  {
    test: m => /how\s+do\s+buttons?\s+work|what\s+do\s+buttons?\s+do/.test(m) && !/bead/.test(m),
    answer: 'buttons_intro'
  },
  {
    test: m => /how\s+do\s+(?:buttons?\s+and\s+beads?|beads?\s+and\s+buttons?)\s+work|buttons?\s+and\s+beads?\s+work|what\s+do\s+buttons?\s+and\s+beads?\s+do/.test(m),
    answer: 'intro'
  },
  {
    test: m => /what\s+(?:are|is)\s+pretend\s+bet|pretend\s+bet\s+mean|pretend\s+play/.test(m),
    answer:
      '**Pretend bets** are optional **18+** spice — cheap **craft beads** and **sewing buttons** in a bowl, **not cash**. They ride **alongside** the game; your **3 Vent tokens** still track who is in. Default: **return everything** after play (**House Rule 1**).'
  },
  {
    test: m => /real\s+money|cash|venmo|paypal|actual\s+money|bet\s+money/.test(m),
    answer:
      '**No real money** — ever. Craft-shop beads and sewing buttons only. If it feels like cash, stop and switch to **House Rule 1** (return all) or drop pretend bets for the night.'
  },
  {
    test: m => /replace.*token|instead\s+of\s+token|same\s+as\s+(?:vent\s+)?token|vent\s+token.*bead|bead.*vent\s+token/.test(m),
    answer:
      '**Keep them separate:** **Vent tokens (3)** track elimination — lose one on a failed rescue. **Bowl beads** are optional pretend **antes** — they do not replace Vent tokens unless your table writes a custom rule (not recommended).'
  },
  {
    test: m => /how\s+much\s+(?:do\s+)?(?:i|we)\s+put|how\s+many\s+(?:bead|button).*pot|size\s+of\s+(?:the\s+)?ante/.test(m),
    answer:
      '**Tiny and equal** — often **one craft bead per player** each time the countdown **resets to 6**. Write the amount on a napkin **before** the first roll so nobody argues later.'
  },
  {
    test: m => /what\s+goes\s+in\s+(?:the\s+)?(?:bowl|pot)|shared\s+bowl|bowl\s+for/.test(m),
    answer:
      'A **shared bowl** of **craft-shop beads** and **mismatched sewing buttons** — equal starting stacks per player for pretend antes. **Vent tokens** stay in front of each player unless your table uses the same beads for both (write it down if so).'
  },
  {
    test: m => /return\s+all|get\s+(?:my|our)\s+(?:bead|button|token)\s+back|house\s+rule\s*(?:one|1)\b/.test(m)
      && !/keeper|rule\s*two|rule\s*2/.test(m),
    answer:
      '**House Rule 1 (default):** everyone puts equal craft tokens in, plays the game, then **everyone gets every bead and button back** at the end. The winner is still whoever has Vent tokens — the bowl was just pretend.'
  },
  {
    test: m => /winner\s+keep|keep\s+the\s+pot|keeper\s+pot/.test(m)
      && !/when|okay|not|house\s+rule/.test(m),
    answer:
      '**House Rule 2:** winner **may keep the ante bowl** after a **unanimous napkin vote** — **every player takes part**, all **yes**, **before** the first roll. Craft tokens only. Otherwise **House Rule 1**. Ask **"how do we decide?"** for steps.'
  },
  {
    test: m => /kid|child|teen|under\s*18|minor/.test(m) && /bead|button|bet|pretend|pot/.test(m),
    answer:
      '**No pretend bets** when kids or teens are at the table — **paper lives** only. Buttons-and-beads betting chat is **18+** tables.'
  },
  {
    test: m => /pressure|forced\s+to\s+bet|make\s+(?:me|us)\s+bet/.test(m),
    answer:
      '**Never pressure anyone** to bet or vote for keeper mode. If the table feels pushy, drop to **no antes** or **return-all** — or skip pretend bets entirely.'
  },
  {
    test: m => /first\s+time|new\s+to\s+(?:pretend|bet)|never\s+bet/.test(m) && /bead|button|pretend|bet/.test(m),
    answer:
      '**First time?** Play with **Vent tokens only** or **House Rule 1** — equal craft beads, **return all** at the end. Skip keeper pots until the group knows the countdown cold.'
  }
];

function formatNapkinVoteMarkdown() {
  const n = VOLCANO_VENT_NAPKIN_VOTE;
  let out = `${n.summary}\n\n${n.keeperRule}\n\n**Often written on the napkin:**\n`;
  n.typical.forEach(line => { out += `• ${line}\n`; });
  out += `\n${n.note}`;
  return out;
}

function formatVentCharmMissClarificationMarkdown() {
  return (
    '**Two rolls — easy mix-up:**\n\n'
    + '**1 — Tribute roll (you missed):** You needed the countdown target but could not pay it → you are on the **Vent**. '
    + 'This can happen **on the very first roll** for tribute **6**. '
    + 'If your lucky charm showed on that roll but **did not pay the tribute**, you are **not** automatically safe.\n\n'
    + '**2 — Rescue roll (one reroll):** Roll **again** the **same number of dice** you just failed with — a **fresh roll**, not a re-read of the miss. '
    + 'If **your** lucky charm appears on **this rescue roll** → **safe!** No token lost. All **6 dice** back. Reset to **6**. **Next player** rolls.\n\n'
    + '**If rescue misses your charm** → lose **1 token**. Same dice reset. **Next player** at **6**.\n\n'
    + '*Mini example — mid-countdown:* Need **4**, roll **2-3-5** (miss — charm **3** showed but does not pay **4**). **Rescue reroll:** those **3 dice** again. Charm **3** on rescue → saved. No **3** on rescue → lose a token.\n\n'
    + '*Mini example — first roll:* Open with all **6** for tribute **6**, roll **1-2-3-4-5-2** (miss). **Rescue reroll:** all **6 dice** again. Lucky charm on **that rescue roll** → safe; miss rescue → lose **1 token**.'
  );
}

function formatFirstRollVentMarkdown() {
  return (
    '**Yes — you can wind up on the Vent on the first roll.** The opening player rolls all **6 dice** for tribute **6**. '
    + 'No lone **6** and no sum to **6**? That is a **miss right away** → **Vent**.\n\n'
    + '**Rescue roll (reroll):** Roll the **same number of dice** again — here, all **6** — as a **fresh roll**. '
    + 'Your **lucky charm on the rescue roll** saves you. Charm on the **miss roll** only helps if it **paid the tribute**.\n\n'
    + '**Mini example:** Jordan opens: **1-2-3-4-5-2** for tribute **6** — miss → **Vent**. '
    + 'Lucky charm **2**. **Rescue reroll** with all **6 dice**: shows **2** → **safe!** No token. All **6** back. **Next player** at **6**. '
    + 'No **2** on rescue → lose **1 token**, **next player** at **6**.'
  );
}

function formatLuckyCharmDiceResetMarkdown() {
  return (
    '**Who gets the 6 dice after a lucky-charm save?**\n\n'
    + 'All **6 dice** return to the **shared pool** in the middle — but the player who **saved** does **not** roll again.\n\n'
    + '**Next player** in turn order picks up all **6 dice** and rolls for tribute **6**.\n\n'
    + 'You rescued yourself (no token lost) — then **pass the turn**. '
    + 'Same if you **fail** the rescue: lose a token, all **6 dice** back, still the **next player** at **6**.'
  );
}

function formatAntesInstructionsMarkdown() {
  const a = VOLCANO_VENT_BETTING.antesGuide;
  let out = `**How antes work (buttons & beads)**\n\n${a.summary}\n\n`;
  out += '**1 — Before play (napkin):**\n';
  a.setup.forEach(line => { out += `• ${line}\n`; });
  out += '\n**2 — When to pay an ante:**\n';
  a.when.forEach(line => { out += `• ${line}\n`; });
  out += '\n**3 — What to do at ante time:**\n';
  a.how.forEach(line => { out += `• ${line}\n`; });
  out += '\n**4 — After the game:**\n';
  a.wrapUp.forEach(line => { out += `• ${line}\n`; });
  out += '\n**Not side bets** — antes mark a **new chain at 6**, not every roll. Ask **"antes or side bets?"** if you want the difference.';
  return out;
}

function formatRoundsAnswerMarkdown() {
  return (
    '**No fixed round count** — the **game** lasts until **one player** still has tokens. Everyone else is out.\n\n'
    + '**One round** (one **chain**) = one countdown **6→1** — or until someone **misses** and hits the **Vent** (then dice reset to **6** for the next player).\n\n'
    + '**Typical night:** **many** chains — more players and fewer Vent misses means longer play. **Short game** (**2 tokens** each) finishes faster than the usual **3**.'
  );
}

function formatHowWeDecideMarkdown() {
  const n = VOLCANO_VENT_NAPKIN_VOTE;
  let out = `**How we decide (keeper buttons & beads):**\n\n${n.keeperRule}\n\n**Steps:**\n`;
  n.howToDecide.forEach(line => { out += `• ${line}\n`; });
  out += `\n${n.note}`;
  return out;
}

function matchBasicRuleQuestion(m) {
  const t = String(m || '').toLowerCase();
  for (const item of VOLCANO_VENT_BASIC_QA) {
    if (item.test(t)) {
      if (item.answer === 'napkin_vote') return formatNapkinVoteMarkdown();
      if (item.answer === 'how_we_decide') return formatHowWeDecideMarkdown();
      if (item.answer === 'rounds') return formatRoundsAnswerMarkdown();
      if (item.answer === 'lucky_charm_dice_reset') return formatLuckyCharmDiceResetMarkdown();
      if (item.answer === 'vent_charm_miss_clarify') return formatVentCharmMissClarificationMarkdown();
      if (item.answer === 'first_roll_vent') return formatFirstRollVentMarkdown();
      return item.answer;
    }
  }
  return null;
}

function matchButtonsBeadsQuestion(m) {
  const t = String(m || '').toLowerCase();
  for (const item of VOLCANO_VENT_BEADS_QA) {
    if (item.test(t)) return item.answer;
  }
  return null;
}

function formatPretendBetSafetyAdviceMarkdown({ focus } = {}) {
  const s = VOLCANO_VENT_BETTING.safetyAdvice;
  if (focus === 'avoid_hr2') {
    let out = `${s.avoidHouseRule2Summary}\n\n`;
    s.avoidHouseRule2.forEach(line => { out += `• ${line}\n`; });
    out += `\n${VOLCANO_VENT_BETTING.keeperGuidance.default}`;
    return out;
  }
  let out = `${s.summary}\n\n**Never at the table:**\n`;
  s.never.forEach(line => { out += `• ${line}\n`; });
  out += `\n${s.avoidHouseRule2Summary}\n`;
  s.avoidHouseRule2.slice(0, 5).forEach(line => { out += `• ${line}\n`; });
  out += '\nAsk **"when should we avoid House Rule 2?"** for the full keeper checklist.';
  return out;
}

function formatKeeperGuidanceMarkdown({ focus } = {}) {
  const k = VOLCANO_VENT_BETTING.keeperGuidance;
  if (focus === 'not' || focus === 'avoid_hr2') {
    let out = focus === 'avoid_hr2'
      ? '**When to avoid House Rule 2 (keeper pot):**\n'
      : '**When keeper pots are NOT okay:**\n';
    k.notOkWhen.forEach(line => { out += `• ${line}\n`; });
    out += `\n**Also skip keeper:** no **chasing losses**, no **double-or-nothing** — use **return-all** if those come up.\n\n${k.default}`;
    return out;
  }
  if (focus === 'ok') {
    let out = '**When keeper pots are okay:**\n';
    k.okWhen.forEach(line => { out += `• ${line}\n`; });
    out += `\n${k.default}`;
    return out;
  }
  let out = `${k.summary}\n\n**Keeper okay when:**\n`;
  k.okWhen.forEach(line => { out += `• ${line}\n`; });
  out += '\n**Skip keeper when:**\n';
  k.notOkWhen.forEach(line => { out += `• ${line}\n`; });
  out += `\n${k.default}`;
  return out;
}

/** Plain-English follow-ups for pretend-bet conversations. */
const VOLCANO_VENT_BETTING_FOLLOWUP = {
  menu:
    '**Keep going on pretend bets** — say any of these naturally:\n\n'
    + '• **"how do antes work?"** — when to drop tokens into the bowl\n'
    + '• **"what can be used for bets?"** — seeds, pebbles, marbles (not poker chips)\n'
    + '• **"how do we decide?"** — napkin vote before play\n'
    + '• **"when is keeper okay?"** or **"when should we avoid House Rule 2?"**\n'
    + '• **"no chasing losses"** / **"no double-or-nothing"** — safety advice\n'
    + '• **"antes or side bets?"** — default is small antes\n\n'
    + 'I stay on the thread — short follow-ups like **"what about keeper?"** or **"tell me more"** work too.',
  nextBySubtopic: {
    overview:
      '**Next plain step:** agree on the **napkin** (ante size, return-all or keeper), then play the normal countdown. Default is **House Rule 1** — everyone gets craft tokens back.',
    antes:
      '**After antes:** play the countdown. At game end, **House Rule 1** returns every bean, bead, or marble unless you ran a **unanimous napkin vote** for keeper.',
    materials:
      '**Next:** write what you are using on the **napkin**, pick an **ante size** (often one token each), and agree **return-all** or **keeper** before the first roll.',
    napkin:
      '**After the napkin vote:** play normally. **No re-votes** mid-game. Unsure on keeper? Cross it out and use **return-all**.',
    decide:
      '**After everyone votes:** lock the napkin, drop first **antes** if you use them, then roll for tribute **6**. Keeper needs **every player** and **all yes**.',
    return_all:
      '**With return-all:** antes are just pretend — everyone gets every token back after play. The winner is still whoever has **Vent tokens** left.',
    keeper:
      '**If keeper passed the vote:** winner may keep the **ante bowl** only — craft junk, not real money. If the vote was not unanimous, use **return-all** instead.',
    side_bets:
      '**Side bets stay optional** — only if the table wants spice on top of **antes**. If they confuse Vent tokens with bowl beads, drop side bets.'
  }
};

function formatBettingFollowUpMenu() {
  return VOLCANO_VENT_BETTING_FOLLOWUP.menu;
}

function formatBettingFollowUpNext(subtopic) {
  const key = VOLCANO_VENT_BETTING_FOLLOWUP.nextBySubtopic[subtopic]
    ? subtopic
    : 'overview';
  return VOLCANO_VENT_BETTING_FOLLOWUP.nextBySubtopic[key];
}

function formatConciseButtonsBeadsIntro() {
  const f = VOLCANO_VENT_BETTING.playFit;
  return (
    '**Craft tokens = pretend spice for 18+ tables.** Beads, buttons, seeds, pebbles, clips, marbles, jacks in a shared bowl — **never poker chips, cash, or gold/silver**.\n\n'
    + `${f.summary}\n\n`
    + '**Quick default:** small **antes** when the countdown **resets to 6**, then **House Rule 1** — **everyone gets everything back**. '
    + 'Keeper pots (**House Rule 2**) only after a **unanimous napkin vote** where **every player takes part** — ask **"how do we decide?"** for the steps.'
  );
}

function formatBeadsWorkMarkdown() {
  return (
    '**Beads** are **craft pretend tokens** — pony beads, wood beads, junk-drawer mismatches. **Not gold, not poker chips, not cash.**\n\n'
    + 'They go in a **shared bowl** for optional **antes** when the countdown **resets to 6**. Your **3 Vent tokens** still track who is in — bowl beads are separate pretend spice.\n\n'
    + '**Default:** **House Rule 1** — everyone gets every bead back after play. Keeper only with a **unanimous napkin vote** before the first roll.\n\n'
    + 'Want a **mini example**? Reply **yes** or **sure** — or ask **"how do antes work?"**, **"how do buttons work?"**, or **"how do we decide?"** next.'
  );
}

function formatButtonsWorkMarkdown() {
  return (
    '**Buttons** here mean **sewing buttons** — any size, mismatched is fine. **Pretend only — never real money or poker chips.**\n\n'
    + 'They work like beads: equal stacks per player, tiny drops into a **shared bowl** for optional **antes** when countdown **resets to 6**. **Vent tokens (3)** still track elimination.\n\n'
    + '**Default:** **House Rule 1** — return every button after play. **House Rule 2** (keeper bowl) only if **everyone** votes **yes** on the napkin before the first roll.\n\n'
    + 'Want a **mini example**? Reply **yes** or **sure** — or ask **"how do beads work?"**, **"how do antes work?"**, or **"how do we decide?"** next.'
  );
}

function formatPretendBetsFitMarkdown() {
  const b = VOLCANO_VENT_BETTING;
  const f = b.playFit;
  let out = '**How pretend bets fit Volcano Vent Dice**\n\n';
  out += `${f.summary}\n\n`;
  out += '**Two layers (keep them straight):**\n';
  f.tokensVsBets.forEach(line => { out += `• ${line}\n`; });
  out += `\n**Short answer: ${f.defaultStyle === 'antes' ? 'use **antes**, not side bets, as the default.**' : ''}**\n\n`;
  out += '**Antes (recommended default)**\n';
  f.antes.forEach(line => { out += `• ${line}\n`; });
  out += '\n**Side bets (optional spice)**\n';
  f.sideBets.forEach(line => { out += `• ${line}\n`; });
  out += '\n**Table suggestions:**\n';
  f.suggestions.forEach(line => { out += `• ${line}\n`; });
  out += '\nAgree **House Rule 1** or **House Rule 2** before the first roll. Kids at the table → **paper lives only**, no pretend bets.';
  return out;
}

/** Quotable rule sources Adam can cite honestly (canonical text lives in this guide). */
const VOLCANO_VENT_RULEBOOK_SOURCES = {
  primary: {
    title: 'Volcano Vent Dice Home Rule Guide',
    author: 'Adam (volcano-vent-adam)',
    note: 'The main quotable source — full rule lecture is stored here and matches what Adam teaches.'
  },
  sources: [
    {
      title: 'Volcano Vent Dice Home Rule Guide (this app)',
      cite: 'Adam — volcano-vent-adam.netlify.app',
      use: 'Say **"quote the rules"** or **"full rules"** for the complete lecture pulled from this guide.'
    },
    {
      title: 'Your table\'s written house-rule sheet',
      cite: 'Agreed before the first roll',
      use: 'Best authority when your group already wrote lucky charms, tokens, and house bets on paper.'
    },
    {
      title: 'Family / table tradition',
      cite: 'Oral countdown dice games',
      use: 'Many homes play a similar **Volcano** countdown with six dice — details vary; this guide documents one clear version.'
    },
    {
      title: 'Sampson dice companion library',
      cite: 'volcano_vent_dice entry',
      use: 'Cross-reference entry with matching setup, Vent rescue, and token rules.'
    }
  ]
};

function stripMd(text) {
  return String(text || '').replace(/\*\*/g, '');
}

function formatQuotedRulesLecture() {
  const g = VOLCANO_VENT_GAME;
  const src = VOLCANO_VENT_RULEBOOK_SOURCES.primary;
  let out = `**Quoted from: ${src.title}** (*${src.author}*)\n\n`;
  out += `> "${stripMd(g.summary)}"\n>\n`;
  out += '> **Setup**\n';
  g.setup.slice(0, 4).forEach(line => { out += `> ${stripMd(line)}\n`; });
  out += '>\n> **Countdown core**\n';
  g.turnFlow.slice(0, 5).forEach(line => { out += `> ${stripMd(line)}\n`; });
  out += `>\n> **Winning:** ${stripMd(g.winning)}\n`;
  out += '\nSay **"full rules"** for the unabridged guide including variants and pretend-bet house rules.';
  return out;
}

function formatRulebookSourceMarkdown() {
  const s = VOLCANO_VENT_RULEBOOK_SOURCES;
  let out = '**Rulebooks you can quote for Volcano Vent Dice**\n\n';
  out += `${s.primary.note}\n\n`;
  s.sources.forEach((src, i) => {
    out += `**${i + 1}. ${src.title}**\n`;
    out += `• *Cite as:* ${src.cite}\n`;
    out += `• ${src.use}\n\n`;
  });
  out += 'Want the actual quoted lecture now? Say **"quote the rules"**.';
  return out;
}

function formatFullRulesMarkdown() {
  const g = VOLCANO_VENT_GAME;
  let out = `**${g.name}** — ${g.summary}\n\n`;
  out += `**Players:** ${g.players} · **Dice:** ${g.dice} · **Tokens:** ${g.tokens}\n\n`;
  out += '**Setup**\n';
  g.setup.forEach(s => { out += `• ${s}\n`; });
  out += '\n**Turn flow**\n';
  g.turnFlow.forEach(s => { out += `• ${s}\n`; });
  out += `\n**Scoring:** ${g.scoring.rule}\n`;
  out += `**Winning:** ${g.winning}\n\n`;
  out += '**Variants**\n';
  g.variants.forEach(s => { out += `• ${s}\n`; });
  out += `\n\n---\n*Source: **${VOLCANO_VENT_RULEBOOK_SOURCES.primary.title}** (${VOLCANO_VENT_RULEBOOK_SOURCES.primary.author}).*`;
  return out;
}

function formatCraftTokensMarkdown() {
  const c = VOLCANO_VENT_CRAFT_TOKENS;
  let out = `**What can be used for pretend bets & antes:** ${c.summary}\n\n`;
  if (c.categories) {
    c.categories.forEach(cat => { out += `**${cat.name}** — ${cat.text}\n\n`; });
  }
  c.details.forEach(l => { out += `• ${l}\n`; });
  out += `\n*${c.avoid}*`;
  return out;
}

function formatBettingSupportFooter({ helplineOnly = false } = {}) {
  const h = VOLCANO_VENT_HELPLINE;
  if (helplineOnly) return `\n\n---\n*${h.note}*`;
  return `\n\n---\n*${h.note}*`;
}

function formatBettingRulesMarkdown() {
  const b = VOLCANO_VENT_BETTING;
  let out = '**Pretend bets on Volcano Vent Dice** — buttons, beads, and things only.\n\n';
  out += `*${b.homePlay}*\n\n`;
  out += `${formatCraftTokensMarkdown()}\n\n`;
  b.houseRules.forEach(r => {
    out += `**${r.name}**\n${r.text}\n\n`;
  });
  out += '**✅ Allowed (18+ tables)**\n';
  b.allowed.forEach(l => { out += `• ${l}\n`; });
  out += '\n**🚫 Not allowed**\n';
  b.notAllowed.forEach(l => { out += `• ${l}\n`; });
  out += `\n**Tokens:** ${b.tokens}`;
  out += formatBettingSupportFooter();
  return out;
}

if (typeof globalThis !== 'undefined') {
  globalThis.VOLCANO_VENT_GAME = VOLCANO_VENT_GAME;
  globalThis.VOLCANO_VENT_BETTING = VOLCANO_VENT_BETTING;
  globalThis.VOLCANO_VENT_HELPLINE = VOLCANO_VENT_HELPLINE;
  globalThis.VOLCANO_VENT_LORE = VOLCANO_VENT_LORE;
  globalThis.VOLCANO_VENT_CRAFT_TOKENS = VOLCANO_VENT_CRAFT_TOKENS;
  globalThis.matchLoreQuestion = matchLoreQuestion;
  globalThis.matchLoreTopic = matchLoreTopic;
  globalThis.formatVolcanoVentLoreMarkdown = formatVolcanoVentLoreMarkdown;
  globalThis.VOLCANO_VENT_RULEBOOK_SOURCES = VOLCANO_VENT_RULEBOOK_SOURCES;
  globalThis.formatFullRulesMarkdown = formatFullRulesMarkdown;
  globalThis.formatRulebookSourceMarkdown = formatRulebookSourceMarkdown;
  globalThis.formatQuotedRulesLecture = formatQuotedRulesLecture;
  globalThis.formatCraftTokensMarkdown = formatCraftTokensMarkdown;
  globalThis.formatBettingRulesMarkdown = formatBettingRulesMarkdown;
  globalThis.formatPretendBetsFitMarkdown = formatPretendBetsFitMarkdown;
  globalThis.formatBettingSupportFooter = formatBettingSupportFooter;
  globalThis.matchBasicRuleQuestion = matchBasicRuleQuestion;
  globalThis.matchButtonsBeadsQuestion = matchButtonsBeadsQuestion;
  globalThis.formatKeeperGuidanceMarkdown = formatKeeperGuidanceMarkdown;
  globalThis.formatConciseButtonsBeadsIntro = formatConciseButtonsBeadsIntro;
  globalThis.formatBeadsWorkMarkdown = formatBeadsWorkMarkdown;
  globalThis.formatButtonsWorkMarkdown = formatButtonsWorkMarkdown;
  globalThis.formatNapkinVoteMarkdown = formatNapkinVoteMarkdown;
  globalThis.formatHowWeDecideMarkdown = formatHowWeDecideMarkdown;
  globalThis.formatRoundsAnswerMarkdown = formatRoundsAnswerMarkdown;
  globalThis.formatAntesInstructionsMarkdown = formatAntesInstructionsMarkdown;
  globalThis.formatBettingFollowUpMenu = formatBettingFollowUpMenu;
  globalThis.formatBettingFollowUpNext = formatBettingFollowUpNext;
  globalThis.formatPretendBetSafetyAdviceMarkdown = formatPretendBetSafetyAdviceMarkdown;
  globalThis.VOLCANO_VENT_BETTING_FOLLOWUP = VOLCANO_VENT_BETTING_FOLLOWUP;
  globalThis.formatLuckyCharmDiceResetMarkdown = formatLuckyCharmDiceResetMarkdown;
  globalThis.formatVentCharmMissClarificationMarkdown = formatVentCharmMissClarificationMarkdown;
  globalThis.formatFirstRollVentMarkdown = formatFirstRollVentMarkdown;
  globalThis.VOLCANO_VENT_NAPKIN_VOTE = VOLCANO_VENT_NAPKIN_VOTE;
}