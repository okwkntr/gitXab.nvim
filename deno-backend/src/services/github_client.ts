/**
 * GitHub API Client
 * 
 * This module provides a client for interacting with the GitHub REST API v3.
 * 
 * Features:
 * - Authentication with Personal Access Tokens
 * - Automatic retry with exponential backoff
 * - Rate limit handling
 * - Error handling with detailed error messages
 * 
 * @module
 */

import type {
  GitHubRepository,
  GitHubIssue,
  GitHubPullRequest,
  GitHubComment,
  GitHubBranch,
  GitHubFile,
  CreateGitHubIssueParams,
  UpdateGitHubIssueParams,
  CreateGitHubPullRequestParams,
  UpdateGitHubPullRequestParams,
} from "../models/github.ts";

/**
 * GitHub API error response
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
 * GitHub API client configuration
 */
export interface GitHubClientConfig {
  baseUrl?: string;
  token: string;
  maxRetries?: number;
  retryDelay?: number;
}

/**
 * GitHub API error class
 */
export class GitHubAPIError extends Error {
  constructor(
    message: string,
    public status: number,
    public response?: GitHubError
  ) {
    super(message);
    this.name = "GitHubAPIError";
  }
}

/**
 * Rate limit information
 */
export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: Date;
  used: number;
}

/**
 * GitHub API Client
 */
export class GitHubClient {
  private baseUrl: string;
  private token: string;
  private maxRetries: number;
  private retryDelay: number;
  private rateLimitInfo: RateLimitInfo | null = null;

  constructor(config: GitHubClientConfig) {
    this.baseUrl = config.baseUrl || "https://api.github.com";
    this.token = config.token;
    this.maxRetries = config.maxRetries || 3;
    this.retryDelay = config.retryDelay || 1000;
  }

  /**
   * Get current rate limit information
   */
  getRateLimitInfo(): RateLimitInfo | null {
    return this.rateLimitInfo;
  }

  /**
   * Make an authenticated request to the GitHub API
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      "Authorization": `Bearer ${this.token}`,
      "Accept": "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "gitXab.nvim/1.0",
      ...options.headers,
    };

    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await fetch(url, {
          ...options,
          headers,
        });

        // Update rate limit info from response headers
        this.updateRateLimitInfo(response.headers);

        // Handle rate limiting
        if (response.status === 429 || response.status === 403) {
          const resetTime = response.headers.get("x-ratelimit-reset");
          if (resetTime) {
            const resetDate = new Date(parseInt(resetTime) * 1000);
            const waitTime = resetDate.getTime() - Date.now();
            
            if (waitTime > 0 && attempt < this.maxRetries) {
              console.warn(`Rate limited. Waiting ${waitTime}ms until ${resetDate.toISOString()}`);
              await this.sleep(waitTime);
              continue;
            }
          }
        }

        // Handle error responses
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({})) as GitHubError;
          throw new GitHubAPIError(
            errorData.message || `GitHub API error: ${response.status}`,
            response.status,
            errorData
          );
        }

        // Handle no content responses
        if (response.status === 204) {
          return undefined as T;
        }

        const data = await response.json();
        return data as T;
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry on client errors (4xx except 429)
        if (error instanceof GitHubAPIError && 
            error.status >= 400 && 
            error.status < 500 && 
            error.status !== 429) {
          throw error;
        }

        // Wait before retrying
        if (attempt < this.maxRetries) {
          const delay = this.retryDelay * Math.pow(2, attempt);
          console.warn(`Request failed, retrying in ${delay}ms... (attempt ${attempt + 1}/${this.maxRetries})`);
          await this.sleep(delay);
        }
      }
    }

    // All retries failed
    throw lastError || new Error("Request failed after all retries");
  }

  /**
   * Update rate limit information from response headers
   */
  private updateRateLimitInfo(headers: Headers): void {
    const limit = headers.get("x-ratelimit-limit");
    const remaining = headers.get("x-ratelimit-remaining");
    const reset = headers.get("x-ratelimit-reset");
    const used = headers.get("x-ratelimit-used");

    if (limit && remaining && reset) {
      this.rateLimitInfo = {
        limit: parseInt(limit),
        remaining: parseInt(remaining),
        reset: new Date(parseInt(reset) * 1000),
        used: parseInt(used || "0"),
      };
    }
  }

  /**
   * Sleep for a given number of milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * List repositories for the authenticated user
   */
  async listRepositories(params?: {
    visibility?: "all" | "public" | "private";
    affiliation?: string;
    sort?: "created" | "updated" | "pushed" | "full_name";
    direction?: "asc" | "desc";
    per_page?: number;
    page?: number;
  }): Promise<GitHubRepository[]> {
    const searchParams = new URLSearchParams();
    if (params?.visibility) searchParams.set("visibility", params.visibility);
    if (params?.affiliation) searchParams.set("affiliation", params.affiliation);
    if (params?.sort) searchParams.set("sort", params.sort);
    if (params?.direction) searchParams.set("direction", params.direction);
    if (params?.per_page) searchParams.set("per_page", params.per_page.toString());
    if (params?.page) searchParams.set("page", params.page.toString());

    const query = searchParams.toString();
    const endpoint = `/user/repos${query ? `?${query}` : ""}`;
    
    return await this.request<GitHubRepository[]>(endpoint);
  }

  /**
   * Get a specific repository
   */
  async getRepository(owner: string, repo: string): Promise<GitHubRepository> {
    return await this.request<GitHubRepository>(`/repos/${owner}/${repo}`);
  }

  /**
   * List issues for a repository
   */
  async listIssues(owner: string, repo: string, params?: {
    state?: "open" | "closed" | "all";
    labels?: string;
    sort?: "created" | "updated" | "comments";
    direction?: "asc" | "desc";
    since?: string;
    per_page?: number;
    page?: number;
  }): Promise<GitHubIssue[]> {
    const searchParams = new URLSearchParams();
    if (params?.state) searchParams.set("state", params.state);
    if (params?.labels) searchParams.set("labels", params.labels);
    if (params?.sort) searchParams.set("sort", params.sort);
    if (params?.direction) searchParams.set("direction", params.direction);
    if (params?.since) searchParams.set("since", params.since);
    if (params?.per_page) searchParams.set("per_page", params.per_page.toString());
    if (params?.page) searchParams.set("page", params.page.toString());

    const query = searchParams.toString();
    const endpoint = `/repos/${owner}/${repo}/issues${query ? `?${query}` : ""}`;
    
    return await this.request<GitHubIssue[]>(endpoint);
  }

  /**
   * Get a specific issue
   */
  async getIssue(owner: string, repo: string, issueNumber: number): Promise<GitHubIssue> {
    return await this.request<GitHubIssue>(`/repos/${owner}/${repo}/issues/${issueNumber}`);
  }

  /**
   * Create a new issue
   */
  async createIssue(
    owner: string,
    repo: string,
    params: CreateGitHubIssueParams
  ): Promise<GitHubIssue> {
    return await this.request<GitHubIssue>(
      `/repos/${owner}/${repo}/issues`,
      {
        method: "POST",
        body: JSON.stringify(params),
      }
    );
  }

  /**
   * Update an existing issue
   */
  async updateIssue(
    owner: string,
    repo: string,
    issueNumber: number,
    params: UpdateGitHubIssueParams
  ): Promise<GitHubIssue> {
    return await this.request<GitHubIssue>(
      `/repos/${owner}/${repo}/issues/${issueNumber}`,
      {
        method: "PATCH",
        body: JSON.stringify(params),
      }
    );
  }

  /**
   * List pull requests for a repository
   */
  async listPullRequests(owner: string, repo: string, params?: {
    state?: "open" | "closed" | "all";
    head?: string;
    base?: string;
    sort?: "created" | "updated" | "popularity" | "long-running";
    direction?: "asc" | "desc";
    per_page?: number;
    page?: number;
  }): Promise<GitHubPullRequest[]> {
    const searchParams = new URLSearchParams();
    if (params?.state) searchParams.set("state", params.state);
    if (params?.head) searchParams.set("head", params.head);
    if (params?.base) searchParams.set("base", params.base);
    if (params?.sort) searchParams.set("sort", params.sort);
    if (params?.direction) searchParams.set("direction", params.direction);
    if (params?.per_page) searchParams.set("per_page", params.per_page.toString());
    if (params?.page) searchParams.set("page", params.page.toString());

    const query = searchParams.toString();
    const endpoint = `/repos/${owner}/${repo}/pulls${query ? `?${query}` : ""}`;
    
    return await this.request<GitHubPullRequest[]>(endpoint);
  }

  /**
   * Get a specific pull request
   */
  async getPullRequest(owner: string, repo: string, prNumber: number): Promise<GitHubPullRequest> {
    return await this.request<GitHubPullRequest>(`/repos/${owner}/${repo}/pulls/${prNumber}`);
  }

  /**
   * Create a new pull request
   */
  async createPullRequest(
    owner: string,
    repo: string,
    params: CreateGitHubPullRequestParams
  ): Promise<GitHubPullRequest> {
    return await this.request<GitHubPullRequest>(
      `/repos/${owner}/${repo}/pulls`,
      {
        method: "POST",
        body: JSON.stringify(params),
      }
    );
  }

  /**
   * Update an existing pull request
   */
  async updatePullRequest(
    owner: string,
    repo: string,
    prNumber: number,
    params: UpdateGitHubPullRequestParams
  ): Promise<GitHubPullRequest> {
    return await this.request<GitHubPullRequest>(
      `/repos/${owner}/${repo}/pulls/${prNumber}`,
      {
        method: "PATCH",
        body: JSON.stringify(params),
      }
    );
  }

  /**
   * List comments on an issue or pull request
   */
  async listComments(owner: string, repo: string, issueNumber: number): Promise<GitHubComment[]> {
    return await this.request<GitHubComment[]>(
      `/repos/${owner}/${repo}/issues/${issueNumber}/comments`
    );
  }

  /**
   * Create a comment on an issue or pull request
   */
  async createComment(
    owner: string,
    repo: string,
    issueNumber: number,
    body: string
  ): Promise<GitHubComment> {
    return await this.request<GitHubComment>(
      `/repos/${owner}/${repo}/issues/${issueNumber}/comments`,
      {
        method: "POST",
        body: JSON.stringify({ body }),
      }
    );
  }

  /**
   * List branches in a repository
   */
  async listBranches(owner: string, repo: string, params?: {
    protected?: boolean;
    per_page?: number;
    page?: number;
  }): Promise<GitHubBranch[]> {
    const searchParams = new URLSearchParams();
    if (params?.protected !== undefined) {
      searchParams.set("protected", params.protected.toString());
    }
    if (params?.per_page) searchParams.set("per_page", params.per_page.toString());
    if (params?.page) searchParams.set("page", params.page.toString());

    const query = searchParams.toString();
    const endpoint = `/repos/${owner}/${repo}/branches${query ? `?${query}` : ""}`;
    
    return await this.request<GitHubBranch[]>(endpoint);
  }

  /**
   * Get files changed in a pull request
   */
  async getPullRequestFiles(
    owner: string,
    repo: string,
    prNumber: number,
    params?: {
      per_page?: number;
      page?: number;
    }
  ): Promise<GitHubFile[]> {
    const searchParams = new URLSearchParams();
    if (params?.per_page) searchParams.set("per_page", params.per_page.toString());
    if (params?.page) searchParams.set("page", params.page.toString());

    const query = searchParams.toString();
    const endpoint = `/repos/${owner}/${repo}/pulls/${prNumber}/files${query ? `?${query}` : ""}`;
    
    return await this.request<GitHubFile[]>(endpoint);
  }

  /**
   * Get the authenticated user
   */
  async getAuthenticatedUser(): Promise<{ login: string; id: number; email?: string }> {
    return await this.request<{ login: string; id: number; email?: string }>("/user");
  }
}
