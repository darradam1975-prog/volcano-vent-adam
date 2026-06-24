/**
 * OpenAI proxy — supports Chat Completions and Responses API (GPT-5.x).
 */
export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders(), body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'POST only' });
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return json(400, { error: 'Invalid JSON in request body' });
  }

  const apiKey = String(body.apiKey || process.env.OPENAI_API_KEY || '').trim();
  if (!apiKey) {
    return json(401, { error: 'No API key — paste your OpenAI key in Settings' });
  }
  if (/^xai-/i.test(apiKey)) {
    return json(400, {
      error: 'That is an xAI (Grok) key — Adam needs an OpenAI key from platform.openai.com/api-keys (starts with sk-)'
    });
  }
  if (!/^sk-/i.test(apiKey)) {
    return json(400, {
      error: 'OpenAI keys start with sk- — create one at platform.openai.com/api-keys'
    });
  }

  const model = String(body.model || 'gpt-4o-mini').trim();
  const messages = Array.isArray(body.messages) ? body.messages : [];
  if (!messages.length) {
    return json(400, { error: 'No messages to send' });
  }

  try {
    const result = await callOpenAI({ model, apiKey, messages });
    return json(200, { reply: result.reply, modelUsed: result.modelUsed, api: result.api });
  } catch (e) {
    return json(e.status || 500, { error: e.message || String(e) });
  }
}

async function callOpenAI({ model, apiKey, messages }) {
  const attempts = buildAttempts(model, messages);
  let lastError = null;

  for (const attempt of attempts) {
    try {
      const data = await fetchOpenAI(attempt, apiKey);
      const reply = extractReply(data, attempt.api);
      if (!reply) throw apiError(502, 'OpenAI returned an empty reply');
      return { reply, modelUsed: attempt.model, api: attempt.api };
    } catch (err) {
      lastError = err;
      if (!err.retryable) break;
    }
  }

  throw lastError || apiError(500, 'OpenAI request failed');
}

function buildAttempts(model, messages) {
  const attempts = [];
  if (prefersResponsesApi(model)) {
    attempts.push({
      api: 'responses',
      model,
      body: {
        model,
        reasoning: { effort: 'low' },
        input: toResponsesInput(messages),
        max_output_tokens: 280
      },
      retryable: false
    });
  }

  attempts.push({
    api: 'chat',
    model,
    body: buildChatBody(model, messages),
    retryable: true
  });

  const chatBody = attempts[attempts.length - 1].body;
  if (chatBody.temperature !== undefined) {
    attempts.push({
      api: 'chat',
      model,
      body: { ...chatBody, temperature: undefined },
      retryable: true
    });
  }
  if (chatBody.max_tokens !== undefined) {
    const { max_tokens, ...rest } = chatBody;
    attempts.push({
      api: 'chat',
      model,
      body: { ...rest, max_completion_tokens: max_tokens },
      retryable: false
    });
  }

  return attempts;
}

function prefersResponsesApi(model) {
  return /^gpt-5/i.test(model);
}

function isReasoningChatModel(model) {
  return /^gpt-5/i.test(model) || /^o\d/i.test(model) || /^gpt-4\.1/i.test(model);
}

function buildChatBody(model, messages) {
  const body = {
    model,
    messages: messages.map(m => ({
      role: m.role === 'system' ? 'system' : m.role,
      content: String(m.content || '')
    }))
  };
  if (isReasoningChatModel(model)) {
    body.max_completion_tokens = 280;
    body.reasoning_effort = 'low';
  } else {
    body.max_tokens = 280;
    body.temperature = 0.4;
  }
  return body;
}

function toResponsesInput(messages) {
  return messages.map(m => ({
    role: m.role === 'assistant' ? 'assistant' : m.role === 'system' ? 'system' : 'user',
    content: String(m.content || '')
  }));
}

async function fetchOpenAI(attempt, apiKey) {
  const url = attempt.api === 'responses'
    ? 'https://api.openai.com/v1/responses'
    : 'https://api.openai.com/v1/chat/completions';

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(attempt.body)
  });

  let data = {};
  try {
    data = await res.json();
  } catch {
    data = {};
  }

  if (!res.ok) {
    const msg = data?.error?.message || data?.error || `OpenAI HTTP ${res.status}`;
    const retryable = /max_tokens|max_completion_tokens|temperature|unsupported parameter/i.test(msg);
    throw apiError(res.status, msg, retryable);
  }
  return data;
}

function extractReply(data, api) {
  if (api === 'responses') {
    if (data.output_text) return String(data.output_text).trim();
    const parts = (data.output || [])
      .flatMap(item => item.content || [])
      .filter(c => c.type === 'output_text' || c.type === 'text')
      .map(c => c.text || c.output_text || '')
      .join('');
    return parts.trim();
  }
  return String(data?.choices?.[0]?.message?.content || '').trim();
}

function apiError(status, message, retryable = false) {
  const err = new Error(message);
  err.status = status;
  err.retryable = retryable;
  return err;
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };
}

function json(statusCode, obj) {
  return {
    statusCode,
    headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(obj)
  };
}