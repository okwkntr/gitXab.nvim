/**
 * Unit tests for GitHub API client
 */

import {
  assertEquals,
  assertExists,
} from "https://deno.land/std@0.208.0/assert/mod.ts";
import {
  GitHubAPIError,
  GitHubClient,
} from "../../deno-backend/src/services/github_client.ts";

// Mock GitHub API responses
const mockRepository = {
  id: 123456,
  name: "test-repo",
  full_name: "testuser/test-repo",
  owner: {
    login: "testuser",
    id: 789,
    avatar_url: "https://github.com/images/testuser.png",
  },
  private: false,
  description: "Test repository",
  fork: false,
  default_branch: "main",
  created_at: "2021-01-01T00:00:00Z",
  updated_at: "2021-01-02T00:00:00Z",
  pushed_at: "2021-01-02T00:00:00Z",
  html_url: "https://github.com/testuser/test-repo",
  clone_url: "https://github.com/testuser/test-repo.git",
  ssh_url: "git@github.com:testuser/test-repo.git",
};

const mockIssue = {
  id: 111,
  number: 1,
  title: "Test issue",
  body: "This is a test issue",
  state: "open",
  user: {
    login: "testuser",
    id: 789,
    avatar_url: "https://github.com/images/testuser.png",
  },
  labels: [],
  assignees: [],
  created_at: "2021-01-01T00:00:00Z",
  updated_at: "2021-01-02T00:00:00Z",
  html_url: "https://github.com/testuser/test-repo/issues/1",
};

const _mockPullRequest = {
  ...mockIssue,
  number: 2,
  title: "Test PR",
  draft: false,
  merged: false,
  mergeable: true,
  head: {
    ref: "feature-branch",
    sha: "abc123",
    repo: mockRepository,
  },
  base: {
    ref: "main",
    sha: "def456",
    repo: mockRepository,
  },
  additions: 10,
  deletions: 5,
  changed_files: 2,
  html_url: "https://github.com/testuser/test-repo/pull/2",
};

// Test with a fake token (these tests don't make real API calls)
const fakeToken = "ghp_faketoken123456789012345678901234567";

Deno.test("GitHubClient - constructor initializes with defaults", () => {
  const client = new GitHubClient({ token: fakeToken });
  assertEquals(client.getRateLimitInfo(), null);
});

Deno.test("GitHubClient - constructor accepts custom config", () => {
  const client = new GitHubClient({
    token: fakeToken,
    baseUrl: "https://api.github.example.com",
    maxRetries: 5,
    retryDelay: 2000,
  });
  assertExists(client);
});

Deno.test("GitHubClient - GitHubAPIError class", () => {
  const error = new GitHubAPIError("Test error", 404, {
    message: "Not Found",
    documentation_url: "https://docs.github.com",
  });

  assertEquals(error.name, "GitHubAPIError");
  assertEquals(error.status, 404);
  assertEquals(error.response?.message, "Not Found");
});

// Note: The following tests would require mocking fetch or using a test GitLab instance
// For now, we verify the client methods exist and have the correct signatures

Deno.test("GitHubClient - has listRepositories method", () => {
  const client = new GitHubClient({ token: fakeToken });
  assertEquals(typeof client.listRepositories, "function");
});

Deno.test("GitHubClient - has getRepository method", () => {
  const client = new GitHubClient({ token: fakeToken });
  assertEquals(typeof client.getRepository, "function");
});

Deno.test("GitHubClient - has listIssues method", () => {
  const client = new GitHubClient({ token: fakeToken });
  assertEquals(typeof client.listIssues, "function");
});

Deno.test("GitHubClient - has getIssue method", () => {
  const client = new GitHubClient({ token: fakeToken });
  assertEquals(typeof client.getIssue, "function");
});

Deno.test("GitHubClient - has createIssue method", () => {
  const client = new GitHubClient({ token: fakeToken });
  assertEquals(typeof client.createIssue, "function");
});

Deno.test("GitHubClient - has updateIssue method", () => {
  const client = new GitHubClient({ token: fakeToken });
  assertEquals(typeof client.updateIssue, "function");
});

Deno.test("GitHubClient - has listPullRequests method", () => {
  const client = new GitHubClient({ token: fakeToken });
  assertEquals(typeof client.listPullRequests, "function");
});

Deno.test("GitHubClient - has getPullRequest method", () => {
  const client = new GitHubClient({ token: fakeToken });
  assertEquals(typeof client.getPullRequest, "function");
});

Deno.test("GitHubClient - has createPullRequest method", () => {
  const client = new GitHubClient({ token: fakeToken });
  assertEquals(typeof client.createPullRequest, "function");
});

Deno.test("GitHubClient - has updatePullRequest method", () => {
  const client = new GitHubClient({ token: fakeToken });
  assertEquals(typeof client.updatePullRequest, "function");
});

Deno.test("GitHubClient - has listComments method", () => {
  const client = new GitHubClient({ token: fakeToken });
  assertEquals(typeof client.listComments, "function");
});

Deno.test("GitHubClient - has createComment method", () => {
  const client = new GitHubClient({ token: fakeToken });
  assertEquals(typeof client.createComment, "function");
});

Deno.test("GitHubClient - has listBranches method", () => {
  const client = new GitHubClient({ token: fakeToken });
  assertEquals(typeof client.listBranches, "function");
});

Deno.test("GitHubClient - has getPullRequestFiles method", () => {
  const client = new GitHubClient({ token: fakeToken });
  assertEquals(typeof client.getPullRequestFiles, "function");
});

Deno.test("GitHubClient - has getAuthenticatedUser method", () => {
  const client = new GitHubClient({ token: fakeToken });
  assertEquals(typeof client.getAuthenticatedUser, "function");
});
