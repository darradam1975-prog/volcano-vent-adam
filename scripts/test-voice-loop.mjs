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

console.log(`\nPassed ${ok} / ${ok + fail}`);
if (fail) process.exit(1);
