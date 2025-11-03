import { serve } from "https://deno.land/std@0.179.0/http/server.ts";

const PORT = Number(Deno.env.get("PORT") || 3000);

function handler(_req: Request): Response {
  const url = new URL(_req.url);
  if (url.pathname === "/health") {
    return new Response(JSON.stringify({ status: "ok" }), { status: 200, headers: { "content-type": "application/json" } });
  }
  return new Response(JSON.stringify({ message: "GitXab backend placeholder" }), { status: 200, headers: { "content-type": "application/json" } });
}

console.log(`Listening on :${PORT}`);
await serve(handler, { port: PORT });
