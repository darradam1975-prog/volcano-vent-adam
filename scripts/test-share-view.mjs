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

check('relative css path', /href="css\/styles\.css/.test(html));
check('cloud-config script', /js\/cloud-config\.js/.test(html));
check('site-config script', /js\/site-config\.js/.test(html));
check('worker share endpoint', /functionUrl\('share'\)/.test(html));
check('no relative js share', !/src="js\/share\.js/.test(html));
check('finally hides loading', /finally/.test(html) && /loading.*hidden/.test(html));
check('share id from path', /indexOf\('s'\)/.test(html));
check('github home links', /share-home-link/.test(html));

console.log('\nPassed', ok, '/', total);
process.exit(ok === total ? 0 : 1);