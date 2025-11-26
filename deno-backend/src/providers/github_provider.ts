/**
 * GitHub Provider Implementation
 *
 * Implements the Provider interface for GitHub using the GitHub API client.
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
import { GitHubClient } from "../services/github_client.ts";
import { GitHubConverter } from "./github_converter.ts";
import type {
  CreateGitHubIssueParams,
  CreateGitHubPullRequestParams,
  UpdateGitHubIssueParams,
} from "../models/github.ts";

/**
 * GitHub provider configuration
 */
export interface GitHubProviderConfig {
  token: string;
  baseUrl?: string;
}

/**
 * GitHub Provider implementation
 */
export class GitHubProvider implements Provider {
  readonly name = "github" as const;
  readonly baseUrl: string;

  private client: GitHubClient;
  private converter: GitHubConverter;

  constructor(config: GitHubProviderConfig) {
    this.baseUrl = config.baseUrl || "https://api.github.com";
    this.client = new GitHubClient({
      token: config.token,
      baseUrl: config.baseUrl,
    });
    this.converter = new GitHubConverter("github");
  }

  /**
   * Parse repository ID in "owner/repo" format
   */
  private parseRepoId(
    repoId: string | number,
  ): { owner: string; repo: string } {
    const id = typeof repoId === "number" ? repoId.toString() : repoId;
    const parts = id.split("/");

    if (parts.length < 2) {
      throw new Error(
        `Invalid GitHub repository ID format: ${id}. Expected "owner/repo"`,
      );
    }

    return {
      owner: parts.slice(0, -1).join("/"),
      repo: parts[parts.length - 1],
    };
  }

  /**
   * List repositories for the authenticated user
   */
  async listRepositories(): Promise<Repository[]> {
    const repos = await this.client.listRepositories();
    return repos.map((r) => this.converter.convertRepository(r));
  }

  /**
   * Get a specific repository
   */
  async getRepository(repoId: string | number): Promise<Repository> {
    const { owner, repo } = this.parseRepoId(repoId);
    const repository = await this.client.getRepository(owner, repo);
    return this.converter.convertRepository(repository);
  }

  /**
   * List issues for a repository
   */
  async listIssues(
    repoId: string | number,
    state?: string,
  ): Promise<Issue[]> {
    const { owner, repo } = this.parseRepoId(repoId);
    const options = state
      ? { state: state as "open" | "closed" | "all" }
      : undefined;
    const issues = await this.client.listIssues(owner, repo, options);
    return issues.map((i) => this.converter.convertIssue(i));
  }

  /**
   * Get a specific issue
   */
  async getIssue(
    repoId: string | number,
    issueNumber: number,
  ): Promise<Issue> {
    const { owner, repo } = this.parseRepoId(repoId);
    const issue = await this.client.getIssue(owner, repo, issueNumber);
    return this.converter.convertIssue(issue);
  }

  /**
   * Create a new issue
   */
  async createIssue(
    repoId: string | number,
    params: CreateIssueParams,
  ): Promise<Issue> {
    const { owner, repo } = this.parseRepoId(repoId);
    const githubParams: CreateGitHubIssueParams = {
      title: params.title,
      body: params.body,
      assignees: params.assignees,
      labels: params.labels,
    };

    const issue = await this.client.createIssue(owner, repo, githubParams);
    return this.converter.convertIssue(issue);
  }

  /**
   * Update an existing issue
   */
  async updateIssue(
    repoId: string | number,
    issueNumber: number,
    params: UpdateIssueParams,
  ): Promise<Issue> {
    const { owner, repo } = this.parseRepoId(repoId);
    const githubParams: UpdateGitHubIssueParams = {
      title: params.title,
      body: params.body,
      state: params.state,
      assignees: params.assignees,
      labels: params.labels,
    };

    const issue = await this.client.updateIssue(
      owner,
      repo,
      issueNumber,
      githubParams,
    );
    return this.converter.convertIssue(issue);
  }

  /**
   * List pull requests for a repository
   */
  async listPullRequests(
    repoId: string | number,
    state?: string,
  ): Promise<PullRequest[]> {
    const { owner, repo } = this.parseRepoId(repoId);
    const options = state
      ? { state: state as "open" | "closed" | "all" }
      : undefined;
    const prs = await this.client.listPullRequests(owner, repo, options);
    return prs.map((pr) => this.converter.convertPullRequest(pr));
  }

  /**
   * Get a specific pull request
   */
  async getPullRequest(
    repoId: string | number,
    prNumber: number,
  ): Promise<PullRequest> {
    const { owner, repo } = this.parseRepoId(repoId);
    const pr = await this.client.getPullRequest(owner, repo, prNumber);
    return this.converter.convertPullRequest(pr);
  }

  /**
   * Create a new pull request
   */
  async createPullRequest(
    repoId: string | number,
    params: CreatePullRequestParams,
  ): Promise<PullRequest> {
    const { owner, repo } = this.parseRepoId(repoId);
    const githubParams: CreateGitHubPullRequestParams = {
      title: params.title,
      body: params.body,
      head: params.sourceBranch,
      base: params.targetBranch,
      draft: params.draft,
    };

    const pr = await this.client.createPullRequest(owner, repo, githubParams);
    return this.converter.convertPullRequest(pr);
  }

  /**
   * Update a pull request
   */
  async updatePullRequest(
    repoId: string | number,
    prNumber: number,
    params: UpdateIssueParams,
  ): Promise<PullRequest> {
    const { owner, repo } = this.parseRepoId(repoId);
    const pr = await this.client.updatePullRequest(owner, repo, prNumber, {
      title: params.title,
      body: params.body,
      state: params.state,
    });
    return this.converter.convertPullRequest(pr);
  }

  /**
   * Get comments for an issue or pull request
   */
  async getComments(
    repoId: string | number,
    issueNumber: number,
  ): Promise<Comment[]> {
    const { owner, repo } = this.parseRepoId(repoId);
    const comments = await this.client.listComments(owner, repo, issueNumber);
    return comments.map((c) => this.converter.convertComment(c));
  }

  /**
   * Create a comment on an issue or pull request
   */
  async createComment(
    repoId: string | number,
    issueNumber: number,
    body: string,
  ): Promise<Comment> {
    const { owner, repo } = this.parseRepoId(repoId);
    const comment = await this.client.createComment(
      owner,
      repo,
      issueNumber,
      body,
    );
    return this.converter.convertComment(comment);
  }

  /**
   * List branches for a repository
   */
  async listBranches(repoId: string | number): Promise<Branch[]> {
    const { owner, repo } = this.parseRepoId(repoId);
    const [branches, repository] = await Promise.all([
      this.client.listBranches(owner, repo),
      this.client.getRepository(owner, repo),
    ]);

    return branches.map((b) =>
      this.converter.convertBranch(b, repository.default_branch)
    );
  }

  /**
   * Get diff for a pull request
   */
  async getPullRequestDiff(
    repoId: string | number,
    prNumber: number,
  ): Promise<PullRequestDiff> {
    const { owner, repo } = this.parseRepoId(repoId);
    const files = await this.client.getPullRequestFiles(owner, repo, prNumber);
    return this.converter.convertPullRequestDiff(files);
  }

  /**
   * Get rate limit information
   */
  getRateLimitInfo() {
    return this.client.getRateLimitInfo();
  }
}
