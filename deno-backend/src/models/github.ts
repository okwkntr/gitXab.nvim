/**
 * GitHub API Types
 *
 * Type definitions for GitHub REST API v3 responses.
 * Based on https://docs.github.com/en/rest
 *
 * @module
 */

/**
 * GitHub User
 */
export interface GitHubUser {
  id: number;
  login: string; // username
  name?: string;
  avatar_url: string;
  url: string;
  html_url: string;
  type: "User" | "Organization";
}

/**
 * GitHub Repository (Owner)
 */
export interface GitHubOwner {
  id: number;
  login: string;
  avatar_url: string;
  url: string;
  type: "User" | "Organization";
}

/**
 * GitHub Repository
 */
export interface GitHubRepository {
  id: number;
  name: string;
  full_name: string; // "owner/repo"
  owner: GitHubOwner;
  description: string | null;
  html_url: string;
  url: string;
  default_branch: string;
  private: boolean;
  fork: boolean;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  size: number;
  stargazers_count: number;
  watchers_count: number;
  language: string | null;
  has_issues: boolean;
  has_projects: boolean;
  has_downloads: boolean;
  has_wiki: boolean;
  has_pages: boolean;
  archived: boolean;
  disabled: boolean;
}

/**
 * GitHub Label
 */
export interface GitHubLabel {
  id: number;
  name: string;
  color: string;
  description: string | null;
  url: string;
}

/**
 * GitHub Milestone
 */
export interface GitHubMilestone {
  id: number;
  number: number;
  title: string;
  description: string | null;
  state: "open" | "closed";
  created_at: string;
  updated_at: string;
  due_on: string | null;
  closed_at: string | null;
}

/**
 * GitHub Issue
 */
export interface GitHubIssue {
  id: number;
  number: number;
  title: string;
  body: string | null;
  state: "open" | "closed";
  user: GitHubUser;
  labels: GitHubLabel[];
  assignees: GitHubUser[];
  milestone: GitHubMilestone | null;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  html_url: string;
  url: string;
  comments: number;
  locked: boolean;

  // These fields exist for PRs but not for issues
  pull_request?: {
    url: string;
    html_url: string;
    diff_url: string;
    patch_url: string;
  };
}

/**
 * GitHub Pull Request
 */
export interface GitHubPullRequest {
  id: number;
  number: number;
  title: string;
  body: string | null;
  state: "open" | "closed";
  user: GitHubUser;
  labels: GitHubLabel[];
  assignees: GitHubUser[];
  milestone: GitHubMilestone | null;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  merged_at: string | null;
  html_url: string;
  url: string;

  // PR-specific fields
  head: {
    ref: string; // source branch
    sha: string;
    repo: GitHubRepository | null;
    user: GitHubUser;
  };
  base: {
    ref: string; // target branch
    sha: string;
    repo: GitHubRepository;
    user: GitHubUser;
  };

  draft: boolean;
  merged: boolean;
  mergeable: boolean | null;
  mergeable_state: string;
  merged_by: GitHubUser | null;
  comments: number;
  review_comments: number;
  commits: number;
  additions: number;
  deletions: number;
  changed_files: number;
}

/**
 * GitHub Comment (Issue or PR)
 */
export interface GitHubComment {
  id: number;
  body: string;
  user: GitHubUser;
  created_at: string;
  updated_at: string;
  html_url: string;
  url: string;
}

/**
 * GitHub Branch
 */
export interface GitHubBranch {
  name: string;
  commit: {
    sha: string;
    url: string;
  };
  protected: boolean;
}

/**
 * GitHub Branch Protection
 */
export interface GitHubBranchProtection {
  enabled: boolean;
  required_status_checks?: {
    enforcement_level: string;
    contexts: string[];
  };
}

/**
 * GitHub Commit
 */
export interface GitHubCommit {
  sha: string;
  commit: {
    message: string;
    author: {
      name: string;
      email: string;
      date: string;
    };
    committer: {
      name: string;
      email: string;
      date: string;
    };
  };
  author: GitHubUser | null;
  committer: GitHubUser | null;
  html_url: string;
  url: string;
}

/**
 * GitHub File Change (in PR)
 */
export interface GitHubFile {
  filename: string;
  status:
    | "added"
    | "removed"
    | "modified"
    | "renamed"
    | "copied"
    | "changed"
    | "unchanged";
  additions: number;
  deletions: number;
  changes: number;
  blob_url: string;
  raw_url: string;
  contents_url: string;
  patch?: string;
  previous_filename?: string;
}

/**
 * GitHub Error Response
 */
export interface GitHubError {
  message: string;
  documentation_url?: string;
  errors?: Array<{
    resource: string;
    field: string;
    code: string;
  }>;
}

/**
 * GitHub API Response Headers
 */
export interface GitHubHeaders {
  "x-ratelimit-limit"?: string;
  "x-ratelimit-remaining"?: string;
  "x-ratelimit-reset"?: string;
  "x-ratelimit-used"?: string;
  "x-ratelimit-resource"?: string;
  link?: string; // Pagination links
  etag?: string;
}

/**
 * GitHub Search Result
 */
export interface GitHubSearchResult<T> {
  total_count: number;
  incomplete_results: boolean;
  items: T[];
}

/**
 * Parameters for creating an issue
 */
export interface CreateGitHubIssueParams {
  title: string;
  body?: string;
  labels?: string[];
  assignees?: string[];
  milestone?: number;
}

/**
 * Parameters for updating an issue
 */
export interface UpdateGitHubIssueParams {
  title?: string;
  body?: string;
  state?: "open" | "closed";
  labels?: string[];
  assignees?: string[];
  milestone?: number | null;
}

/**
 * Parameters for creating a pull request
 */
export interface CreateGitHubPullRequestParams {
  title: string;
  body?: string;
  head: string; // source branch (or "username:branch" for forks)
  base: string; // target branch
  draft?: boolean;
  maintainer_can_modify?: boolean;
}

/**
 * Parameters for updating a pull request
 */
export interface UpdateGitHubPullRequestParams {
  title?: string;
  body?: string;
  state?: "open" | "closed";
  base?: string;
  maintainer_can_modify?: boolean;
}

/**
 * Parameters for creating a comment
 */
export interface CreateGitHubCommentParams {
  body: string;
}
