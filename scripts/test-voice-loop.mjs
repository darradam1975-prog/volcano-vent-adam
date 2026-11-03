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
adamVoice.init();
adamVoice.loop = true;

adamVoice.startTalk();
check('mic opens', starts === 1 && adamVoice._phase === 'listening');

adamVoice._recognition.onresult({
  resultIndex: 0,
  results: [{ 0: { transcript: 'what is the vent' }, isFinal: true, length: 1 }]
});
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
check('paused voice line is posted to the chat', sent.at(-1) === 'hello from the mic');
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
check('heard rent is sent as vent', sent.at(-1) === 'tell me about the vent' && sent.length === sentBeforeRent + 1);
check('chat draft shows vent', drafts.at(-1) === 'tell me about the vent');
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
check('heard moon is sent as vent', sent.at(-1) === 'tell me about the vent');
check('chat draft shows vent for moon', drafts.at(-1) === 'tell me about the vent');
adamVoice.stopTalk();

check('meant is not rewritten', adamVoice._correctHeard('tell me what you meant') === 'tell me what you meant');
check('a bright moon stays a moon', adamVoice._correctHeard('the moon is bright tonight') === 'the moon is bright tonight');
check('to the moon stays', adamVoice._correctHeard('to the moon') === 'to the moon');

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
adamVoice._onHeard({
  resultIndex: 0,
  results: [{ 0: { transcript: 'the vent' }, isFinal: true, length: 1 }]
});
check('saying the vent interrupts Adam', sent.at(-1) === 'the vent');

adamVoice._speakingText = 'The Vent is the rim. Ask me about the countdown.';
adamVoice._phase = 'speaking';
adamVoice._session = true;
adamVoice._sentThisListen = false;
adamVoice._onHeard({
  resultIndex: 0,
  results: [{ 0: { transcript: 'no I meant the beads' }, isFinal: true, length: 1 }]
});
check('a correction interrupts Adam', sent.at(-1) === 'no I meant the beads' && adamVoice._session === true);

adamVoice._phase = 'speaking';
adamVoice._session = true;
adamVoice.toggleTalk();
check('mic tap while Adam speaks listens for a correction', adamVoice._session === true && adamVoice._phase === 'listening');
adamVoice.stopTalk();

console.log(`\nPassed ${ok} / ${ok + fail}`);
if (fail) process.exit(1);
