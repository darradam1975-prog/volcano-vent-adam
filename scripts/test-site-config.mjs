import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const code = fs.readFileSync(path.join(root, 'js/site-config.js'), 'utf8');

function loadAdamSite(hostname, pathname) {
  const win = { location: { hostname, pathname } };
  return new Function('window', `${code}\nreturn adamSite;`)(win);
}

let ok = 0;
let total = 0;
function check(label, pass) {
  total++;
  if (pass) ok++;
  console.log(pass ? 'OK' : 'FAIL', label);
}

const gh = loadAdamSite('darradam1975-prog.github.io', '/volcano-vent-adam/index.html');
check('github pages detected', gh.isGitHubPages === true);
check('no cloud on github', gh.hasCloudBackend === false);
check('base path repo', gh.basePath === '/volcano-vent-adam/');
check('share url query form', /share\.html\?s=abc/.test(gh.shareViewUrl('abc')));

const netlify = loadAdamSite('volcano-vent-adam.netlify.app', '/');
check('netlify has cloud', netlify.hasCloudBackend === true);
check('netlify share pretty url', /\/s\/abc/.test(netlify.shareViewUrl('abc')));

console.log('\nPassed', ok, '/', total);
process.exit(ok === total ? 0 : 1);