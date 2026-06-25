import { sanitizeShareId, sanitizeSharePayload, generateShareId } from '../netlify/functions/share.mjs';

let ok = 0;
let total = 0;

function check(label, pass) {
  total++;
  if (pass) ok++;
  console.log(pass ? 'OK' : 'FAIL', label);
}

check('sanitize valid id', sanitizeShareId('vent-abc12345-xyz') === 'vent-abc12345-xyz');
check('sanitize rejects short', !sanitizeShareId('ab'));
check('sanitize rejects bad chars', !sanitizeShareId('vent_bad!'));
check('generate share id valid', !!sanitizeShareId(generateShareId()));

const good = sanitizeSharePayload({
  title: 'Vent help',
  messages: [
    { role: 'user', text: 'How does the Vent work?', at: 1 },
    { role: 'assistant', text: 'Miss the target…', source: '🌋 Adam', at: 2 }
  ]
});
check('sanitize payload messages', good?.messageCount === 2);
check('sanitize payload title', good?.title === 'Vent help');
check('sanitize rejects empty', !sanitizeSharePayload({ title: 'x', messages: [] }));
check('sanitize strips system', sanitizeSharePayload({
  messages: [{ role: 'system', text: 'secret' }, { role: 'user', text: 'hi', at: 1 }]
})?.messageCount === 1);

console.log('\nPassed', ok, '/', total);
process.exit(ok === total ? 0 : 1);