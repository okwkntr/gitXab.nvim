/**
 * GitXab Backend Library
 *
 * This module exports both GitLab and GitHub provider functionality:
 * - GitLab API client (legacy, direct API calls)
 * - Multi-provider support (GitHub + GitLab via unified Provider interface)
 *
 * Used by:
 * - Denops plugin (denops/gitxab/main.ts)
 * - CLI tool (deno-backend/cli.ts)
 * - IPC server (deno-backend/src/server.ts) for backward compatibility
 *
 * @module
 */

// ============================================================================
// Multi-Provider Support (New)
// ============================================================================

// Core provider types and interfaces
export type {
  Branch,
  Comment,
  CreateIssueParams as ProviderCreateIssueParams,
  CreatePullRequestParams,
  FileDiff,
  Issue as ProviderIssue,
  Provider,
  PullRequest,
  PullRequestDiff,
  Repository,
  UpdateIssueParams as ProviderUpdateIssueParams,
  User,
} from "./src/providers/provider.ts";

// Provider factory
export {
  createGitHubProvider,
  createGitLabProvider,
  createProvider,
  detectCurrentProvider,
  ProviderFactoryError,
} from "./src/providers/provider_factory.ts";

// GitHub provider
export { GitHubProvider } from "./src/providers/github_provider.ts";
export {
  GitHubConverter,
  githubConverter,
} from "./src/providers/github_converter.ts";

// GitLab provider
export { GitLabProvider } from "./src/providers/gitlab_provider.ts";
export {
  GitLabConverter,
  gitlabConverter,
} from "./src/providers/gitlab_converter.ts";

// GitHub API client
export { GitHubAPIError, GitHubClient } from "./src/services/github_client.ts";

// GitHub types
export type {
  CreateGitHubCommentParams,
  CreateGitHubIssueParams,
  CreateGitHubPullRequestParams,
  GitHubBranch,
  GitHubComment,
  GitHubFile,
  GitHubIssue,
  GitHubLabel,
  GitHubOwner,
  GitHubPullRequest,
  GitHubRepository,
  GitHubUser,
  UpdateGitHubIssueParams,
  UpdateGitHubPullRequestParams,
} from "./src/models/github.ts";

// Configuration and detection
export type {
  GitXabConfig,
  ProviderConfig,
  ProviderType,
} from "./src/config/provider_config.ts";

export {
  autoDetectProvider,
  DEFAULT_BASE_URLS,
  detectProviderFromEnv,
  detectProviderFromUrl,
  extractOwnerAndRepo,
  getBaseUrl,
  getGitRemoteUrl,
  getProviderConfig,
  loadConfig,
  parseRepositoryId,
  saveConfig,
} from "./src/config/provider_config.ts";

// Authentication
export {
  createAuthHeaders,
  createRequestHeaders,
  getProviderToken,
  getTokenFromEnv,
  getUserAgent,
  isAuthConfigured,
  validateTokenFormat,
} from "./src/auth/provider_auth.ts";

// Common models and utilities
export { BaseConverter, ConversionError } from "./src/models/common.ts";

// ============================================================================
// GitLab API Client (Legacy)
// ============================================================================

// GitLab API client functions
export {
  addNoteToDiscussion,
  addNoteToMRDiscussion,
  createIssue,
  createIssueNote,
  type CreateIssueParams,
  createMergeRequest,
  createMRNote,
  type CreateMRParams,
  getIssue,
  getIssueDiscussions,
  getIssueNotes,
  getMergeRequest,
  getMergeRequestChanges,
  getMergeRequestDiffs,
  getMergeRequestDiscussions,
  listBranches,
  listIssues,
  listMergeRequests,
  listProjects,
  updateIssue,
  type UpdateIssueParams,
} from "./src/services/gitlab_client.ts";

// Authentication management
export { getToken, storeTokenFallback } from "./src/auth/keyring.ts";

// Cache management
export { fetchWithCache } from "./src/cache/cache_manager.ts";

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
