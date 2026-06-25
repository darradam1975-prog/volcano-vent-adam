import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const html = fs.readFileSync(path.join(root, 'share.html'), 'utf8');

let ok = 0;
let total = 0;
function check(label, pass) {
  total++;
  if (pass) ok++;
  console.log(pass ? 'OK' : 'FAIL', label);
}

check('base href root', /<base href="\/">/.test(html));
check('absolute css path', /href="\/css\/styles\.css/.test(html));
check('inline fetch api', /\/\.netlify\/functions\/share/.test(html));
check('no relative js share', !/src="js\/share\.js/.test(html));
check('finally hides loading', /finally/.test(html) && /loading.*hidden/.test(html));
check('share id from path', /parts\[0\] === 's'/.test(html));

console.log('\nPassed', ok, '/', total);
process.exit(ok === total ? 0 : 1);