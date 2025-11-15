/**
 * GitXab Backend Library
 * 
 * This module exports the GitLab API client library that can be used by:
 * - Denops plugin (denops/gitxab/main.ts)
 * - CLI tool (deno-backend/cli.ts)
 * - IPC server (deno-backend/src/server.ts) for backward compatibility
 * 
 * @module
 */

// GitLab API client functions
export {
  listProjects,
  listIssues,
  getIssue,
  createIssue,
  updateIssue,
  getIssueNotes,
  createIssueNote,
  listMergeRequests,
  type CreateIssueParams,
  type UpdateIssueParams,
} from "./src/services/gitlab_client.ts";

// Authentication management
export {
  getToken,
  storeTokenFallback,
} from "./src/auth/keyring.ts";

// Cache management
export {
  fetchWithCache,
} from "./src/cache/cache_manager.ts";

// Types (to be defined)
export type Project = {
  id: number;
  name: string;
  path: string;
  description: string;
  web_url?: string;
};

export type Issue = {
  id: number;
  iid: number;
  project_id: number;
  title: string;
  description: string;
  state: string;
  created_at: string;
  updated_at: string;
  author: {
    id: number;
    name: string;
    username: string;
  };
  assignee?: {
    id: number;
    name: string;
    username: string;
  };
  assignees?: Array<{
    id: number;
    name: string;
    username: string;
  }>;
  labels?: string[];
  web_url?: string;
};

export type IssueNote = {
  id: number;
  body: string;
  author: {
    id: number;
    name: string;
    username: string;
  };
  created_at: string;
  updated_at: string;
  system: boolean;
  noteable_id: number;
  noteable_type: string;
};

export type MergeRequest = {
  id: number;
  iid: number;
  title: string;
  description: string;
  state: string;
  author?: {
    name: string;
    username: string;
  };
  assignee?: {
    name: string;
    username: string;
  };
  source_branch: string;
  target_branch: string;
  web_url?: string;
};
