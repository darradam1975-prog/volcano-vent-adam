/**
 * Account sign-in on Netlify — same rules as the Cloudflare /auth route.
 * Google ID tokens are checked. Passwords are stored as hashes in Blobs.
 */
import { connectLambda, getStore, setEnvironmentContext } from '@netlify/blobs';
import { handleAuth } from '../../cloudflare/auth.mjs';

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders(), body: '' };
  }

  let kv;
  try {
    kv = blobKv(openStore(event));
  } catch (e) {
    return storageDown(e);
  }

  const url = event.rawUrl || `https://volcano-vent.com${event.path || '/.netlify/functions/auth'}`;
  const request = new Request(url, {
    method: event.httpMethod,
    headers: { 'Content-Type': 'application/json' },
    body: event.httpMethod === 'GET' || event.httpMethod === 'HEAD' ? undefined : (event.body || '{}')
  });
  const env = {
    ADAM_KV: kv,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || ''
  };

  try {
    const res = await handleAuth(request, env);
    const body = await res.text();
    return {
      statusCode: res.status,
      headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
      body
    };
  } catch (e) {
    return storageDown(e);
  }
}

function storageDown(e) {
  const msg = String(e?.message || e || '');
  if (/not been configured|MissingBlobsEnvironment|Blobs/i.test(msg)) {
    return json(503, {
      error: 'Account storage is not on the cloud yet. Chats still stay on this device.'
    });
  }
  return json(500, { error: 'Account sign-in failed. Try again.' });
}

function blobKv(store) {
  return {
    async get(key) {
      try {
        return await store.get(key, { consistency: 'strong' });
      } catch {
        return store.get(key);
      }
    },
    async put(key, value) {
      await store.set(key, String(value));
    },
    async delete(key) {
      await store.delete(key);
    }
  };
}

function wireBlobs(event) {
  if (!event?.blobs) return;
  try {
    const data = JSON.parse(Buffer.from(event.blobs, 'base64').toString('utf8'));
    setEnvironmentContext({
      deployID: event.headers?.['x-nf-deploy-id'] || event.headers?.['X-Nf-Deploy-Id'],
      siteID: event.headers?.['x-nf-site-id'] || event.headers?.['X-Nf-Site-Id'],
      token: data.token,
      edgeURL: data.url || data.edgeURL,
      apiURL: data.apiURL || data.api_url,
      uncachedEdgeURL: data.uncachedURL || data.uncachedEdgeURL || data.uncached_edge_url
    });
  } catch {
    connectLambda(event);
  }
}

function openStore(event) {
  wireBlobs(event);
  const siteID = event?.headers?.['x-nf-site-id'] || event?.headers?.['X-Nf-Site-Id']
    || process.env.SITE_ID || process.env.NETLIFY_SITE_ID;
  let token;
  try {
    if (event?.blobs) {
      const data = JSON.parse(Buffer.from(event.blobs, 'base64').toString('utf8'));
      token = data.token;
    }
  } catch { /* ignore */ }
  token = token || process.env.NETLIFY_AUTH_TOKEN || process.env.NETLIFY_BLOBS_TOKEN;
  if (siteID && token) return getStore({ name: 'adam-accounts', siteID, token });
  return getStore('adam-accounts');
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Cache-Control': 'no-store, no-cache, must-revalidate'
  };
}

function json(statusCode, obj) {
  return {
    statusCode,
    headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(obj)
  };
}
