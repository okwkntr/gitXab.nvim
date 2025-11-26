import { getToken } from "../auth/keyring.ts";
import { fetchWithCache } from "../cache/cache_manager.ts";

// デフォルトは本番GitLab API。テスト用モックサーバーを使用する場合は環境変数 GITLAB_BASE_URL を設定
const DEFAULT_BASE = Deno.env.get("GITLAB_BASE_URL") ||
  "https://gitlab.com/api/v4";

function buildUrl(
  path: string,
  params?: Record<string, string | number | boolean>,
) {
  // Ensure base URL has scheme and host
  let base = DEFAULT_BASE;

  // If base doesn't include /api/v4, add it
  if (!base.includes("/api/v4")) {
    base = base.replace(/\/$/, "") + "/api/v4";
  }

  // Ensure path starts with /
  if (!path.startsWith("/")) {
    path = "/" + path;
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

async function request(
  method: string,
  path: string,
  params?: Record<string, string | number | boolean>,
  body?: unknown,
) {
  const token = await getToken();
  const url = buildUrl(path, params);
  const headers: Record<string, string> = {
    "accept": "application/json",
    "content-type": "application/json",
  };
  if (token) headers["authorization"] = `Bearer ${token}`;

  // Debug logging (enable with GITXAB_DEBUG=1)
  const debug = Deno.env.get("GITXAB_DEBUG") === "1";
  if (debug) {
    console.log(`[GitLab API] ${method} Request:`, {
      url,
      hasToken: !!token,
      tokenPrefix: token ? token.substring(0, 8) + "..." : "none",
      headers: Object.keys(headers),
      hasBody: !!body,
    });
  }

  const options: RequestInit = {
    method,
    headers,
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  // Use cache only for GET requests
  const res = method === "GET"
    ? await fetchWithCache(url, options)
    : await fetch(url, options);

  if (res.status === 401) {
    throw new Error(
      "Unauthorized: GitLab token is missing or invalid. Please set GITLAB_TOKEN environment variable.",
    );
  }

  if (res.status === 429) {
    const retry = res.headers.get("Retry-After");
    throw new Error(`Rate limited. Retry after: ${retry}`);
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `GitLab API error (${res.status}): ${text.substring(0, 200)}`,
    );
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
  if (text.trim().startsWith("<")) {
    throw new Error(
      `GitLab API returned HTML instead of JSON. This usually means:\n` +
        `1. GITLAB_TOKEN is not set or invalid (token: ${
          token ? "SET" : "NOT SET"
        })\n` +
        `2. GITLAB_BASE_URL is incorrect (current: ${DEFAULT_BASE})\n` +
        `3. URL is redirecting to login page\n` +
        `Requested URL: ${url}\n` +
        `Please set: GITLAB_TOKEN and optionally GITLAB_BASE_URL`,
    );
  }

  try {
    return JSON.parse(text);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(`Failed to parse JSON response: ${msg}`);
  }
}

async function requestGet(
  path: string,
  params?: Record<string, string | number | boolean>,
) {
  return await request("GET", path, params);
}

async function requestPost(
  path: string,
  body: unknown,
  params?: Record<string, string | number | boolean>,
) {
  return await request("POST", path, params, body);
}

async function requestPut(
  path: string,
  body: unknown,
  params?: Record<string, string | number | boolean>,
) {
  return await request("PUT", path, params, body);
}

export async function listProjects(q?: string) {
  const params = q ? { q } : undefined;
  return await requestGet("/projects", params);
}

export async function listIssues(
  projectId: number,
  state?: "opened" | "closed" | "all",
) {
  const params: Record<string, string | number> = {};
  if (state) params.state = state;
  return await requestGet(`/projects/${projectId}/issues`, params);
}

export async function getIssue(projectId: number, issueIid: number) {
  return await requestGet(`/projects/${projectId}/issues/${issueIid}`);
}

export interface CreateIssueParams {
  title: string;
  description?: string;
  assignee_ids?: number[];
  labels?: string;
  milestone_id?: number;
}

export async function createIssue(
  projectId: number,
  params: CreateIssueParams,
) {
  return await requestPost(`/projects/${projectId}/issues`, params);
}

export interface UpdateIssueParams {
  title?: string;
  description?: string;
  assignee_ids?: number[];
  labels?: string;
  state_event?: "close" | "reopen";
}

export async function updateIssue(
  projectId: number,
  issueIid: number,
  params: UpdateIssueParams,
) {
  return await requestPut(`/projects/${projectId}/issues/${issueIid}`, params);
}

export async function getIssueNotes(projectId: number, issueIid: number) {
  return await requestGet(`/projects/${projectId}/issues/${issueIid}/notes`);
}

export async function createIssueNote(
  projectId: number,
  issueIid: number,
  body: string,
) {
  return await requestPost(`/projects/${projectId}/issues/${issueIid}/notes`, {
    body,
  });
}

// Discussion API
export async function getIssueDiscussions(projectId: number, issueIid: number) {
  return await requestGet(
    `/projects/${projectId}/issues/${issueIid}/discussions`,
  );
}

export async function addNoteToDiscussion(
  projectId: number,
  issueIid: number,
  discussionId: string,
  body: string,
) {
  return await requestPost(
    `/projects/${projectId}/issues/${issueIid}/discussions/${discussionId}/notes`,
    { body },
  );
}

export async function listMergeRequests(projectId: number) {
  return await requestGet(`/projects/${projectId}/merge_requests`, {
    project_id: projectId,
  });
}

export async function getMergeRequest(projectId: number, mrIid: number) {
  return await requestGet(`/projects/${projectId}/merge_requests/${mrIid}`);
}

export async function getMergeRequestDiscussions(
  projectId: number,
  mrIid: number,
) {
  return await requestGet(
    `/projects/${projectId}/merge_requests/${mrIid}/discussions`,
  );
}

export async function addNoteToMRDiscussion(
  projectId: number,
  mrIid: number,
  discussionId: string,
  body: string,
) {
  return await requestPost(
    `/projects/${projectId}/merge_requests/${mrIid}/discussions/${discussionId}/notes`,
    { body },
  );
}

export async function createMRNote(
  projectId: number,
  mrIid: number,
  body: string,
) {
  return await requestPost(
    `/projects/${projectId}/merge_requests/${mrIid}/notes`,
    { body },
  );
}

export interface CreateMRParams {
  source_branch: string;
  target_branch: string;
  title: string;
  description?: string;
  assignee_ids?: number[];
  labels?: string;
  remove_source_branch?: boolean;
}

export async function createMergeRequest(
  projectId: number,
  params: CreateMRParams,
) {
  return await requestPost(`/projects/${projectId}/merge_requests`, params);
}

export async function listBranches(projectId: number) {
  return await requestGet(`/projects/${projectId}/repository/branches`);
}

// Merge Request Changes/Diffs API
export async function getMergeRequestChanges(projectId: number, mrIid: number) {
  return await requestGet(
    `/projects/${projectId}/merge_requests/${mrIid}/changes`,
  );
}

export async function getMergeRequestDiffs(projectId: number, mrIid: number) {
  return await requestGet(
    `/projects/${projectId}/merge_requests/${mrIid}/diffs`,
  );
}
