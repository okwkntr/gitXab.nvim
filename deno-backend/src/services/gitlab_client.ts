import { getToken } from "../auth/keyring.ts";
import { fetchWithCache } from "../cache/cache_manager.ts";

// デフォルトは本番GitLab API。テスト用モックサーバーを使用する場合は環境変数 GITLAB_BASE_URL を設定
const DEFAULT_BASE = Deno.env.get("GITLAB_BASE_URL") || "https://gitlab.com/api/v4";

function buildUrl(path: string, params?: Record<string, string|number|boolean>) {
  // Ensure base URL has scheme and host
  let base = DEFAULT_BASE;
  
  // If base doesn't include /api/v4, add it
  if (!base.includes('/api/v4')) {
    base = base.replace(/\/$/, '') + '/api/v4';
  }
  
  // Ensure path starts with /
  if (!path.startsWith('/')) {
    path = '/' + path;
  }
  
  // Build full URL by concatenating base + path (not using new URL's base parameter)
  const fullPath = base + path;
  const url = new URL(fullPath);
  
  if (params) {
    for (const k of Object.keys(params)) {
      url.searchParams.set(k, String(params[k]));
    }
  }
  
  return url.toString();
}

async function requestGet(path: string, params?: Record<string, string|number|boolean>) {
  const token = await getToken();
  const url = buildUrl(path, params);
  const headers: Record<string,string> = { "accept": "application/json" };
  if (token) headers["authorization"] = `Bearer ${token}`;
  
  // Debug logging (enable with GITXAB_DEBUG=1)
  const debug = Deno.env.get("GITXAB_DEBUG") === "1";
  if (debug) {
    console.log("[GitLab API] Request:", {
      url,
      hasToken: !!token,
      tokenPrefix: token ? token.substring(0, 8) + "..." : "none",
      headers: Object.keys(headers),
    });
  }
  
  const res = await fetchWithCache(url, { headers });
  
  if (res.status === 401) {
    throw new Error("Unauthorized: GitLab token is missing or invalid. Please set GITLAB_TOKEN environment variable.");
  }
  
  if (res.status === 429) {
    const retry = res.headers.get("Retry-After");
    throw new Error(`Rate limited. Retry after: ${retry}`);
  }
  
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitLab API error (${res.status}): ${text.substring(0, 200)}`);
  }
  
  const text = await res.text();
  
  // Debug logging (enable with GITXAB_DEBUG=1)
  if (debug) {
    console.log("[GitLab API] Response:", {
      status: res.status,
      contentType: res.headers.get("content-type"),
      bodyPreview: text.substring(0, 100),
    });
  }
  
  // Check if response is HTML (not JSON)
  if (text.trim().startsWith('<')) {
    throw new Error(
      `GitLab API returned HTML instead of JSON. This usually means:\n` +
      `1. GITLAB_TOKEN is not set or invalid (token: ${token ? "SET" : "NOT SET"})\n` +
      `2. GITLAB_BASE_URL is incorrect (current: ${DEFAULT_BASE})\n` +
      `3. URL is redirecting to login page\n` +
      `Requested URL: ${url}\n` +
      `Please set: GITLAB_TOKEN and optionally GITLAB_BASE_URL`
    );
  }
  
  try { 
    return JSON.parse(text); 
  } catch (e) { 
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(`Failed to parse JSON response: ${msg}`);
  }
}

export async function listProjects(q?: string) {
  const params = q ? { q } : undefined;
  return await requestGet('/projects', params);
}

export async function listIssues(projectId: number, state?: 'opened' | 'closed' | 'all') {
  const params: Record<string, string | number> = {};
  if (state) params.state = state;
  return await requestGet(`/projects/${projectId}/issues`, params);
}

export async function getIssue(projectId: number, issueIid: number) {
  return await requestGet(`/projects/${projectId}/issues/${issueIid}`);
}

export async function listMergeRequests(projectId: number) {
  return await requestGet(`/projects/${projectId}/merge_requests`, { project_id: projectId });
}
