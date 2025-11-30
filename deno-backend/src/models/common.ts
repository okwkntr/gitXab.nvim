/**
 * Common Data Models and Converters
 *
 * This module provides utilities for converting between provider-specific
 * types and unified common types defined in provider.ts.
 *
 * @module
 */

import type {
  Branch,
  Comment,
  Issue,
  PullRequest,
  Repository,
  User,
} from "../providers/provider.ts";

/**
 * Helper to normalize repository ID to string format
 *
 * @param id - Repository ID (can be number for GitLab or string for GitHub)
 * @returns Normalized string ID
 */
export function normalizeRepoId(id: string | number): string {
  return typeof id === "number" ? id.toString() : id;
}

/**
 * Helper to parse repository full name (owner/repo format)
 *
 * @param fullName - Full repository name in "owner/repo" format
 * @returns Object with owner and repo
 */
export function parseRepoFullName(
  fullName: string,
): { owner: string; repo: string } {
  const parts = fullName.split("/");
  if (parts.length !== 2) {
    throw new Error(`Invalid repository full name format: ${fullName}`);
  }
  return { owner: parts[0], repo: parts[1] };
}

/**
 * Helper to format repository full name
 *
 * @param owner - Repository owner
 * @param repo - Repository name
 * @returns Full name in "owner/repo" format
 */
export function formatRepoFullName(owner: string, repo: string): string {
  return `${owner}/${repo}`;
}

/**
 * Helper to normalize issue/PR state
 *
 * @param state - Provider-specific state (e.g., "opened", "open", "closed", "merged")
 * @returns Normalized state
 */
export function normalizeState(state: string): "open" | "closed" | "merged" {
  const normalized = state.toLowerCase();

  if (normalized === "opened" || normalized === "open") {
    return "open";
  }
  if (normalized === "closed") {
    return "closed";
  }
  if (normalized === "merged") {
    return "merged";
  }

  // Default to open for unknown states
  return "open";
}

/**
 * Helper to normalize date string to ISO 8601 format
 *
 * @param date - Date string or Date object
 * @returns ISO 8601 formatted date string
 */
export function normalizeDate(
  date: string | Date | null | undefined,
): string | null {
  if (!date) return null;

  try {
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toISOString();
  } catch {
    return null;
  }
}

/**
 * Helper to extract username from various user formats
 *
 * @param user - User object with potential variations
 * @returns Username string
 */
export function extractUsername(user: unknown): string {
  if (!user || typeof user !== "object") return "unknown";
  const u = user as { username?: string; login?: string; name?: string };
  return u.username || u.login || u.name || "unknown";
}

/**
 * Helper to create a common User object
 *
 * @param providerUser - Provider-specific user object
 * @returns Normalized User object
 */
// deno-lint-ignore no-explicit-any
export function createCommonUser(providerUser: any): User {
  return {
    id: providerUser.id,
    username: extractUsername(providerUser),
    name: providerUser.name || providerUser.display_name ||
      extractUsername(providerUser),
    avatarUrl: providerUser.avatar_url || providerUser.avatarUrl,
  };
}

/**
 * Helper to extract labels from various formats
 *
 * @param labels - Labels in various formats (array of strings or objects)
 * @returns Array of label names
 */
// deno-lint-ignore no-explicit-any
export function extractLabels(labels: any[] | undefined): string[] {
  if (!labels || !Array.isArray(labels)) return [];

  return labels.map((label) => {
    if (typeof label === "string") return label;
    if (label.name) return label.name;
    return String(label);
  });
}

/**
 * Base converter class with common conversion utilities
 */
export abstract class BaseConverter {
  protected provider: "gitlab" | "github";

  constructor(provider: "gitlab" | "github") {
    this.provider = provider;
  }

  /**
   * Convert provider-specific repository to common format
   */
  // deno-lint-ignore no-explicit-any
  abstract convertRepository(repo: any): Repository;

  /**
   * Convert provider-specific issue to common format
   */
  // deno-lint-ignore no-explicit-any
  abstract convertIssue(issue: any): Issue;

  /**
   * Convert provider-specific pull request to common format
   */
  // deno-lint-ignore no-explicit-any
  abstract convertPullRequest(pr: any): PullRequest;

  /**
   * Convert provider-specific comment to common format
   */
  // deno-lint-ignore no-explicit-any
  abstract convertComment(comment: any): Comment;

  /**
   * Convert provider-specific branch to common format
   */
  // deno-lint-ignore no-explicit-any
  abstract convertBranch(branch: any): Branch;
}

/**
 * Error class for conversion failures
 */
export class ConversionError extends Error {
  constructor(
    public provider: string,
    public type: string,
    message: string,
    public override cause?: Error,
  ) {
    super(`${provider} ${type} conversion failed: ${message}`);
    this.name = "ConversionError";
  }
}
