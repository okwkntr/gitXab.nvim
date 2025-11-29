/**
 * GitLab API Type Definitions
 *
 * Type definitions for GitLab API responses
 *
 * @module
 */

/**
 * GitLab Project
 */
export interface GitLabProject {
  id: number;
  name: string;
  description: string | null;
  web_url: string;
  path_with_namespace: string;
  default_branch: string;
  visibility: string;
  created_at: string;
  last_activity_at: string;
}

/**
 * GitLab User
 */
export interface GitLabUser {
  id: number;
  username: string;
  name: string;
  avatar_url: string;
  web_url: string;
}

/**
 * GitLab Issue
 */
export interface GitLabIssue {
  id: number;
  iid: number;
  project_id: number;
  title: string;
  description: string | null;
  state: "opened" | "closed";
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  labels: string[];
  assignees: GitLabUser[];
  author: GitLabUser;
  web_url: string;
}

/**
 * GitLab Merge Request
 */
export interface GitLabMergeRequest {
  id: number;
  iid: number;
  project_id: number;
  title: string;
  description: string | null;
  state: "opened" | "closed" | "merged";
  created_at: string;
  updated_at: string;
  merged_at: string | null;
  closed_at: string | null;
  source_branch: string;
  target_branch: string;
  labels: string[];
  assignees: GitLabUser[];
  author: GitLabUser;
  web_url: string;
  draft: boolean;
}

/**
 * GitLab Note (Comment)
 */
export interface GitLabNote {
  id: number;
  body: string;
  author: GitLabUser;
  created_at: string;
  updated_at: string;
  system: boolean;
  noteable_id: number;
  noteable_type: string;
}

/**
 * GitLab Branch
 */
export interface GitLabBranch {
  name: string;
  commit: {
    id: string;
    short_id: string;
    title: string;
    created_at: string;
    author_name: string;
    author_email: string;
  };
  merged: boolean;
  protected: boolean;
  default: boolean;
  web_url: string;
}

/**
 * GitLab Merge Request Changes (Diffs)
 */
export interface GitLabMergeRequestChanges {
  id: number;
  iid: number;
  project_id: number;
  title: string;
  description: string | null;
  state: string;
  created_at: string;
  updated_at: string;
  target_branch: string;
  source_branch: string;
  author: GitLabUser;
  assignees: GitLabUser[];
  labels: string[];
  web_url: string;
  changes: GitLabDiff[];
  changes_count: string;
}

/**
 * GitLab Diff
 */
export interface GitLabDiff {
  old_path: string;
  new_path: string;
  a_mode: string;
  b_mode: string;
  diff: string;
  new_file: boolean;
  renamed_file: boolean;
  deleted_file: boolean;
}

/**
 * Create Issue Parameters
 */
export interface CreateGitLabIssueParams {
  title: string;
  description?: string;
  assignee_ids?: number[];
  labels?: string;
  milestone_id?: number;
}

/**
 * Update Issue Parameters
 */
export interface UpdateGitLabIssueParams {
  title?: string;
  description?: string;
  assignee_ids?: number[];
  labels?: string;
  state_event?: "close" | "reopen";
}

/**
 * Create Merge Request Parameters
 */
export interface CreateGitLabMergeRequestParams {
  source_branch: string;
  target_branch: string;
  title: string;
  description?: string;
  assignee_ids?: number[];
  labels?: string;
  remove_source_branch?: boolean;
}

/**
 * Update Merge Request Parameters
 */
export interface UpdateGitLabMergeRequestParams {
  title?: string;
  description?: string;
  assignee_ids?: number[];
  labels?: string;
  state_event?: "close" | "reopen";
  target_branch?: string;
}
