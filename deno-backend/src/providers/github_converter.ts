/**
 * GitHub Provider Converter
 *
 * Converts GitHub API responses to unified provider data models.
 *
 * @module
 */

import type {
  Branch,
  Comment,
  FileDiff,
  Issue,
  PullRequest,
  PullRequestDiff,
  Repository,
  User,
} from "./provider.ts";
import type {
  GitHubBranch,
  GitHubComment,
  GitHubFile,
  GitHubIssue,
  GitHubPullRequest,
  GitHubRepository,
  GitHubUser,
} from "../models/github.ts";
import { BaseConverter, ConversionError } from "../models/common.ts";

/**
 * GitHub-specific converter implementation
 */
export class GitHubConverter extends BaseConverter {
  /**
   * Convert GitHub repository to unified model
   */
  convertRepository(repo: GitHubRepository): Repository {
    try {
      return {
        id: repo.id.toString(),
        name: repo.name,
        fullName: repo.full_name,
        description: repo.description,
        url: repo.html_url,
        defaultBranch: repo.default_branch,
        provider: "github",
        owner: repo.owner.login,
        createdAt: repo.created_at,
        updatedAt: repo.updated_at,
      };
    } catch (error) {
      throw new ConversionError(
        "github",
        "repository",
        error instanceof Error ? error.message : String(error),
        error instanceof Error ? error : undefined,
      );
    }
  }

  /**
   * Convert GitHub issue to unified model
   */
  convertIssue(issue: GitHubIssue): Issue {
    try {
      return {
        id: issue.id.toString(),
        number: issue.number,
        title: issue.title,
        body: issue.body,
        state: this.normalizeState(issue.state),
        author: this.convertUser(issue.user),
        assignees: issue.assignees?.map((a) => this.convertUser(a)) || [],
        labels: issue.labels?.map((l) => typeof l === "string" ? l : l.name) ||
          [],
        createdAt: issue.created_at,
        updatedAt: issue.updated_at,
        closedAt: issue.closed_at || null,
        url: issue.html_url,
      };
    } catch (error) {
      throw new ConversionError(
        "github",
        "issue",
        error instanceof Error ? error.message : String(error),
        error instanceof Error ? error : undefined,
      );
    }
  }

  /**
   * Convert GitHub pull request to unified model
   */
  convertPullRequest(pr: GitHubPullRequest): PullRequest {
    try {
      return {
        id: pr.id.toString(),
        number: pr.number,
        title: pr.title,
        body: pr.body,
        state: pr.merged ? "merged" : this.normalizeState(pr.state),
        author: this.convertUser(pr.user),
        assignees: pr.assignees?.map((a) => this.convertUser(a)) || [],
        sourceBranch: pr.head.ref,
        targetBranch: pr.base.ref,
        createdAt: pr.created_at,
        updatedAt: pr.updated_at,
        mergedAt: pr.merged_at,
        url: pr.html_url,
        draft: pr.draft || false,
      };
    } catch (error) {
      throw new ConversionError(
        "github",
        "pullRequest",
        error instanceof Error ? error.message : String(error),
        error instanceof Error ? error : undefined,
      );
    }
  }

  /**
   * Convert GitHub comment to unified model
   */
  convertComment(comment: GitHubComment): Comment {
    try {
      return {
        id: comment.id.toString(),
        body: comment.body,
        author: this.convertUser(comment.user),
        createdAt: comment.created_at,
        updatedAt: comment.updated_at,
        url: comment.html_url,
      };
    } catch (error) {
      throw new ConversionError(
        "github",
        "comment",
        error instanceof Error ? error.message : String(error),
        error instanceof Error ? error : undefined,
      );
    }
  }

  /**
   * Convert GitHub branch to unified model
   */
  convertBranch(branch: GitHubBranch, defaultBranch: string = "main"): Branch {
    try {
      return {
        name: branch.name,
        protected: branch.protected,
        default: branch.name === defaultBranch,
        commitSha: branch.commit.sha,
      };
    } catch (error) {
      throw new ConversionError(
        "github",
        "branch",
        error instanceof Error ? error.message : String(error),
        error instanceof Error ? error : undefined,
      );
    }
  }

  /**
   * Convert GitHub user to unified model
   */
  convertUser(user: GitHubUser): User {
    return {
      id: user.id.toString(),
      username: user.login,
      name: user.name || user.login,
      avatarUrl: user.avatar_url,
    };
  }

  /**
   * Convert GitHub file diff to unified model
   */
  convertFileDiff(file: GitHubFile): FileDiff {
    try {
      const status = file.status;
      return {
        oldPath: file.previous_filename || file.filename,
        newPath: file.filename,
        diff: file.patch || "",
        additions: file.additions,
        deletions: file.deletions,
        isNew: status === "added",
        isDeleted: status === "removed",
        isRenamed: status === "renamed",
      };
    } catch (error) {
      throw new ConversionError(
        "github",
        "fileDiff",
        error instanceof Error ? error.message : String(error),
        error instanceof Error ? error : undefined,
      );
    }
  }

  /**
   * Convert array of GitHub files to PullRequestDiff
   */
  convertPullRequestDiff(files: GitHubFile[]): PullRequestDiff {
    try {
      const fileDiffs = files.map((f) => this.convertFileDiff(f));

      return {
        files: fileDiffs,
        totalAdditions: files.reduce((sum, f) => sum + f.additions, 0),
        totalDeletions: files.reduce((sum, f) => sum + f.deletions, 0),
      };
    } catch (error) {
      throw new ConversionError(
        "github",
        "pullRequestDiff",
        error instanceof Error ? error.message : String(error),
        error instanceof Error ? error : undefined,
      );
    }
  }

  /**
   * Normalize GitHub state to unified format
   */
  private normalizeState(state: string): "open" | "closed" {
    return state === "open" ? "open" : "closed";
  }
}

/**
 * Default GitHub converter instance
 */
export const githubConverter = new GitHubConverter("github");
