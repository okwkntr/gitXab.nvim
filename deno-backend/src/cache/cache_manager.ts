/**
 * Simple ETag-capable cache manager.
 * Stores a small JSON index in $XDG_STATE_HOME/gitxab/cache.json
 */

type CacheEntry = {
  url: string;
  etag?: string;
  body?: string; // serialized JSON or raw
  updatedAt: string; // ISO
}

const STATE_HOME = Deno.env.get("XDG_STATE_HOME") || (Deno.env.get("HOME") ? `${Deno.env.get("HOME")}/.local/state` : undefined);
const CACHE_DIR = STATE_HOME ? `${STATE_HOME}/gitxab` : undefined;
const CACHE_FILE = CACHE_DIR ? `${CACHE_DIR}/cache.json` : undefined;

async function loadCache(): Promise<Record<string, CacheEntry>> {
  if (!CACHE_FILE) return {};
  try {
    const txt = await Deno.readTextFile(CACHE_FILE);
    return JSON.parse(txt) as Record<string, CacheEntry>;
  } catch (e) {
    return {};
  }
}

async function saveCache(cache: Record<string, CacheEntry>) {
  if (!CACHE_FILE) return;
  try {
    await Deno.mkdir(CACHE_DIR!, { recursive: true });
    await Deno.writeTextFile(CACHE_FILE, JSON.stringify(cache, null, 2));
  } catch (e) {
    console.error("Failed to save cache:", e);
  }
}

export async function fetchWithCache(url: string, opts: RequestInit = {}): Promise<Response> {
  const cache = await loadCache();
  const entry = cache[url];
  const headers = new Headers(opts.headers || {});
  if (entry && entry.etag) headers.set("If-None-Match", entry.etag);
  const res = await fetch(url, { ...opts, headers });
  if (res.status === 304 && entry && entry.body) {
    // reconstruct a Response from cached body
    const body = entry.body;
    return new Response(body, { status: 200, headers: { "content-type": "application/json", "x-cache": "HIT" } });
  }
  // successful GET with ETag
  if (res.ok) {
    const etag = res.headers.get("etag");
    const text = await res.text();
    cache[url] = { url, etag: etag || undefined, body: text, updatedAt: new Date().toISOString() };
    await saveCache(cache);
    return new Response(text, { status: res.status, headers: res.headers });
  }
  return res;
}
