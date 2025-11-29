/**
 * GitLab Provider Converter
 *
 * Converts GitLab API responses to unified provider data models.
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
  GitLabBranch,
  GitLabDiff,
  GitLabIssue,
  GitLabMergeRequest,
  GitLabNote,
  GitLabProject,
  GitLabUser,
} from "../models/gitlab.ts";
import { BaseConverter, ConversionError } from "../models/common.ts";

/**
 * GitLab-specific converter implementation
 */
export class GitLabConverter extends BaseConverter {
  /**
   * Convert GitLab project to unified repository model
   */
  convertRepository(project: GitLabProject): Repository {
    try {
      return {
        id: project.id.toString(),
        name: project.name,
        fullName: project.path_with_namespace,
        description: project.description,
        url: project.web_url,
        defaultBranch: project.default_branch,
        provider: "gitlab",
        owner: project.path_with_namespace.split("/")[0],
        createdAt: project.created_at,
        updatedAt: project.last_activity_at,
      };
    } catch (error) {
      throw new ConversionError(
        "gitlab",
        "repository",
        error instanceof Error ? error.message : String(error),
        error instanceof Error ? error : undefined,
      );
    }
  }

  /**
   * Convert GitLab issue to unified model
   */
  convertIssue(issue: GitLabIssue): Issue {
    try {
      const state = issue.state === "opened" ? "open" : "closed";
      return {
        id: issue.id.toString(),
        number: issue.iid,
        title: issue.title,
        body: issue.description,
        state,
        author: this.convertUser(issue.author),
        assignees: issue.assignees?.map((a) => this.convertUser(a)) || [],
        labels: issue.labels || [],
        createdAt: issue.created_at,
        updatedAt: issue.updated_at,
        closedAt: issue.closed_at,
        url: issue.web_url,
      };
    } catch (error) {
      throw new ConversionError(
        "gitlab",
        "issue",
        error instanceof Error ? error.message : String(error),
        error instanceof Error ? error : undefined,
      );
    }
  }

  /**
   * Convert GitLab merge request to unified pull request model
   */
  convertPullRequest(mr: GitLabMergeRequest): PullRequest {
    try {
      return {
        id: mr.id.toString(),
        number: mr.iid,
        title: mr.title,
        body: mr.description,
        state: this.normalizeState(mr.state),
        author: this.convertUser(mr.author),
        assignees: mr.assignees?.map((a) => this.convertUser(a)) || [],
        sourceBranch: mr.source_branch,
        targetBranch: mr.target_branch,
        createdAt: mr.created_at,
        updatedAt: mr.updated_at,
        mergedAt: mr.merged_at,
        url: mr.web_url,
        draft: mr.draft || false,
      };
    } catch (error) {
      throw new ConversionError(
        "gitlab",
        "pullRequest",
        error instanceof Error ? error.message : String(error),
        error instanceof Error ? error : undefined,
      );
    }
  }

  /**
   * Convert GitLab note to unified comment model
   */
  convertComment(note: GitLabNote): Comment {
    try {
      return {
        id: note.id.toString(),
        body: note.body,
        author: this.convertUser(note.author),
        createdAt: note.created_at,
        updatedAt: note.updated_at,
        url: "", // GitLab notes don't have direct URLs
      };
    } catch (error) {
      throw new ConversionError(
        "gitlab",
        "comment",
        error instanceof Error ? error.message : String(error),
        error instanceof Error ? error : undefined,
      );
    }
  }

  /**
   * Convert GitLab branch to unified model
   */
  convertBranch(branch: GitLabBranch, defaultBranch: string = "main"): Branch {
    try {
      return {
        name: branch.name,
        protected: branch.protected,
        default: branch.default || branch.name === defaultBranch,
        commitSha: branch.commit.id,
      };
    } catch (error) {
      throw new ConversionError(
        "gitlab",
        "branch",
        error instanceof Error ? error.message : String(error),
        error instanceof Error ? error : undefined,
      );
    }
  }

  /**
   * Convert GitLab user to unified model
   */
  convertUser(user: GitLabUser): User {
    return {
      id: user.id.toString(),
      username: user.username,
      name: user.name || user.username,
      avatarUrl: user.avatar_url,
    };
  }

  /**
   * Convert GitLab diff to unified file diff model
   */
  convertFileDiff(diff: GitLabDiff): FileDiff {
    try {
      return {
        oldPath: diff.old_path,
        newPath: diff.new_path,
        diff: diff.diff,
        additions: 0, // GitLab doesn't provide separate counts in diff
        deletions: 0, // Need to parse from diff string if needed
        isNew: diff.new_file,
        isDeleted: diff.deleted_file,
        isRenamed: diff.renamed_file,
      };
    } catch (error) {
      throw new ConversionError(
        "gitlab",
        "fileDiff",
        error instanceof Error ? error.message : String(error),
        error instanceof Error ? error : undefined,
      );
    }
  }

  /**
   * Convert array of GitLab diffs to PullRequestDiff
   */
  convertPullRequestDiff(diffs: GitLabDiff[]): PullRequestDiff {
    try {
      const fileDiffs = diffs.map((d) => this.convertFileDiff(d));

      // Calculate additions and deletions from diff strings
      let totalAdditions = 0;
      let totalDeletions = 0;

      for (const diff of diffs) {
        const lines = diff.diff.split("\n");
        for (const line of lines) {
          if (line.startsWith("+") && !line.startsWith("+++")) {
            totalAdditions++;
          } else if (line.startsWith("-") && !line.startsWith("---")) {
            totalDeletions++;
          }
        }
      }

      return {
        files: fileDiffs,
        totalAdditions,
        totalDeletions,
      };
    } catch (error) {
      throw new ConversionError(
        "gitlab",
        "pullRequestDiff",
        error instanceof Error ? error.message : String(error),
        error instanceof Error ? error : undefined,
      );
    }
  }

  /**
   * Normalize GitLab state to unified format
   */
  private normalizeState(state: string): "open" | "closed" | "merged" {
    switch (state) {
      case "opened":
        return "open";
      case "closed":
        return "closed";
      case "merged":
        return "merged";
      default:
        return "closed";
    }
  }
}

/**
 * Default GitLab converter instance
 */
export const gitlabConverter = new GitLabConverter("gitlab");
