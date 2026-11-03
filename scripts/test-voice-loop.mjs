import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const load = (f) => fs.readFileSync(path.join(root, f), 'utf8');

globalThis.window = globalThis;
globalThis.localStorage = {
  _data: {},
  getItem(k) { return this._data[k] ?? null; },
  setItem(k, v) { this._data[k] = String(v); },
  removeItem(k) { delete this._data[k]; }
};

const input = { value: '' };
globalThis.document = {
  getElementById(id) {
    if (id === 'chat-input') return input;
    return null;
  }
};

let starts = 0;
let lastUtter = null;
const spoken = [];

globalThis.speechSynthesis = {
  cancel() {
    const utter = lastUtter;
    lastUtter = null;
    utter?.onend?.();
  },
  speak(utter) {
    spoken.push(utter.text);
    lastUtter = utter;
  },
  getVoices() {
    return [{ name: 'Microsoft David', lang: 'en-US' }];
  },
  addEventListener() {}
};

globalThis.SpeechSynthesisUtterance = class {
  constructor(text) { this.text = text; }
};

class FakeRecognition {
  start() {
    starts += 1;
    this.onstart?.();
  }
  stop() { this.onend?.(); }
  abort() {
    this.onerror?.({ error: 'aborted' });
    this.onend?.();
  }
}
globalThis.webkitSpeechRecognition = FakeRecognition;

const sent = [];
const drafts = [];
globalThis.showVoiceDraft = (text) => {
  drafts.push(String(text || ''));
};
globalThis.sendMessage = () => {
  sent.push(input.value);
  adamVoice.speak('The Vent is the rim.');
};

new Function(load('js/voice.js'))();

let ok = 0;
let fail = 0;
function check(label, pass) {
  if (pass) ok++;
  else fail++;
  console.log(pass ? 'OK' : 'FAIL', label);
}

adamVoice.resumeDelay = 0;
adamVoice._endPause = 50;
adamVoice.init();
adamVoice.loop = true;

async function waitTurn() {
  await new Promise(resolve => setTimeout(resolve, adamVoice._endPause + 40));
}

adamVoice.startTalk();
check('mic opens', starts === 1 && adamVoice._phase === 'listening');
check('mic stays open across a breath', adamVoice._recognition.continuous === true);

adamVoice._recognition.onresult({
  resultIndex: 0,
  results: [{ 0: { transcript: 'what is the vent' }, isFinal: true, length: 1 }]
});
check('a short result does not send yet', sent.length === 0);
await waitTurn();
check('heard line is sent', sent.length === 1 && sent[0] === 'what is the vent');
check('reply is spoken', spoken.includes('The Vent is the rim.'));
check('mic stays shut while Adam speaks', starts === 1 && adamVoice._phase === 'speaking');

lastUtter.onend();
await new Promise(resolve => setTimeout(resolve, 30));
check('mic reopens after Adam finishes', starts === 2 && adamVoice._phase === 'listening');

adamVoice.loop = false;
adamVoice._recognition.onresult({
  resultIndex: 0,
  results: [{ 0: { transcript: 'who wins' }, isFinal: true, length: 1 }]
});
await waitTurn();
const startsAfterOneShot = starts;
lastUtter.onend();
await new Promise(resolve => setTimeout(resolve, 30));
check('one reply ends the loop when continue is off', starts === startsAfterOneShot && adamVoice._session === false);

adamVoice.loop = true;
adamVoice.startTalk();
const beforeStop = starts;
adamVoice.stopTalk();
await new Promise(resolve => setTimeout(resolve, 30));
check('stop closes the mic', starts === beforeStop && adamVoice._phase === 'idle' && adamVoice._session === false);

adamVoice.loop = true;
adamVoice.startTalk();
const sentBeforeLive = sent.length;
adamVoice._recognition.onresult({
  resultIndex: 0,
  results: [{ 0: { transcript: 'hello from the mic' }, isFinal: false, length: 1 }]
});
check('live voice line shows on the chat', drafts.at(-1) === 'hello from the mic');
check('live voice line waits for the pause', sent.length === sentBeforeLive);
adamVoice._onListenEnd();
await new Promise(resolve => setTimeout(resolve, 30));
check('a short pause keeps the mic open', sent.length === sentBeforeLive && adamVoice._phase === 'listening' && adamVoice._session === true);
adamVoice._recognition.onresult({
  resultIndex: 0,
  results: [{ 0: { transcript: 'and the beads' }, isFinal: true, length: 1 }]
});
await waitTurn();
check('the whole line is posted after you finish', sent.at(-1) === 'hello from the mic and the beads');
adamVoice.stopTalk();

adamVoice.loop = true;
adamVoice.startTalk();
const sentBeforeParts = sent.length;
adamVoice._recognition.onresult({
  resultIndex: 0,
  results: [{ 0: { transcript: 'tell me about' }, isFinal: true, length: 1 }]
});
await new Promise(resolve => setTimeout(resolve, 20));
check('a breath between phrases does not send', sent.length === sentBeforeParts);
adamVoice._recognition.onresult({
  resultIndex: 1,
  results: [
    { 0: { transcript: 'tell me about' }, isFinal: true, length: 1 },
    { 0: { transcript: 'the vent' }, isFinal: true, length: 1 }
  ]
});
await waitTurn();
check('both phrases go as one line', sent.at(-1) === 'tell me about the vent' && sent.length === sentBeforeParts + 1);
adamVoice.stopTalk();

clearTimeout(adamVoice._voiceWatch);
adamVoice.voices = [
  { name: 'Microsoft David', lang: 'en-US', voiceURI: 'david' },
  { name: 'Microsoft Zira', lang: 'en-US', voiceURI: 'zira' },
  { name: 'Google UK English Female', lang: 'en-GB', voiceURI: 'uk-female' }
];
adamVoice.gender = 'female';
adamVoice.lang = 'en-GB';
adamVoice.voiceUri = '';
check('AI picks the female UK voice', adamVoice._pickVoice()?.voiceURI === 'uk-female');
adamVoice.gender = 'male';
adamVoice.lang = '';
adamVoice.voiceUri = 'david';
check('AI keeps the chosen male voice', adamVoice._pickVoice()?.name === 'Microsoft David');
adamVoice.lang = 'en-GB';
check('AI listens in the chosen language', adamVoice._listenLang() === 'en-GB');

adamVoice.voices = [
  { name: 'Google US English', lang: 'en-US', voiceURI: 'google', localService: false },
  { name: 'My Personal TTS', lang: '', voiceURI: 'custom', localService: true }
];
adamVoice.gender = 'any';
adamVoice.lang = '';
adamVoice.voiceUri = '';
check('AI prefers the TTS installed on this device', adamVoice._pickVoice()?.voiceURI === 'custom');

check('tell me about the rent is the vent', adamVoice._correctHeard('tell me about the rent') === 'tell me about the vent');
check('what is the rent is the vent', adamVoice._correctHeard('what is the rent') === 'what is the vent');
check('housing rent stays rent', adamVoice._correctHeard('I need to pay rent') === 'I need to pay rent');
check('tell me about the moon is the vent', adamVoice._correctHeard('tell me about the moon') === 'tell me about the vent');
check('full moon stays the moon', adamVoice._correctHeard('look at the full moon') === 'look at the full moon');
check('tell me about the event is the vent', adamVoice._correctHeard('tell me about the event') === 'tell me about the vent');
check('vent alternative beats rent', adamVoice._bestAlternative({
  0: { transcript: 'tell me about the rent' },
  1: { transcript: 'tell me about the vent' },
  length: 2
}) === 'tell me about the vent');

adamVoice.loop = true;
adamVoice.startTalk();
const sentBeforeRent = sent.length;
adamVoice._recognition.onresult({
  resultIndex: 0,
  results: [{
    0: { transcript: 'tell me about the rent' },
    isFinal: true,
    length: 1
  }]
});
check('heard rent waits through the breath', sent.length === sentBeforeRent);
await waitTurn();
check('heard rent is sent as vent', sent.at(-1) === 'tell me about the vent' && sent.length === sentBeforeRent + 1);
check('chat draft shows vent', drafts.at(-1) === 'tell me about the vent');
adamVoice.stopTalk();

adamVoice.loop = true;
adamVoice.startTalk();
const sentBeforeLong = sent.length;
adamVoice._recognition.onresult({
  resultIndex: 0,
  results: [{ 0: { transcript: 'the rent is the rim of the volcano' }, isFinal: true, length: 1 }]
});
check('a long line is not cut off on the first result', sent.length === sentBeforeLong);
await waitTurn();
check('a long rent line is sent as vent', sent.at(-1) === 'the vent is the rim of the volcano');
adamVoice.stopTalk();

adamVoice.loop = true;
adamVoice.startTalk();
adamVoice._recognition.onresult({
  resultIndex: 0,
  results: [{
    0: { transcript: 'tell me about the moon' },
    isFinal: true,
    length: 1
  }]
});
await waitTurn();
check('heard moon is sent as vent', sent.at(-1) === 'tell me about the vent');
check('chat draft shows vent for moon', drafts.at(-1) === 'tell me about the vent');
adamVoice.stopTalk();

check('meant is not rewritten', adamVoice._correctHeard('tell me what you meant') === 'tell me what you meant');
check('a bright moon stays a moon', adamVoice._correctHeard('the moon is bright tonight') === 'the moon is bright tonight');
check('to the moon stays', adamVoice._correctHeard('to the moon') === 'to the moon');
check('the rent in a sentence is the vent', adamVoice._correctHeard('the rent is the rim of the volcano') === 'the vent is the rim of the volcano');
check('rent alone is the vent', adamVoice._correctHeard('rent') === 'vent');
check('the went is the vent', adamVoice._correctHeard('hit the went') === 'hit the vent');
check('I went home stays', adamVoice._correctHeard('I went home') === 'I went home');
check('the event in a sentence is the vent', adamVoice._correctHeard('stand on the event') === 'stand on the vent');
check('next event stays', adamVoice._correctHeard('the next event') === 'the next event');
check('a heard sex is six', adamVoice._correctHeard('roll a sex') === 'roll a six');
check('Sex at the start is Six', adamVoice._correctHeard('Sex') === 'Six');
check('dirty talk is not rewritten into six', adamVoice._correctHeard('talk dirty to me') === 'talk dirty to me');
check('six beats sex in the alternatives', adamVoice._bestAlternative({
  0: { transcript: 'roll a sex' },
  1: { transcript: 'roll a six' },
  length: 2
}) === 'roll a six');
const savedPause = adamVoice._endPause;
adamVoice._endPause = 5000;
check('a finished line waits', adamVoice._pauseFor('what is the vent') === 5000);
check('an unfinished line waits longer', adamVoice._pauseFor('tell me about the') === 7500);
adamVoice._endPause = savedPause;

adamVoice._speakingText = 'The Vent is the rim. Ask me about the countdown.';
adamVoice._phase = 'speaking';
adamVoice._session = true;
adamVoice._sentThisListen = false;
const sentBeforeEcho = sent.length;
adamVoice._onHeard({
  resultIndex: 0,
  results: [{ 0: { transcript: 'the vent is the rim' }, isFinal: true, length: 1 }]
});
check('echo of Adam is ignored', sent.length === sentBeforeEcho && adamVoice._phase === 'speaking');
check('a short line is not echo', adamVoice._isEcho('the vent') === false);
const sentBeforeVent = sent.length;
adamVoice._onHeard({
  resultIndex: 0,
  results: [{ 0: { transcript: 'the vent' }, isFinal: true, length: 1 }]
});
check('saying the vent stops Adam without sending yet', adamVoice._phase === 'listening' && sent.length === sentBeforeVent);
await waitTurn();
check('saying the vent interrupts Adam', sent.at(-1) === 'the vent');

adamVoice._speakingText = 'The Vent is the rim. Ask me about the countdown.';
adamVoice._phase = 'speaking';
adamVoice._session = true;
adamVoice._sentThisListen = false;
adamVoice._onHeard({
  resultIndex: 0,
  results: [{ 0: { transcript: 'no I meant the beads' }, isFinal: true, length: 1 }]
});
check('a correction stops Adam', adamVoice._phase === 'listening' && adamVoice._session === true);
await waitTurn();
check('a correction interrupts Adam', sent.at(-1) === 'no I meant the beads' && adamVoice._session === true);

adamVoice._phase = 'speaking';
adamVoice._session = true;
adamVoice.toggleTalk();
check('mic tap during speech keeps the call', adamVoice._session === true && adamVoice._phase === 'listening');

const spokenBeforeCut = spoken.length;
adamVoice.autoRead = true;
adamVoice._session = true;
adamVoice.speak('Alpha sentence. Beta sentence.');
check('Adam starts with the first sentence only', spoken.at(-1) === 'Alpha sentence.');
check('the rest of the line is still queued', adamVoice._queue[0] === 'Beta sentence.');
adamVoice.interrupt();
check('interrupt throws away the rest', adamVoice._queue.length === 0);
check('interrupt does not speak the next sentence', spoken.slice(spokenBeforeCut).every(line => line !== 'Beta sentence.'));
adamVoice._ignoreUntil = Date.now() + 5000;
adamVoice._phase = 'listening';
adamVoice._sentThisListen = false;
const sentBeforeTail = sent.length;
adamVoice._onHeard({
  resultIndex: 0,
  results: [{ 0: { transcript: 'tail of the last line' }, isFinal: true, length: 1 }]
});
check('speaker tail is not a new turn', sent.length === sentBeforeTail);
adamVoice._ignoreUntil = 0;
adamVoice.stopTalk();

let asked = 0;
adamVoice._navigator = {
  userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel) AppleWebKit/537.36 Chrome/120.0.0.0 Mobile',
  mediaDevices: {
    getUserMedia() {
      asked += 1;
      const err = new Error('denied');
      err.name = 'NotAllowedError';
      return Promise.reject(err);
    }
  }
};
adamVoice.stopTalk();
adamVoice._recognition = null;
adamVoice._needUnlock = false;
adamVoice._heardOnce = false;
const startsBeforeCall = starts;
adamVoice.startTalk();
check('the first tap listens without asking chrome first', starts === startsBeforeCall + 1 && asked === 0 && adamVoice._phase === 'listening');
check('mobile chrome does not use continuous capture', adamVoice._recognition.continuous === false);
adamVoice._heardOnce = false;
adamVoice._onListenError({ error: 'not-allowed' });
check('a denied mic explains the lock icon', adamVoice._session === false && adamVoice._needUnlock === true && /lock icon/i.test(adamVoice._statusText) && /tap the microphone/i.test(adamVoice._statusText));

adamVoice._navigator.mediaDevices.getUserMedia = () => {
  asked += 1;
  return Promise.resolve({ getTracks: () => [{ stop() {} }] });
};
const startsAfterDeny = starts;
adamVoice.startTalk();
await new Promise(resolve => setTimeout(resolve, 30));
check('allowing the mic waits for another tap', asked === 1 && starts === startsAfterDeny && /again/i.test(adamVoice._statusText));
adamVoice._recognition = null;
adamVoice.startTalk();
check('the next tap hears you', starts === startsAfterDeny + 1 && adamVoice._phase === 'listening' && asked === 1);

adamVoice._heardOnce = true;
adamVoice._glitchTries = 0;
adamVoice._session = true;
adamVoice._phase = 'listening';
const startsOnGlitch = starts;
adamVoice._onListenError({ error: 'not-allowed' });
check('a later mic glitch keeps the call and retries', adamVoice._session === true && starts === startsOnGlitch + 1);
adamVoice._glitchTries = 4;
adamVoice._onListenError({ error: 'not-allowed' });
check('too many glitches ask for another tap', adamVoice._session === true && /Tap the microphone/i.test(adamVoice._statusText));
adamVoice.stopTalk();
adamVoice._navigator = null;

const spokenClean = adamVoice.stripMarkdown('Countdown **6→5→4**. 6 dice · 3 tokens. 🎲 image 🌋');
check('speech skips the arrow, the dot, and the image', !/[→·•🎲🌋]/.test(spokenClean) && !/\bimage\b/i.test(spokenClean) && /6 to 5 to 4/.test(spokenClean) && /6 dice/.test(spokenClean) && /3 tokens/.test(spokenClean));

console.log(`\nPassed ${ok} / ${ok + fail}`);
if (fail) process.exit(1);
