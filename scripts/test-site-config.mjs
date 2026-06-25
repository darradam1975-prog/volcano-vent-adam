import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

function loadAdamSite(hostname, pathname, cloudBase = '') {
  const cloudCode = fs.readFileSync(path.join(root, 'js/cloud-config.js'), 'utf8')
    .replace(/const ADAM_CLOUD_API_BASE = '[^']*';/, `const ADAM_CLOUD_API_BASE = '${cloudBase}';`);
  const siteCode = fs.readFileSync(path.join(root, 'js/site-config.js'), 'utf8');
  const win = { location: { hostname, pathname } };
  return new Function('window', `${cloudCode}\n${siteCode}\nreturn adamSite;`)(win);
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
check('no cloud on github without worker url', gh.hasCloudBackend === false);
check('base path repo', gh.basePath === '/volcano-vent-adam/');
check('share url query form', /share\.html\?s=abc/.test(gh.shareViewUrl('abc')));

const ghWorker = loadAdamSite('darradam1975-prog.github.io', '/volcano-vent-adam/', 'https://api.example.workers.dev');
check('github with worker has cloud', ghWorker.hasCloudBackend === true);
check('worker chat url', ghWorker.functionUrl('chat') === 'https://api.example.workers.dev/chat');
check('worker sync url', ghWorker.functionUrl('sync') === 'https://api.example.workers.dev/sync');

const netlify = loadAdamSite('volcano-vent-adam.netlify.app', '/');
check('netlify has cloud', netlify.hasCloudBackend === true);
check('netlify share pretty url', /\/s\/abc/.test(netlify.shareViewUrl('abc')));
check('netlify chat path', netlify.functionUrl('chat') === '/.netlify/functions/chat');

console.log('\nPassed', ok, '/', total);
process.exit(ok === total ? 0 : 1);