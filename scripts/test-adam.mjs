import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const load = (f) => fs.readFileSync(path.join(root, f), 'utf8');

globalThis.localStorage = {
  _data: {},
  getItem(k) { return this._data[k] ?? null; },
  setItem(k, v) { this._data[k] = v; },
  removeItem(k) { delete this._data[k]; }
};
globalThis.document = { getElementById: () => null };

new Function([
  load('js/rules.js'),
  load('js/teach-flow.js'),
  load('js/llm-settings.js'),
  load('js/llm.js'),
  load('js/age-verify.js'),
  load('js/adam.js')
].join('\n'))();

let ok = 0;
let total = 0;

function check(label, pass) {
  total++;
  if (pass) ok++;
  console.log(pass ? 'OK' : 'FAIL', label);
}

check('greeting mentions full bot name', /Adam The Volcano Vent Bot/.test(adam.greet()));
check('ADAM_SOURCE has full name', /Adam The Volcano Vent Bot/.test(ADAM_SOURCE));
check('full rules 6 dice', /6.*d6|6 standard/i.test(adam.respond('full rules')));
check('countdown 6 to 1', /6.*5.*4|countdown/i.test(adam.respond('how does the countdown work?')));
check('lucky charm', /lucky charm/i.test(adam.respond('what is lucky charm?')));
check('lucky charm overview menu', /quick overview|how do I choose/i.test(adam.respond('what is lucky charm?')));
check('lucky charm numbers distinct', () => {
  const nums = adam.respond('what numbers can a lucky charm be?');
  const choose = adam.respond('how do I choose my lucky charm?');
  return /Lucky charm numbers: 1 through 6/i.test(nums)
    && /How to choose your lucky charm/i.test(choose)
    && nums.trim() !== choose.trim();
});
check('lucky charm teach mode distinct', () => {
  adam.teachMode = true;
  const qs = [
    ['what is a lucky charm?', /quick overview/i],
    ['can my lucky charm be my favorite number?', /^(\*\*)?Yes/i],
    ['how do I choose my lucky charm?', /How to choose your lucky charm/i],
    ['who gets the dice after a lucky charm save?', /Who gets the 6 dice/i]
  ];
  const seen = new Set();
  for (const [q, re] of qs) {
    adam.conversationHistory = [];
    const r = adam.respond(q).trim();
    if (!re.test(r)) return false;
    seen.add(r.slice(0, 70));
  }
  adam.teachMode = false;
  return seen.size === qs.length;
});
check('lucky charm gpt preserve teach snippets', () => {
  adam.teachMode = true;
  const reply = adam.respond('what is a lucky charm?');
  adam.teachMode = false;
  return typeof adamLlm !== 'undefined'
    && adamLlm._shouldPreserveRuleReply('what is a lucky charm?', reply)
    && adamLlm.shouldEnhance('what is a lucky charm?', reply) === false;
});
check('lucky charm topics distinct', () => {
  const qs = [
    ['what is a lucky charm?', /quick overview/i],
    ['can my lucky charm be my favorite number?', /^(\*\*)?Yes/i],
    ['what numbers can a lucky charm be?', /Lucky charm numbers/i],
    ['who gets the dice after a lucky charm save?', /Who gets the 6 dice/i],
    ['what happens if I roll my lucky charm on the vent?', /Vent rescue roll/i],
    ['how do you keep track of lucky charm?', /Keeping track/i],
    ['can two players have the same lucky charm?', /Same lucky charm/i]
  ];
  const seen = new Set();
  for (const [q, re] of qs) {
    adam.conversationHistory = [];
    const r = adam.respond(q).trim();
    if (!re.test(r)) return false;
    seen.add(r.slice(0, 70));
  }
  return seen.size === qs.length;
});
check('how choose lucky charm', /1\s+through\s+6|favorite number|before the first roll/i.test(adam.respond('how do I choose my lucky charm?')));
check('same favorite number regular group', /regular group|every game night|favorite number/i.test(adam.respond('can my lucky charm always be the same favorite number with our regular group?')));
check('can lucky charm be favorite number distinct', () => {
  const fav = adam.respond('can my lucky charm be my favorite number');
  const what = adam.respond('what is lucky charm?');
  return /^(\*\*)?Yes/i.test(fav.trim())
    && /How to choose your lucky charm/i.test(fav) === false
    && fav.trim() !== what.trim()
    && /1\s+through\s+6/i.test(fav);
});
check('what numbers lucky charm', /1\s+through\s+6|Must be/i.test(adam.respond('what numbers can a lucky charm be?')));
check('lucky charm table joke', /Table joke:/i.test(adam.respond('what is lucky charm?')));
check('table joke request', /Volcano Vent table joke/i.test(adam.respond('table joke')));
check('table joke vent topic', /Volcano Vent table joke.*Vent/i.test(adam.respond('table joke about the vent')));
check('another table joke', /Volcano Vent table joke/i.test(adam.respond('another table joke')));
check('vent answer table joke', /Table joke:/i.test(adam.respond('what happens on the vent?')));
check('lucky charm on paper', /paper|writes/i.test(adam.respond('what is lucky charm?')));
check('roll lucky charm clear', /safe|no token|rescue roll/i.test(adam.respond('what happens if you roll your lucky charm')));
check('roll lucky charm vent', /safe|no token lost/i.test(adam.respond('I rolled my lucky charm on the vent rescue')));
check('who gets dice after lucky charm save', /next player|does not roll|shared pool/i.test(adam.respond('who gets the restarted 6 dice when someone rolls their lucky charm')));
check('clarify lucky charm dice turn', /next player rolls|not you|pass the turn/i.test(adam.respond('do I roll again after I save with my lucky charm on the vent')));
adam.conversationHistory = [];
const trackCharm = adam.respond('how do you keep track of lucky charm');
check('keep track lucky charm not scoring', /paper|group remembers/i.test(trackCharm) && !/Token score \(who is winning\)/.test(trackCharm) && /not.*scor/i.test(trackCharm));
check('scoring clarified', /countdown is NOT|not scoring|token score/i.test(adam.respond('how does scoring work?')));
check('clarify scoring', /lucky charm.*NOT scoring|separate/i.test(adam.respond('can you clarify scoring')));
check('vent sacrifice', /Vent|sacrifice|rescue/i.test(adam.respond('what happens on the vent?')));
check('vent mentions rescue reroll', /rescue\s+reroll|roll\s+again|fresh\s+roll/i.test(adam.respond('what happens on the vent?')));
check('first roll vent understood', /first\s+roll|wind\s+up|opening|tribute\s*6/i.test(adam.respond('can you wind up on the vent with the first roll')));
check('first roll vent mini example', /mini example|1-2-3-4-5-2|rescue\s+reroll/i.test(adam.respond('can you wind up on the vent with the first roll')));
check('wind up not winning', !/Last player with any tokens/i.test(adam.respond('can you wind up on the vent with the first roll')));
check('vent charm miss not auto safe', /two rolls|rescue roll|does not auto-save|not automatically safe/i.test(adam.respond('on the vent I missed my target but my lucky charm was in the roll am I automatically safe or do I reroll')));
check('vent charm miss clarify', /rescue roll|reroll|miss roll/i.test(adam.respond('rule confusion lucky charm on vent miss roll')));
check('how to play tokens', /token/i.test(adam.respond('how do I play?')));
adam.teachMode = false;
adam.conversationHistory = [];

check('betting blocked without birthday', /18/.test(adam.respond('pretend bets with buttons')));
localStorage.setItem('adam-birthday', JSON.stringify({ month: 6, day: 15, year: 2012 }));
check('betting blocked under 18', /18/.test(adam.respond('buttons and beads betting')));

localStorage.setItem('adam-birthday', JSON.stringify({ month: 1, day: 1, year: 1990 }));
check('betting allowed 18+', /House Rule/.test(adam.respond('house rules for pretend bets')));
check('house rule one', /everyone gets|return/i.test(adam.respond('house rule one')));
check('house rule two', /everyone agrees|keeper/i.test(adam.respond('house rule two keeper pot')));

check('who is Adam The Volcano Vent Bot', /Adam The Volcano Vent Bot/.test(adam.respond('who are you?')));
check('other dice game redirect', /only cover.*Volcano Vent Dice|do not explain/i.test(adam.respond('how do you play yahtzee')));
check('other dice game not off topic signal', !adam._isLikelyOffTopic('how do you play yahtzee'));
check('off topic prompt blocks other dice games', /NEVER discuss.*other dice games/i.test(adamLlm.buildOffTopicSystemPrompt()));
check('off topic prompt craft bets only', /pretend.*antes|craft tokens|Never suggest real money/i.test(adamLlm.buildOffTopicSystemPrompt()));
check('system prompt blocks other dice games', /NEVER discuss.*other dice/i.test(adamLlm.buildSystemPrompt()));
check('system prompt confidential chats', /strictly confidential.*never shared with other users/i.test(adamLlm.buildSystemPrompt()));
check('off topic prompt confidential chats', /strictly confidential.*never shared with other users/i.test(adamLlm.buildOffTopicSystemPrompt()));
check('who mentions confidential chats', /strictly confidential|never shared with other users/i.test(adam.respond('who are you?')));
check('greet hints gpt setup when off', /setup GPT|API key|billing credits/i.test(adam.greet()));
localStorage.removeItem('adam-llm-settings');
check('setup gpt guide has billing credits', /billing credits|platform\.openai\.com\/account\/billing/i.test(adam.respond('setup GPT')));
check('api key how to routes setup', /Create an API key|sk-/i.test(adam.respond('how do I get an API key')));
check('help mentions setup gpt when off', /setup GPT|API key/i.test(adam.respond('help')));
localStorage.setItem('adam-llm-settings', JSON.stringify({ enabled: true, model: 'gpt-5.4-mini', apiKey: 'sk-test1234567890', customModel: '' }));
check('setup gpt when already on', /GPT is already on/i.test(adam.respond('setup GPT')));
check('settings mini guide lines', adamLlmSettings.setupGuideMiniLines().length === 5);
check('settings mini guide has billing', /billing credits/i.test(adamLlmSettings.renderSetupMiniHtml()));
check('settings mini guide has sk key', /sk-/.test(adamLlmSettings.renderSetupMiniHtml()));
check('kids paper lives', /paper|lives|no pretend/i.test(adam.respond('can kids play?')));
check('winning last tokens', /last player|tokens/i.test(adam.respond('who wins?')));
check('can three dice equal 6', /Yes.*three dice can equal 6/i.test(adam.respond('can three dice equal 6?')));
check('trying to equal six', /Yes.*trying to equal 6/i.test(adam.respond('are you trying to equal six')));
check('fallback catches equal six', /trying to equal 6|equal 6/i.test(adam.respond('equal six')));

adam.conversationHistory = [];
adam.lastTopic = 'general';
adam.respond('how does the countdown work?');
check('got it stays contextual', /countdown|what happens next/i.test(adam.respond('got it')));

adam.conversationHistory = [];
adam.lastTopic = 'general';
adam.respond('what is 2+2+2?');
check('what happens next after 2+2+2', /5|three dice|next player/i.test(adam.respond('what happens next?')));

adam.conversationHistory = [];
adam.lastTopic = 'general';
adam.respond('what happens on the vent?');
check('ok thanks after vent', /welcome|vent|lucky charm/i.test(adam.respond('ok thanks')));

adam.conversationHistory = [];
adam.lastTopic = 'general';
adam.respond('how do I play?');
adam.teachMode = false;
check('cool acknowledgment', /helps|what happens next|glad/i.test(adam.respond('cool')));

adam.conversationHistory = [
  { role: 'user', content: 'how do beads work' },
  { role: 'assistant', content: 'Beads are craft tokens. Want a mini example of ante night with beads?' }
];
check('sure continues mini example', /mini example|beads|antes/i.test(adam.respond('sure')));
adam.conversationHistory = [
  { role: 'user', content: 'how do beads work' },
  { role: 'assistant', content: 'Beads are craft tokens.\n\nWant a mini example? Reply **yes** or **sure**.' }
];
check('sure after reply yes or sure offer', /mini example|beads/i.test(adam.respond('sure')));
adam.conversationHistory = [
  { role: 'user', content: 'how does scoring work' },
  { role: 'assistant', content: 'Only Vent tokens count toward winning.' }
];
check('sure not treated as question', !/You asked|rough guide/i.test(adam.respond('sure')));
adam.conversationHistory = [
  { role: 'user', content: 'teach me' },
  { role: 'assistant', content: 'Countdown 6 to 1.\n\n**Try next:** "What happens on the Vent?"' }
];
check('definitely answers try next', /vent|rescue|miss/i.test(adam.respond('definitely')));
adam.conversationHistory = [
  { role: 'user', content: 'how do buttons work' },
  { role: 'assistant', content: 'Buttons are sewing buttons for pretend antes. Would you like a mini example?' }
];
check('okay go ahead continues', /mini example|buttons/i.test(adam.respond('okay go ahead')));
adam.conversationHistory = [
  { role: 'user', content: 'how do beads work' },
  { role: 'assistant', content: 'Want a mini example?' }
];
check('no thanks decline', /no worries|another|teach menu/i.test(adam.respond('no thanks')));
adam.conversationHistory = [
  { role: 'user', content: 'how do beads work' },
  { role: 'assistant', content: 'Beads are craft tokens for pretend antes.\n\nWant a mini example?' }
];
check('yes continues after offer', /mini example|beads/i.test(adam.respond('yes')));
adam.conversationHistory = [
  { role: 'user', content: 'how does scoring work' },
  { role: 'assistant', content: 'Only Vent tokens count toward winning.' }
];
check('yes without offer not glad', !/Glad that helps/i.test(adam.respond('yes')));
adam.conversationHistory = [
  { role: 'user', content: 'explain the vent' },
  { role: 'assistant', content: 'The Vent is when you miss the target. Want me to walk through a rescue example?' }
];
check('yes after question continues', /vent|rescue|mini example|walk/i.test(adam.respond('yes')));
adam.conversationHistory = [];
const beadsAnswer = adam._buildReply('how do beads work');
adam.conversationHistory = [
  { role: 'user', content: 'how do beads work' },
  { role: 'assistant', content: beadsAnswer }
];
check('yes after beads answer continues', /mini example|beads/i.test(adam.respond('yes')));
adam.conversationHistory = [];

adam.conversationHistory = [];
check('roll a six', /set.*one|one die|5 dice|tribute.*6/i.test(adam.respond('what happens when you roll a six')));
check('multiple sixes', /only need.*one|one six|extra sixes/i.test(adam.respond('what happens when you roll multiple sixes')));

adam.conversationHistory = [];
check('no dice left six players', /no dice left|zero dice|6 dice total|Vent/i.test(adam.respond('what happens when playing with a group say six players and there are no dice left to pass')));
check('no dice left not rolling six', !/tribute is not 6/i.test(adam.respond('what happens when there are no dice left to pass')));

localStorage.setItem('adam-birthday', JSON.stringify({ month: 1, day: 1, year: 1990 }));
check('house rules craft beads', /craft|sewing|any size|does not have to match/i.test(adam.respond('house rules for pretend bets')));
check('house rules helpline', /1-800-GAMBLER|426-2537/i.test(adam.respond('house rules for pretend bets')));
check('pretend bets antes vs side', /antes|side bets/i.test(adam.respond('how do pretend bets coincide with the rules are they side bets or antes')));
check('pretend bets suggestions', /suggest|House Rule|Vent tokens/i.test(adam.respond('suggestions on pretend bets for volcano vent dice')));
check('buttons and beads work concise', /pretend|antes|House Rule 1|Vent tokens/i.test(adam.respond('how do buttons and beads work')));
check('how do beads work alone', /beads|craft|Vent tokens|House Rule 1|antes/i.test(adam.respond('how do beads work')));
check('how do buttons work alone', /buttons|sewing|Vent tokens|House Rule 1|antes/i.test(adam.respond('how do buttons work')));
check('beads not fallback', !/^I'm a \*\*rough guide\*\*/.test(adam.respond('how do beads work')));
localStorage.setItem('adam-llm-settings', JSON.stringify({ enabled: true, model: 'gpt-5.4-mini', apiKey: 'sk-test1234567890', customModel: '' }));
check('gpt enhances plain english', adamLlm.shouldEnhance('how do beads work', adam.respond('how do beads work')));
check('off topic detected', adam._isLikelyOffTopic('what pizza should I order tonight'));
check('game topic not off topic', !adam._isLikelyOffTopic('how does the vent work'));
check('gpt enhances off topic fallback', adamLlm.shouldEnhance('weather tomorrow', adam.respond('weather tomorrow')));
check('gpt enhances relationship advice', adamLlm.shouldEnhance('relationship advice', adam.respond('relationship advice')));
check('game tips still route', /Tips \(beginner\)/i.test(adam.respond('beginner tips for volcano vent dice')));
adam.conversationHistory = [
  { role: 'user', content: 'walk me through' },
  { role: 'assistant', content: '**Step 1 of 5** — volcano wants 6.\n\nSay **continue** for step 2 of 5.' }
];
adam.walkthroughStep = 1;
check('please continues walkthrough step', /step 2 of 5|demand is 5/i.test(adam.respond('please')));
check('please alone does not dump full rules', !/Turn flow|Source: \*\*/i.test(adam.respond('please')));
adam.walkthroughStep = 0;
check('walkthrough starts at step 1', /step 1 of 5|volcano wants 6/i.test(adam.respond('walk me through')));
check('bare continue not full rules', !/\*\*Turn flow\*\*/i.test(adam.respond('continue')));
check('keeper okay guidance', /okay when|18\+|unanimous|return/i.test(adam.respond('when is keeper okay')));
check('keeper not okay', /not okay|kids|unsure|pressure/i.test(adam.respond('when is keeper not okay')));
check('tie no ties', /no ties|one player/i.test(adam.respond('what happens on a tie?')));
check('conversational game work', /countdown|Vent|last.*token/i.test(adam.respond('so how does this game work')));
check('napkin vote no birthday', /napkin vote|before the first roll|everyone says yes/i.test(adam.respond('what is a napkin vote')));
check('tell me about napkin vote', /House Rule|ante|lucky charm|return-all|unanimous/i.test(adam.respond('tell me about napkin vote')));
check('how do we decide', /unanimous|every player|napkin vote|House Rule 1/i.test(adam.respond('how do we decide')));
check('how do we decide keeper no birthday', /unanimous|everyone must|take part/i.test(adam.respond('how do we decide on keeper buttons and beads')));
check('everyone must agree', /unanimous|every player|take part/i.test(adam.respond('does everyone need to agree on keeper pot')));
check('house rule two unanimous', /napkin vote|unanimous|every player/i.test(adam.respond('house rule two keeper pot')));
check('how many rounds', /no fixed|one player|6.*1|chain/i.test(adam.respond('how many rounds')));
check('how long is a game', /no fixed|tokens|chain/i.test(adam.respond('how long is a game')));
check('how many rounds not turn flow', !/Turn flow each round/i.test(adam.respond('how many rounds are there')));
localStorage.setItem('adam-birthday', JSON.stringify({ month: 1, day: 1, year: 1990 }));
check('how do antes work', /When to pay|resets to 6|Vent tokens|House Rule 1/i.test(adam.respond('how do antes work with buttons and beads')));
check('when pay ante', /resets to 6|do not.*every roll|tribute 1/i.test(adam.respond('when do we pay antes')));
check('pot size one ante per reset', /no fixed pot|1 craft token per player|per reset|grows/i.test(adam.respond('what is the pot size one ante per reset')));
check('compound vent and lucky charm', () => {
  const r = adam.respond('what is the vent and what is a lucky charm?');
  return /Two questions|quick answers/i.test(r) && /Vent/i.test(r) && /lucky charm/i.test(r);
});
check('compound dice and players', () => {
  const r = adam.respond('how many dice do we use and how many players?');
  return /Two questions/i.test(r) && /6|dice/i.test(r) && /player/i.test(r);
});
check('buttons and beads not split', () => {
  const r = adam.respond('how do buttons and beads work?');
  return !/Two questions/i.test(r) && /pretend|antes|Vent tokens/i.test(r);
});
check('compound mixed betting age', () => {
  localStorage.removeItem('adam-birthday');
  localStorage.removeItem('adam-age-verified');
  const r = adam.respond('what is the vent and how do antes work?');
  return /Two questions/i.test(r) && /Vent/i.test(r) && /birthday|18/i.test(r);
});
localStorage.setItem('adam-birthday', JSON.stringify({ month: 1, day: 1, year: 1990 }));
check('compound lucky charm rules vs lore', () => {
  const r = adam.respond('what is a lucky charm and what is lucky charm lore?');
  return /Two questions/i.test(r)
    && /Lucky charm \(rules\)/i.test(r)
    && /Lucky charm lore/i.test(r)
    && /writes theirs on a piece of paper/i.test(r)
    && /pocket charm/i.test(r);
});
check('compound vent rules vs lore', () => {
  const r = adam.respond('what is the vent and why is it called the vent?');
  return /Two questions/i.test(r)
    && /Vent \(rules\)/i.test(r)
    && /Why "the Vent"\? \(lore\)/i.test(r)
    && /rescue reroll/i.test(r)
    && /throat of the mountain/i.test(r);
});
check('antes instructions clear', /Before play|shared bowl|craft bead/i.test(adam.respond('clear instructions on how antes work')));
check('house rules concise not wall', adam.respond('house rules for pretend bets').length < 1200);
check('no gold beads', /not.*gold|craft|skip gold/i.test(adam.respond('can I use gold beads for the pot?')));
check('no precious gem beads', /precious|diamond|ruby|sapphire|emerald|skip gold/i.test(adam.respond('can we use diamond beads for antes?')));
localStorage.setItem('adam-birthday', JSON.stringify({ month: 1, day: 1, year: 1990 }));
check('turquoise beads ok', /turquoise|regular stone|wood|glass/i.test(adam.respond('can we use turquoise stone beads for the pot?')));
check('bead value wood glass preferred', /wood.*glass|glass.*wood|preferred/i.test(adam.respond('how do beads work?')));
check('seeds and beans antes', /seed|bean|dried|sunflower|pumpkin/i.test(adam.respond('can we use seeds and beans for antes')));
check('no poker chips marbles', /never.*poker|marble|jack/i.test(adam.respond('can I use poker chips for antes')));
check('craft token list expanded', /Paper clips|Seeds|Marbles|pebble/i.test(adam.respond('what can we use for antes')));
check('what can be used for bets', /pretend bets|Seeds|Marbles|poker chips/i.test(adam.respond('what can be used for bets')));

adam.conversationHistory = [];
adam.lastTopic = 'general';
localStorage.setItem('adam-birthday', JSON.stringify({ month: 1, day: 1, year: 1990 }));
adam.respond('how do antes work with buttons and beads');
check('betting tell me more continues', /After antes|House Rule|keeper|plain English/i.test(adam.respond('tell me more')));

adam.conversationHistory = [];
adam.lastTopic = 'general';
adam.respond('what can be used for bets');
check('betting what about keeper', /keeper|napkin|unanimous/i.test(adam.respond('what about keeper')));

adam.conversationHistory = [];
adam.lastTopic = 'general';
adam.respond('house rules for pretend bets');
check('betting got it follow up', /pretend bets|keeper|plain English/i.test(adam.respond('got it')));

adam.conversationHistory = [];
adam.lastTopic = 'general';
adam.respond('how do antes work');
check('betting what happens next', /After antes|napkin|return/i.test(adam.respond('what happens next')));
localStorage.setItem('adam-birthday', JSON.stringify({ month: 1, day: 1, year: 1990 }));
check('no chasing losses', /no chasing|return-all|do not.*raise/i.test(adam.respond('should we chase losses on pretend bets')));
check('no double or nothing', /no double|double-or-nothing|not a casino/i.test(adam.respond('double or nothing on the ante bowl')));
check('avoid house rule 2', /avoid House Rule 2|return all|chasing|double-or-nothing/i.test(adam.respond('when should we avoid House Rule 2')));
check('teach me not lecture', /one breath|teach by.*question|not a lecture/i.test(adam.respond('teach me')));
check('teach menu categories', /Countdown|House rules|Vent|Lore|Game modes/i.test(adam.respond('teach menu')));
check('lore why vent', /vent.*opening|crater|rim|Why/i.test(adam.respond('why is it called the vent')));
check('lore vent edge', /edge|rim|lip|Vent/i.test(adam.respond('are you on the edge of the volcano')));
check('lore countdown meaning', /rings|6.*5.*4|step|volcano/i.test(adam.respond('what does the countdown mean')));
check('lore crawling down', /descend|crawl|table story|step/i.test(adam.respond('are we crawling down the volcano')));
check('lore overview', /shared volcano|6→1|Vent/i.test(adam.respond('volcano vent lore')));
check('help mentions lore', /Lore|Vent|countdown/i.test(adam.respond('help')));
adam.respond('teach me');
check('teach question flow', /6→5|Try next/i.test(adam.respond('how does the countdown work?')));
check('teach gentle vent', /second.*failed rescue|Gentle Vent/i.test(adam.respond('what is gentle Vent?')));
adam.teachMode = false;
adam.conversationHistory = [];
check('gambling help no birthday', /1-800-GAMBLER|426-2537/i.test(adam.respond('buttons and beads getting out of hand')));

check('rulebooks to quote', /Home Rule Guide|quote the rules/i.test(adam.respond('are there rule books we can quote for volcano vent dice')));
check('quote the rules lecture', /Quoted from|Volcano Vent Dice Home Rule Guide|countdown/i.test(adam.respond('quote the rules')));
check('full rules cites guide', /Home Rule Guide|volcano-vent-adam/i.test(adam.respond('full rules')));

console.log('\nPassed', ok, '/', total);
process.exit(ok === total ? 0 : 1);