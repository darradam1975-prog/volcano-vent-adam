export function corsHeaders(methods = 'GET, POST, OPTIONS') {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': methods,
    'Cache-Control': 'no-store, no-cache, must-revalidate'
  };
}

export function jsonResponse(obj, status = 200, methods) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: {
      ...corsHeaders(methods),
      'Content-Type': 'application/json'
    }
  });
}

export function optionsResponse(methods) {
  return new Response(null, { status: 204, headers: corsHeaders(methods) });
}