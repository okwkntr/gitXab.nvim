/**
 * GitLab Provider Implementation
 *
 * Implements the Provider interface for GitLab using the GitLab API client.
 *
 * @module
 */

import type {
  Branch,
  Comment,
  CreateIssueParams,
  CreatePullRequestParams,
  Issue,
  Provider,
  PullRequest,
  PullRequestDiff,
  Repository,
  UpdateIssueParams,
} from "./provider.ts";
import {
  createIssue as gitlabCreateIssue,
  createIssueNote,
  createMergeRequest as gitlabCreateMR,
  getIssue,
  getIssueNotes,
  getMergeRequest,
  getMergeRequestChanges,
  listBranches as gitlabListBranches,
  listIssues as gitlabListIssues,
  listMergeRequests as gitlabListMRs,
  listProjects,
  updateIssue as gitlabUpdateIssue,
} from "../services/gitlab_client.ts";
import { GitLabConverter } from "./gitlab_converter.ts";
import type {
  CreateGitLabIssueParams,
  CreateGitLabMergeRequestParams,
  GitLabBranch,
  GitLabIssue,
  GitLabMergeRequest,
  GitLabMergeRequestChanges,
  GitLabNote,
  GitLabProject,
  UpdateGitLabIssueParams,
} from "../models/gitlab.ts";

/**
 * GitLab provider configuration
 */
export interface GitLabProviderConfig {
  token: string;
  baseUrl?: string;
}

/**
 * GitLab Provider implementation
 */
export class GitLabProvider implements Provider {
  readonly name = "gitlab" as const;
  readonly baseUrl: string;

  private converter: GitLabConverter;

  constructor(config: GitLabProviderConfig) {
    this.baseUrl = config.baseUrl || "https://gitlab.com/api/v4";
    this.converter = new GitLabConverter("gitlab");

    // Note: GitLab client uses environment variables directly
    // GITLAB_TOKEN and GITLAB_BASE_URL should be set before creating provider
  }

  /**
   * Parse project ID (can be number or string)
   */
  private parseProjectId(projectId: string | number): number {
    const id = typeof projectId === "number"
      ? projectId
      : parseInt(projectId, 10);

    if (isNaN(id)) {
      throw new Error(
        `Invalid GitLab project ID format: ${projectId}. Expected numeric ID.`,
      );
    }

    return id;
  }

  /**
   * List repositories (projects) for the authenticated user
   */
  async listRepositories(): Promise<Repository[]> {
    const projects = await listProjects() as GitLabProject[];
    return projects.map((p) => this.converter.convertRepository(p));
  }

  /**
   * Get a specific repository (project)
   */
  async getRepository(projectId: string | number): Promise<Repository> {
    const id = this.parseProjectId(projectId);
    const projects = await listProjects() as GitLabProject[];
    const project = projects.find((p) => p.id === id);

    if (!project) {
      throw new Error(`Project not found: ${projectId}`);
    }

    return this.converter.convertRepository(project);
  }

  /**
   * List issues for a project
   */
  async listIssues(
    projectId: string | number,
    state?: string,
  ): Promise<Issue[]> {
    const id = this.parseProjectId(projectId);
    const gitlabState = state === "open"
      ? "opened"
      : state === "closed"
      ? "closed"
      : "all";

    const issues = await gitlabListIssues(
      id,
      gitlabState as "opened" | "closed" | "all",
    ) as GitLabIssue[];

    return issues.map((i) => this.converter.convertIssue(i));
  }

  /**
   * Get a specific issue
   */
  async getIssue(
    projectId: string | number,
    issueNumber: number,
  ): Promise<Issue> {
    const id = this.parseProjectId(projectId);
    const issue = await getIssue(id, issueNumber) as GitLabIssue;
    return this.converter.convertIssue(issue);
  }

  /**
   * Create a new issue
   */
  async createIssue(
    projectId: string | number,
    params: CreateIssueParams,
  ): Promise<Issue> {
    const id = this.parseProjectId(projectId);
    const gitlabParams: CreateGitLabIssueParams = {
      title: params.title,
      description: params.body,
      labels: params.labels?.join(","),
    };

    const issue = await gitlabCreateIssue(id, gitlabParams) as GitLabIssue;
    return this.converter.convertIssue(issue);
  }

  /**
   * Update an issue
   */
  async updateIssue(
    projectId: string | number,
    issueNumber: number,
    params: UpdateIssueParams,
  ): Promise<Issue> {
    const id = this.parseProjectId(projectId);
    const gitlabParams: UpdateGitLabIssueParams = {
      title: params.title,
      description: params.body,
      labels: params.labels?.join(","),
      state_event: params.state === "closed"
        ? "close"
        : params.state === "open"
        ? "reopen"
        : undefined,
    };

    const issue = await gitlabUpdateIssue(
      id,
      issueNumber,
      gitlabParams,
    ) as GitLabIssue;
    return this.converter.convertIssue(issue);
  }

  /**
   * List pull requests (merge requests) for a project
   */
  async listPullRequests(
    projectId: string | number,
    state?: string,
  ): Promise<PullRequest[]> {
    const id = this.parseProjectId(projectId);
    const mrs = await gitlabListMRs(id) as GitLabMergeRequest[];

    // Filter by state if specified
    let filteredMRs = mrs;
    if (state) {
      const filterState = state === "open" ? "opened" : state;
      filteredMRs = mrs.filter((mr) => mr.state === filterState);
    }

    return filteredMRs.map((mr) => this.converter.convertPullRequest(mr));
  }

  /**
   * Get a specific pull request (merge request)
   */
  async getPullRequest(
    projectId: string | number,
    prNumber: number,
  ): Promise<PullRequest> {
    const id = this.parseProjectId(projectId);
    const mr = await getMergeRequest(id, prNumber) as GitLabMergeRequest;
    return this.converter.convertPullRequest(mr);
  }

  /**
   * Create a new pull request (merge request)
   */
  async createPullRequest(
    projectId: string | number,
    params: CreatePullRequestParams,
  ): Promise<PullRequest> {
    const id = this.parseProjectId(projectId);
    const gitlabParams: CreateGitLabMergeRequestParams = {
      source_branch: params.sourceBranch,
      target_branch: params.targetBranch,
      title: params.title,
      description: params.body,
    };

    const mr = await gitlabCreateMR(id, gitlabParams) as GitLabMergeRequest;
    return this.converter.convertPullRequest(mr);
  }

  /**
   * Update a pull request (merge request)
   */
  async updatePullRequest(
    projectId: string | number,
    prNumber: number,
    params: UpdateIssueParams,
  ): Promise<PullRequest> {
    const id = this.parseProjectId(projectId);
    const gitlabParams: UpdateGitLabIssueParams = {
      title: params.title,
      description: params.body,
      state_event: params.state === "closed"
        ? "close"
        : params.state === "open"
        ? "reopen"
        : undefined,
    };

    const mr = await gitlabUpdateIssue(
      id,
      prNumber,
      gitlabParams,
    ) as GitLabMergeRequest;
    return this.converter.convertPullRequest(mr);
  }

  /**
   * Get comments for an issue or pull request
   */
  async getComments(
    projectId: string | number,
    issueNumber: number,
  ): Promise<Comment[]> {
    const id = this.parseProjectId(projectId);
    const notes = await getIssueNotes(id, issueNumber) as GitLabNote[];
    return notes
      .filter((n) => !n.system) // Filter out system notes
      .map((n) => this.converter.convertComment(n));
  }

  /**
   * Create a comment on an issue or pull request
   */
  async createComment(
    projectId: string | number,
    issueNumber: number,
    body: string,
  ): Promise<Comment> {
    const id = this.parseProjectId(projectId);
    const note = await createIssueNote(id, issueNumber, body) as GitLabNote;
    return this.converter.convertComment(note);
  }

  /**
   * List branches for a project
   */
  async listBranches(projectId: string | number): Promise<Branch[]> {
    const id = this.parseProjectId(projectId);
    const [branches, projects] = await Promise.all([
      gitlabListBranches(id) as Promise<GitLabBranch[]>,
      listProjects() as Promise<GitLabProject[]>,
    ]);

    const project = projects.find((p) => p.id === id);
    const defaultBranch = project?.default_branch || "main";

    return branches.map((b) => this.converter.convertBranch(b, defaultBranch));
  }

  /**
   * Get diff for a pull request (merge request)
   */
  async getPullRequestDiff(
    projectId: string | number,
    prNumber: number,
  ): Promise<PullRequestDiff> {
    const id = this.parseProjectId(projectId);
    const changes = await getMergeRequestChanges(
      id,
      prNumber,
    ) as GitLabMergeRequestChanges;
    return this.converter.convertPullRequestDiff(changes.changes);
  }

  /**
   * Get rate limit information (GitLab doesn't expose this in the same way)
   */
  getRateLimitInfo() {
    return {
      limit: 0,
      remaining: 0,
      reset: new Date(),
    };
  }
}
