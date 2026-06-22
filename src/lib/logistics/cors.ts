const ALLOWED_ORIGINS = new Set([
  "https://jasper1974.github.io",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
]);

export function corsHeaders(request: Request): HeadersInit {
  const origin = request.headers.get("origin") ?? "";
  const allowOrigin =
    ALLOWED_ORIGINS.has(origin) ||
    origin.endsWith(".vercel.app") ||
    origin.endsWith(".github.io")
      ? origin
      : "https://jasper1974.github.io";

  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, x-admin-secret",
    "Access-Control-Max-Age": "86400",
  };
}

export function jsonWithCors(request: Request, body: unknown, status = 200) {
  return Response.json(body, {
    status,
    headers: corsHeaders(request),
  });
}

export function optionsResponse(request: Request) {
  return new Response(null, { status: 204, headers: corsHeaders(request) });
}
