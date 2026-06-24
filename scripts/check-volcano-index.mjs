import fs from 'fs';
const src = fs.readFileSync('C:/Users/darr7/sampson-dice-bot/scripts/generate-kids-pack-2.mjs', 'utf8');
const themesBlock = src.match(/const THEMES = (\[[\s\S]*?\n\]);/)[1];
const mechBlock = src.match(/const MECHANICS = (\[[\s\S]*?\n\]);/)[1];
const THEMES = eval(themesBlock);
const MECHANICS = eval(mechBlock);

for (let i = 0; i < 113; i++) {
  const spec = THEMES[i % THEMES.length];
  if (spec[0] === 'Volcano' && spec[1] === 'Vent') {
    const mech = MECHANICS[i % MECHANICS.length];
    console.log('i=', i, 'dice=', spec[2], 'minAge=', spec[3], 'mech=', mech.key);
    console.log('  winning:', mech.win.replace('{target}', '12'));
    console.log('  flow:', mech.flow);
  }
}