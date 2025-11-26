/**
 * Unit tests for provider configuration and authentication
 */

import {
  assertEquals,
  assertExists,
} from "https://deno.land/std@0.208.0/assert/mod.ts";
import {
  DEFAULT_BASE_URLS,
  detectProviderFromEnv,
  detectProviderFromUrl,
  extractOwnerAndRepo,
  parseRepositoryId,
  type ProviderType,
} from "../../deno-backend/src/config/provider_config.ts";
import {
  createAuthHeaders,
  getTokenFromEnv,
  getUserAgent,
  validateTokenFormat,
} from "../../deno-backend/src/auth/provider_auth.ts";

// Provider detection tests
Deno.test("detectProviderFromUrl - GitHub HTTPS", () => {
  const url = "https://github.com/user/repo.git";
  assertEquals(detectProviderFromUrl(url), "github");
});

Deno.test("detectProviderFromUrl - GitHub SSH", () => {
  const url = "git@github.com:user/repo.git";
  assertEquals(detectProviderFromUrl(url), "github");
});

Deno.test("detectProviderFromUrl - GitLab.com HTTPS", () => {
  const url = "https://gitlab.com/group/project.git";
  assertEquals(detectProviderFromUrl(url), "gitlab");
});

Deno.test("detectProviderFromUrl - GitLab.com SSH", () => {
  const url = "git@gitlab.com:group/project.git";
  assertEquals(detectProviderFromUrl(url), "gitlab");
});

Deno.test("detectProviderFromUrl - Self-hosted GitLab", () => {
  const url = "https://gitlab.example.com/team/project.git";
  assertEquals(detectProviderFromUrl(url), "gitlab");
});

Deno.test("detectProviderFromUrl - Unknown provider", () => {
  const url = "https://bitbucket.org/user/repo.git";
  assertEquals(detectProviderFromUrl(url), null);
});

Deno.test("detectProviderFromUrl - Empty string", () => {
  assertEquals(detectProviderFromUrl(""), null);
});

Deno.test("detectProviderFromEnv - GitHub token present", () => {
  const originalToken = Deno.env.get("GITHUB_TOKEN");
  try {
    Deno.env.set("GITHUB_TOKEN", "ghp_test123");
    assertEquals(detectProviderFromEnv(), "github");
  } finally {
    if (originalToken) {
      Deno.env.set("GITHUB_TOKEN", originalToken);
    } else {
      Deno.env.delete("GITHUB_TOKEN");
    }
  }
});

Deno.test("detectProviderFromEnv - GitLab token present", () => {
  const originalToken = Deno.env.get("GITLAB_TOKEN");
  const originalGithub = Deno.env.get("GITHUB_TOKEN");
  try {
    Deno.env.delete("GITHUB_TOKEN");
    Deno.env.set("GITLAB_TOKEN", "glpat-test123");
    assertEquals(detectProviderFromEnv(), "gitlab");
  } finally {
    if (originalToken) {
      Deno.env.set("GITLAB_TOKEN", originalToken);
    } else {
      Deno.env.delete("GITLAB_TOKEN");
    }
    if (originalGithub) {
      Deno.env.set("GITHUB_TOKEN", originalGithub);
    }
  }
});

Deno.test("detectProviderFromEnv - No tokens", () => {
  const originalGithub = Deno.env.get("GITHUB_TOKEN");
  const originalGh = Deno.env.get("GH_TOKEN");
  const originalGitlab = Deno.env.get("GITLAB_TOKEN");
  try {
    Deno.env.delete("GITHUB_TOKEN");
    Deno.env.delete("GH_TOKEN");
    Deno.env.delete("GITLAB_TOKEN");
    assertEquals(detectProviderFromEnv(), null);
  } finally {
    if (originalGithub) Deno.env.set("GITHUB_TOKEN", originalGithub);
    if (originalGh) Deno.env.set("GH_TOKEN", originalGh);
    if (originalGitlab) Deno.env.set("GITLAB_TOKEN", originalGitlab);
  }
});

// Repository ID parsing tests
Deno.test("parseRepositoryId - Numeric ID", () => {
  assertEquals(parseRepositoryId(12345), "12345");
});

Deno.test("parseRepositoryId - String ID", () => {
  assertEquals(parseRepositoryId("owner/repo"), "owner/repo");
});

Deno.test("extractOwnerAndRepo - GitHub format", () => {
  const result = extractOwnerAndRepo("octocat/Hello-World");
  assertEquals(result, { owner: "octocat", repo: "Hello-World" });
});

Deno.test("extractOwnerAndRepo - GitLab nested groups", () => {
  const result = extractOwnerAndRepo("group/subgroup/project");
  assertEquals(result, { owner: "group/subgroup", repo: "project" });
});

Deno.test("extractOwnerAndRepo - Multiple levels", () => {
  const result = extractOwnerAndRepo("org/team/group/repo");
  assertEquals(result, { owner: "org/team/group", repo: "repo" });
});

// Token validation tests
Deno.test("validateTokenFormat - GitHub classic token", () => {
  const token = "ghp_" + "x".repeat(36);
  assertEquals(validateTokenFormat(token, "github"), true);
});

Deno.test("validateTokenFormat - GitHub fine-grained token", () => {
  const token = "github_pat_" + "x".repeat(82);
  assertEquals(validateTokenFormat(token, "github"), true);
});

Deno.test("validateTokenFormat - GitHub OAuth token", () => {
  const token = "gho_" + "x".repeat(36);
  assertEquals(validateTokenFormat(token, "github"), true);
});

Deno.test("validateTokenFormat - GitLab token", () => {
  const token = "glpat-" + "x".repeat(20);
  assertEquals(validateTokenFormat(token, "gitlab"), true);
});

Deno.test("validateTokenFormat - Empty token", () => {
  assertEquals(validateTokenFormat("", "github"), false);
  assertEquals(validateTokenFormat("   ", "gitlab"), false);
});

Deno.test("validateTokenFormat - Too short", () => {
  assertEquals(validateTokenFormat("short", "github"), false);
  assertEquals(validateTokenFormat("short", "gitlab"), false);
});

// Authentication header tests
Deno.test("createAuthHeaders - GitHub", () => {
  const token = "ghp_test123";
  const headers = createAuthHeaders(token, "github");

  assertEquals(headers["Authorization"], "Bearer ghp_test123");
  assertEquals(headers["Accept"], "application/vnd.github+json");
  assertExists(headers["X-GitHub-Api-Version"]);
});

Deno.test("createAuthHeaders - GitLab", () => {
  const token = "glpat-test123";
  const headers = createAuthHeaders(token, "gitlab");

  assertEquals(headers["PRIVATE-TOKEN"], "glpat-test123");
  assertEquals(headers["Content-Type"], "application/json");
});

// Token retrieval from environment
Deno.test("getTokenFromEnv - GitHub token", () => {
  const originalToken = Deno.env.get("GITHUB_TOKEN");
  try {
    Deno.env.set("GITHUB_TOKEN", "ghp_test123");
    const token = getTokenFromEnv("github");
    assertEquals(token, "ghp_test123");
  } finally {
    if (originalToken) {
      Deno.env.set("GITHUB_TOKEN", originalToken);
    } else {
      Deno.env.delete("GITHUB_TOKEN");
    }
  }
});

Deno.test("getTokenFromEnv - GH_TOKEN alternative", () => {
  const originalGithub = Deno.env.get("GITHUB_TOKEN");
  const originalGh = Deno.env.get("GH_TOKEN");
  try {
    Deno.env.delete("GITHUB_TOKEN");
    Deno.env.set("GH_TOKEN", "ghp_test456");
    const token = getTokenFromEnv("github");
    assertEquals(token, "ghp_test456");
  } finally {
    if (originalGithub) Deno.env.set("GITHUB_TOKEN", originalGithub);
    if (originalGh) {
      Deno.env.set("GH_TOKEN", originalGh);
    } else {
      Deno.env.delete("GH_TOKEN");
    }
  }
});

Deno.test("getTokenFromEnv - GitLab token", () => {
  const originalToken = Deno.env.get("GITLAB_TOKEN");
  try {
    Deno.env.set("GITLAB_TOKEN", "glpat-test789");
    const token = getTokenFromEnv("gitlab");
    assertEquals(token, "glpat-test789");
  } finally {
    if (originalToken) {
      Deno.env.set("GITLAB_TOKEN", originalToken);
    } else {
      Deno.env.delete("GITLAB_TOKEN");
    }
  }
});

Deno.test("getTokenFromEnv - No token set", () => {
  const originalGithub = Deno.env.get("GITHUB_TOKEN");
  const originalGh = Deno.env.get("GH_TOKEN");
  try {
    Deno.env.delete("GITHUB_TOKEN");
    Deno.env.delete("GH_TOKEN");
    const token = getTokenFromEnv("github");
    assertEquals(token, null);
  } finally {
    if (originalGithub) Deno.env.set("GITHUB_TOKEN", originalGithub);
    if (originalGh) Deno.env.set("GH_TOKEN", originalGh);
  }
});

// User agent test
Deno.test("getUserAgent", () => {
  const userAgent = getUserAgent();
  assertExists(userAgent);
  assertEquals(typeof userAgent, "string");
  assertEquals(userAgent.includes("gitXab"), true);
});

// Default base URLs test
Deno.test("DEFAULT_BASE_URLS - contains expected providers", () => {
  assertExists(DEFAULT_BASE_URLS.github);
  assertExists(DEFAULT_BASE_URLS.gitlab);
  assertEquals(DEFAULT_BASE_URLS.github, "https://api.github.com");
  assertEquals(DEFAULT_BASE_URLS.gitlab, "https://gitlab.com");
});
