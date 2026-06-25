import fs from 'fs';
import path from 'path';
import os from 'os';

const accountId = '70d886de6eb14e69720d6010289f6d0f';
const subdomain = 'darradam1975';
const scriptName = 'volcano-vent-adam-api';

const configPath = path.join(
  os.homedir(),
  'AppData/Roaming/xdg.config/.wrangler/config/default.toml'
);
const toml = fs.readFileSync(configPath, 'utf8');
const tokenMatch = toml.match(/oauth_token = "([^"]+)"/);
if (!tokenMatch) {
  console.error('No wrangler oauth token — run: npx wrangler login');
  process.exit(1);
}
const token = tokenMatch[1];

async function api(apiPath, method = 'GET', body) {
  const res = await fetch(`https://api.cloudflare.com/client/v4${apiPath}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: body ? JSON.stringify(body) : undefined
  });
  return res.json();
}

const get = await api(`/accounts/${accountId}/workers/subdomain`);
console.log('Current subdomain:', get.result?.subdomain || '(none)');

if (!get.result?.subdomain) {
  const put = await api(`/accounts/${accountId}/workers/subdomain`, 'PUT', { subdomain });
  if (!put.success) {
    console.error('Failed to register subdomain:', put.errors);
    process.exit(1);
  }
  console.log('Registered workers.dev subdomain:', subdomain);
}

const enable = await api(
  `/accounts/${accountId}/workers/scripts/${scriptName}/subdomain`,
  'POST',
  { enabled: true }
);
if (!enable.success) {
  console.error('Failed to enable script on workers.dev:', enable.errors);
  process.exit(1);
}

const url = `https://${scriptName}.${subdomain}.workers.dev`;
console.log('Worker URL:', url);
console.log('Health check:', `${url}/health`);