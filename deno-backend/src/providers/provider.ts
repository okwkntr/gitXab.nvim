/**
 * Provider Interface - Abstract interface for Git hosting platforms
 * 
 * This interface defines a unified API for interacting with different
 * Git hosting platforms (GitLab, GitHub, etc.).
 * 
 * @module
 */

/**
 * Common user representation across providers
 */
export interface User {
  id: string | number;
  username: string;
  name: string;
  avatarUrl?: string;
}

/**
 * Common repository representation across providers
 */
export interface Repository {
  id: string | number;
  name: string;
  fullName: string;  // owner/repo format (e.g., "vim/vim")
  description: string | null;
  url: string;
  defaultBranch: string;
  provider: 'gitlab' | 'github';
  owner: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Common issue representation across providers
 */
export interface Issue {
  id: string | number;
  number: number;  // Issue number (GitLab: iid, GitHub: number)
  title: string;
  body: string | null;
  state: 'open' | 'closed';
  author: User;
  assignees?: User[];
  labels: string[];
  createdAt: string;
  updatedAt: string;
  closedAt?: string | null;
  url: string;
}

/**
 * Common pull request / merge request representation
 */
export interface PullRequest {
  id: string | number;
  number: number;  // PR/MR number
  title: string;
  body: string | null;
  state: 'open' | 'closed' | 'merged';
  author: User;
  assignees?: User[];
  sourceBranch: string;
  targetBranch: string;
  createdAt: string;
  updatedAt: string;
  mergedAt: string | null;
  url: string;
  draft?: boolean;
}

/**
 * Common comment representation
 */
export interface Comment {
  id: string | number;
  body: string;
  author: User;
  createdAt: string;
  updatedAt: string;
  url?: string;
}

/**
 * Common branch representation
 */
export interface Branch {
  name: string;
  protected: boolean;
  default: boolean;
  commitSha: string;
}

/**
 * Common file diff representation
 */
export interface FileDiff {
  oldPath: string;
  newPath: string;
  oldMode?: string;
  newMode?: string;
  diff: string;
  additions: number;
  deletions: number;
  isNew: boolean;
  isDeleted: boolean;
  isRenamed: boolean;
}

/**
 * Pull request diff result
 */
export interface PullRequestDiff {
  files: FileDiff[];
  totalAdditions: number;
  totalDeletions: number;
}

/**
 * Parameters for creating an issue
 */
export interface CreateIssueParams {
  title: string;
  body?: string;
  labels?: string[];
  assignees?: string[];
}

/**
 * Parameters for updating an issue
 */
export interface UpdateIssueParams {
  title?: string;
  body?: string;
  state?: 'open' | 'closed';
  labels?: string[];
  assignees?: string[];
}

/**
 * Parameters for creating a pull request
 */
export interface CreatePullRequestParams {
  title: string;
  body?: string;
  sourceBranch: string;
  targetBranch: string;
  draft?: boolean;
}

/**
 * Provider Interface
 * 
 * Defines operations that all Git hosting platform providers must implement.
 * This enables GitXab to support multiple platforms (GitLab, GitHub) with
 * a unified API.
 */
export interface Provider {
  /**
   * Provider name identifier
   */
  readonly name: 'gitlab' | 'github';
  
  /**
   * Provider base URL (e.g., "https://gitlab.com", "https://api.github.com")
   */
  readonly baseUrl: string;
  
  // Repository operations
  
  /**
   * List repositories accessible to the authenticated user
   * 
   * @param query - Optional search query
   * @returns Array of repositories
   */
  listRepositories(query?: string): Promise<Repository[]>;
  
  /**
   * Get a specific repository
   * 
   * @param id - Repository ID (GitLab: numeric ID, GitHub: "owner/repo")
   * @returns Repository details
   */
  getRepository(id: string | number): Promise<Repository>;
  
  // Issue operations
  
  /**
   * List issues in a repository
   * 
   * @param repoId - Repository ID
   * @param state - Filter by state: 'open', 'closed', or 'all'
   * @returns Array of issues
   */
  listIssues(repoId: string | number, state?: string): Promise<Issue[]>;
  
  /**
   * Get a specific issue
   * 
   * @param repoId - Repository ID
   * @param issueNumber - Issue number
   * @returns Issue details
   */
  getIssue(repoId: string | number, issueNumber: number): Promise<Issue>;
  
  /**
   * Create a new issue
   * 
   * @param repoId - Repository ID
   * @param params - Issue creation parameters
   * @returns Created issue
   */
  createIssue(repoId: string | number, params: CreateIssueParams): Promise<Issue>;
  
  /**
   * Update an existing issue
   * 
   * @param repoId - Repository ID
   * @param issueNumber - Issue number
   * @param params - Issue update parameters
   * @returns Updated issue
   */
  updateIssue(repoId: string | number, issueNumber: number, params: UpdateIssueParams): Promise<Issue>;
  
  // Pull Request / Merge Request operations
  
  /**
   * List pull requests in a repository
   * 
   * @param repoId - Repository ID
   * @param state - Filter by state: 'open', 'closed', 'merged', or 'all'
   * @returns Array of pull requests
   */
  listPullRequests(repoId: string | number, state?: string): Promise<PullRequest[]>;
  
  /**
   * Get a specific pull request
   * 
   * @param repoId - Repository ID
   * @param number - Pull request number
   * @returns Pull request details
   */
  getPullRequest(repoId: string | number, number: number): Promise<PullRequest>;
  
  /**
   * Create a new pull request
   * 
   * @param repoId - Repository ID
   * @param params - Pull request creation parameters
   * @returns Created pull request
   */
  createPullRequest(repoId: string | number, params: CreatePullRequestParams): Promise<PullRequest>;
  
  // Comment operations
  
  /**
   * Get comments on an issue or pull request
   * 
   * @param repoId - Repository ID
   * @param issueNumber - Issue or PR number
   * @returns Array of comments
   */
  getComments(repoId: string | number, issueNumber: number): Promise<Comment[]>;
  
  /**
   * Create a comment on an issue or pull request
   * 
   * @param repoId - Repository ID
   * @param issueNumber - Issue or PR number
   * @param body - Comment text
   * @returns Created comment
   */
  createComment(repoId: string | number, issueNumber: number, body: string): Promise<Comment>;
  
  // Branch operations
  
  /**
   * List branches in a repository
   * 
   * @param repoId - Repository ID
   * @returns Array of branches
   */
  listBranches(repoId: string | number): Promise<Branch[]>;
  
  // Diff operations
  
  /**
   * Get diff for a pull request
   * 
   * @param repoId - Repository ID
   * @param number - Pull request number
   * @returns Pull request diff with file changes
   */
  getPullRequestDiff(repoId: string | number, number: number): Promise<PullRequestDiff>;
}
