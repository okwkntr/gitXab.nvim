import { getToken } from "../auth/keyring.ts";
import { fetchWithCache } from "../cache/cache_manager.ts";

// デフォルトはローカルモックサーバー。本番GitLabを使用する場合は環境変数 GITLAB_BASE_URL を設定
const DEFAULT_BASE = Deno.env.get("GITLAB_BASE_URL") || "http://localhost:3000";

function buildUrl(path: string, params?: Record<string, string|number|boolean>) {
  const url = new URL(path, DEFAULT_BASE);
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
  const res = await fetchWithCache(url, { headers });
  if (res.status === 429) {
    const retry = res.headers.get("Retry-After");
    throw new Error(`rate limited. retry-after: ${retry}`);
  }
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitLab API error: ${res.status} ${text}`);
  }
  const text = await res.text();
  try { return JSON.parse(text); } catch { return text; }
}

export async function listProjects(q?: string) {
  const params = q ? { q } : undefined;
  return await requestGet('/projects', params);
}

export async function getIssue(projectId: number, issueIid: number) {
  return await requestGet(`/projects/${projectId}/issues/${issueIid}`);
}

export async function listMergeRequests(projectId: number) {
  return await requestGet(`/projects/${projectId}/merge_requests`, { project_id: projectId });
}
