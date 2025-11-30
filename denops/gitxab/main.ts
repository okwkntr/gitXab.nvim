/**
 * GitXab Denops Plugin
 *
 * This is the main entry point for the GitXab.vim plugin using denops.vim.
 * It provides direct integration with Neovim without requiring a separate backend server.
 *
 * @module
 */

import type { Denops } from "https://deno.land/x/denops_std@v6.0.1/mod.ts";
import * as buffer from "https://deno.land/x/denops_std@v6.0.1/buffer/mod.ts";
import * as fn from "https://deno.land/x/denops_std@v6.0.1/function/mod.ts";
import * as vars from "https://deno.land/x/denops_std@v6.0.1/variable/mod.ts";
import * as mapping from "https://deno.land/x/denops_std@v6.0.1/mapping/mod.ts";

// Multi-provider support
import {
  createProvider,
  detectCurrentProvider,
  type Provider,
} from "../../deno-backend/mod.ts";

// Legacy GitLab API functions (gradual migration to Provider interface)
import {
  addNoteToDiscussion as apiAddNoteToDiscussion,
  addNoteToMRDiscussion as apiAddNoteToMRDiscussion,
  createIssueNote as apiCreateIssueNote,
  createMergeRequest as apiCreateMergeRequest,
  createMRNote as apiCreateMRNote,
  getIssue as apiGetIssue,
  getIssueDiscussions as apiGetIssueDiscussions,
  getMergeRequest as apiGetMergeRequest,
  getMergeRequestChanges as apiGetMRChanges,
  getMergeRequestDiscussions as apiGetMRDiscussions,
  type Issue,
  listBranches as apiListBranches,
  listMergeRequests as apiListMergeRequests,
  type Project,
  updateIssue as apiUpdateIssue,
  type UpdateIssueParams,
} from "../../deno-backend/mod.ts";

// Extended Project type with original repository ID for GitHub support
interface ProjectWithRepoId extends Project {
  _repoId?: string | number; // Preserve original ID format (GitHub: "owner/repo", GitLab: number)
}

// Global provider instance
let providerInstance: Provider | null = null;

// Discussion types
interface DiscussionNote {
  id: number;
  type: string | null;
  body: string;
  author: {
    id: number;
    username: string;
    name: string;
  };
  created_at: string;
  updated_at: string;
  system: boolean;
  noteable_id: number;
  noteable_type: string;
  noteable_iid: number | null;
}

interface Discussion {
  id: string;
  individual_note: boolean;
  notes: DiscussionNote[];
}

// MergeRequest type definition
interface MergeRequest {
  id: number;
  iid: number;
  project_id: number;
  title: string;
  description: string | null;
  state: string;
  created_at: string;
  updated_at: string;
  merged_at: string | null;
  closed_at: string | null;
  author: {
    id: number;
    username: string;
    name: string;
  };
  assignees?: Array<{ id: number; username: string; name: string }>;
  source_branch: string;
  target_branch: string;
  web_url: string;
  labels?: string[];
}

// Store project data for interactive navigation
const projectDataMap = new Map<number, ProjectWithRepoId[]>();
// Store issue data for interactive navigation
const issueDataMap = new Map<number, Issue[]>();
// Store merge request data for interactive navigation
const mrDataMap = new Map<number, MergeRequest[]>();

/**
 * Get or create provider instance
 * This function initializes the provider based on environment or configuration
 */
async function getProvider(denops: Denops): Promise<Provider> {
  if (providerInstance) {
    return providerInstance;
  }

  try {
    // Get provider preference from Vim variable if set
    const preferredProvider = await vars.g.get(
      denops,
      "gitxab_provider",
      "auto",
    ) as string;

    if (preferredProvider === "auto") {
      // Auto-detect provider
      const detectedProvider = await detectCurrentProvider();
      await denops.cmd(
        `echomsg 'GitXab: Detected provider: ${detectedProvider}'`,
      );
      providerInstance = await createProvider();
    } else {
      // Use specified provider
      await denops.cmd(
        `echomsg 'GitXab: Using configured provider: ${preferredProvider}'`,
      );
      providerInstance = await createProvider({
        provider: preferredProvider as "github" | "gitlab",
      });
    }

    return providerInstance;
  } catch (error) {
    const err = error as Error;
    await denops.cmd(
      `echohl ErrorMsg | echomsg 'GitXab: Failed to initialize provider: ${err.message}' | echohl None`,
    );
    throw error;
  }
}

/**
 * Find existing buffer by filetype and reuse it, or create new one
 * @param denops - Denops instance
 * @param filetype - Buffer filetype to search for
 * @param bufferName - Optional buffer name to set (for new buffers only)
 * @returns Buffer number (existing or new), and whether it's a new buffer
 */
async function findOrCreateBuffer(
  denops: Denops,
  filetype: string,
  bufferName?: string,
): Promise<{ bufnr: number; isNew: boolean }> {
  const debug = Deno.env.get("GITXAB_DEBUG") === "1";

  if (debug) {
    await denops.cmd(
      `echo "[GitXab Debug] findOrCreateBuffer: filetype=${filetype}, bufferName=${
        bufferName || "none"
      }"`,
    );
  }

  // Get list of all buffers
  const buffers = await fn.getbufinfo(denops, { buflisted: true });

  if (debug) {
    await denops.cmd(
      `echo "[GitXab Debug] Found ${buffers.length} listed buffers"`,
    );
  }

  // Search for existing buffer with matching filetype OR buffer name
  for (const buf of buffers) {
    const bufnr = buf.bufnr;
    const ft = await fn.getbufvar(denops, bufnr, "&filetype") as string;
    const bufname = await fn.bufname(denops, bufnr) as string;

    if (debug) {
      await denops.cmd(
        `echo "[GitXab Debug] Checking buffer ${bufnr}: filetype='${ft}', name='${bufname}'"`,
      );
    }

    // Match by filetype OR buffer name
    const matchesFiletype = ft === filetype;
    const matchesName = bufferName && bufname === bufferName;

    if (matchesFiletype || matchesName) {
      // Found existing buffer - switch to it
      if (debug) {
        const matchType = matchesFiletype ? "filetype" : "name";
        await denops.cmd(
          `echo "[GitXab Debug] Found existing buffer ${bufnr} by ${matchType}"`,
        );
      }

      // Check if buffer is visible in any window
      const winnr = await fn.bufwinnr(denops, bufnr) as number;

      if (winnr !== -1) {
        // Buffer is visible - switch to that window and reuse it
        if (debug) {
          await denops.cmd(
            `echo "[GitXab Debug] Buffer visible in window ${winnr}, switching to it"`,
          );
        }
        await denops.cmd(`${winnr}wincmd w`);
        // Make buffer modifiable temporarily for content update
        await vars.b.set(denops, "modifiable", true);
      } else {
        // Buffer exists but not visible - switch to it in current window
        if (debug) {
          await denops.cmd(
            `echo "[GitXab Debug] Buffer not visible, switching to it with :buffer ${bufnr}"`,
          );
        }
        await denops.cmd(`buffer ${bufnr}`);
        await vars.b.set(denops, "modifiable", true);
      }
      return { bufnr, isNew: false };
    }
  }

  // No existing buffer found - create new one
  if (debug) {
    await denops.cmd(
      `echo "[GitXab Debug] No existing buffer found, creating new one"`,
    );
  }

  await denops.cmd("new");
  const bufnr = await fn.bufnr(denops, "%") as number;

  // Set buffer name if provided (only for new buffers)
  if (bufferName) {
    try {
      await denops.cmd(`file ${bufferName}`);
      if (debug) {
        await denops.cmd(
          `echo "[GitXab Debug] Set buffer name to '${bufferName}'"`,
        );
      }
    } catch (error) {
      // Ignore errors when setting buffer name
      if (debug) {
        const msg = error instanceof Error ? error.message : String(error);
        await denops.cmd(
          `echo "[GitXab Debug] Failed to set buffer name: ${msg}"`,
        );
      }
    }
  }

  if (debug) {
    await denops.cmd(`echo "[GitXab Debug] Created new buffer ${bufnr}"`);
  }

  return { bufnr, isNew: true };
}

export async function main(denops: Denops): Promise<void> {
  // Register plugin dispatcher functions
  denops.dispatcher = {
    /**
     * List GitLab projects
     * @param query - Optional search query
     * @returns Array of projects
     */
    async listProjects(query?: unknown): Promise<unknown> {
      try {
        const _q = typeof query === "string" ? query : undefined;

        // Use unified Provider interface for all providers
        const provider = await getProvider(denops);
        const repositories = await provider.listRepositories();

        // Store repositories for later use (preserve original ID format)
        const _repoMap = new Map(repositories.map((r) => [r.name, r]));

        // Convert Repository[] to ProjectWithRepoId[] for backward compatibility
        // Note: For GitHub, use "owner/repo" format; for GitLab use numeric ID
        const projects: ProjectWithRepoId[] = repositories.map((repo) => ({
          id: typeof repo.id === "number"
            ? repo.id
            : parseInt(repo.id, 10) || 0,
          name: repo.name,
          path: repo.fullName,
          description: repo.description || "",
          web_url: repo.url,
          path_with_namespace: repo.fullName,
          namespace: {
            name: repo.fullName.split("/")[0],
            path: repo.fullName.split("/")[0],
          },
          default_branch: repo.defaultBranch,
          // For GitHub: use "owner/repo" format; for GitLab: use numeric ID
          // Use provider name to determine correct format
          _repoId: provider.name === "github" ? repo.fullName : repo.id,
        }));

        const providerName = provider.name === "github" ? "GitHub" : "GitLab";

        if (projects.length === 0) {
          // Use simpler echo command instead of nvim_echo
          await denops.cmd(
            'echohl WarningMsg | echo "No projects found" | echohl None',
          );
          return [];
        }

        // Find or create buffer for displaying projects
        const { bufnr, isNew: _isNew } = await findOrCreateBuffer(
          denops,
          "gitxab-projects",
          "GitXab://projects",
        );

        // Store project data for this buffer
        projectDataMap.set(bufnr, projects);

        // Format projects with header
        const lines: string[] = [
          `${providerName} Projects`,
          "=".repeat(80),
          "Keys: <Enter>=Menu  q=Close  ?=Help",
          "=".repeat(80),
          "",
        ];
        lines.push(
          ...projects.map((p) =>
            `${p.name} - ${p.description || "(no description)"}`
          ),
        );

        // Set buffer options
        await buffer.ensure(denops, bufnr, async () => {
          await buffer.replace(denops, bufnr, lines);
        });

        // Set buffer as non-modifiable and scratch
        await vars.b.set(denops, "buftype", "nofile");
        await vars.b.set(denops, "bufhidden", "wipe");
        await vars.b.set(denops, "modifiable", false);
        await vars.b.set(denops, "filetype", "gitxab-projects");

        // Set up key mappings for interactive navigation
        await mapping.map(
          denops,
          "<CR>",
          `<Cmd>call denops#request('${denops.name}', 'openProjectMenu', [bufnr('%')])<CR>`,
          { mode: "n", buffer: true },
        );
        await mapping.map(
          denops,
          "q",
          "<Cmd>close<CR>",
          { mode: "n", buffer: true },
        );
        await mapping.map(
          denops,
          "?",
          `<Cmd>call denops#request('${denops.name}', 'showHelp', ['projects'])<CR>`,
          { mode: "n", buffer: true },
        );

        return projects;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        await denops.call(
          "nvim_err_writeln",
          `GitXab: Failed to list projects: ${message}`,
        );
        throw error;
      }
    },

    /**
     * Open project menu to select action (issues, MRs, etc.)
     * @param bufnr - Buffer number of project list
     */
    async openProjectMenu(bufnr: unknown): Promise<void> {
      try {
        if (typeof bufnr !== "number") {
          throw new Error("Invalid buffer number");
        }

        // Get current line text to extract project name
        const line = await fn.line(denops, ".") as number;
        const lineText = await fn.getline(denops, line) as string;

        // Get project data for this buffer
        const projects = projectDataMap.get(bufnr);
        if (!projects) {
          await denops.call(
            "nvim_err_writeln",
            "GitXab: No project data found",
          );
          return;
        }

        // Find project by matching line text (format: "name - description")
        const projectName = lineText.split(" - ")[0].trim();
        const project = projects.find((p) => p.name === projectName) as
          | ProjectWithRepoId
          | undefined;

        if (!project) {
          return; // Not on a valid project line
        }

        // Show menu using inputlist
        const choices = [
          `Project: ${project.name} (ID: ${project.id})`,
          "1. View Issues",
          "2. Create New Issue",
          "3. View Merge Requests",
          "4. Create New Merge Request",
          "5. Cancel",
        ];

        const choice = await denops.call("inputlist", choices) as number;

        // Use original repository ID (handles both GitHub "owner/repo" and GitLab numeric ID)
        const repoId = project._repoId || project.id;

        // Debug: Log the project object and repoId
        console.log(
          "[GitXab Debug] Project:",
          JSON.stringify(project, null, 2),
        );
        console.log("[GitXab Debug] repoId:", repoId, "type:", typeof repoId);

        if (choice === 1) {
          // View issues
          await denops.dispatcher.listIssues(repoId);
        } else if (choice === 2) {
          // Create issue
          await denops.dispatcher.createIssue(repoId);
        } else if (choice === 3) {
          // View merge requests
          await denops.dispatcher.listMergeRequests(repoId);
        } else if (choice === 4) {
          // Create merge request
          await denops.dispatcher.createMergeRequest(repoId);
        }
        // choice === 5 or 0 (ESC) - do nothing
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        await denops.call(
          "nvim_err_writeln",
          `GitXab: Failed to open project menu: ${message}`,
        );
      }
    },

    /**
     * List issues for a project
     * @param projectId - GitLab project ID
     * @param state - Filter by state (opened, closed, all)
     */
    async listIssues(projectId: unknown, state?: unknown): Promise<unknown> {
      try {
        if (typeof projectId !== "number" && typeof projectId !== "string") {
          throw new Error("Project ID is required");
        }

        const stateFilter = typeof state === "string" ? state : undefined;

        // Use unified Provider interface
        const provider = await getProvider(denops);

        // Debug: Log provider and projectId
        console.log("[GitXab Debug] listIssues - Provider:", provider.name);
        console.log(
          "[GitXab Debug] listIssues - projectId:",
          projectId,
          "type:",
          typeof projectId,
        );

        const providerIssues = await provider.listIssues(
          projectId,
          stateFilter,
        );

        // Convert to legacy Issue format for compatibility
        const issues = providerIssues.map((issue): Issue => ({
          id: typeof issue.id === "string"
            ? parseInt(issue.id, 10) || 0
            : issue.id,
          iid: issue.number,
          project_id: typeof projectId === "number" ? projectId : 0,
          title: issue.title,
          description: issue.body || "",
          state: issue.state === "open" ? "opened" : "closed",
          created_at: issue.createdAt,
          updated_at: issue.updatedAt,
          author: {
            id: typeof issue.author.id === "string"
              ? parseInt(issue.author.id, 10) || 0
              : issue.author.id,
            name: issue.author.name,
            username: issue.author.username,
          },
          assignee: issue.assignees?.[0]
            ? {
              id: typeof issue.assignees[0].id === "string"
                ? parseInt(issue.assignees[0].id, 10) || 0
                : issue.assignees[0].id,
              name: issue.assignees[0].name,
              username: issue.assignees[0].username,
            }
            : undefined,
          assignees: issue.assignees?.map((a) => ({
            id: typeof a.id === "string" ? parseInt(a.id, 10) || 0 : a.id,
            name: a.name,
            username: a.username,
          })) || [],
          labels: issue.labels,
          web_url: issue.url,
        }));

        if (!Array.isArray(issues)) {
          throw new Error("API returned unexpected format for issues");
        }

        if (issues.length === 0) {
          await denops.cmd(
            'echohl WarningMsg | echo "No issues found" | echohl None',
          );
          return [];
        }

        // Find or create buffer for displaying issues
        const { bufnr, isNew: _isNew } = await findOrCreateBuffer(
          denops,
          "gitxab-issues",
          `GitXab://project/${projectId}/issues`,
        );

        // Store issue data for this buffer
        issueDataMap.set(bufnr, issues);

        const providerName = provider.name === "github" ? "GitHub" : "GitLab";

        // Format issues for display
        const lines: string[] = [
          `${providerName} Issues - ${projectId}`,
          "=".repeat(80),
          "Keys: <Enter>=Detail  n=New  r=Refresh  q=Close  ?=Help",
          "=".repeat(80),
          `Total: ${issues.length} issues`,
          "",
        ];

        // Group by state
        const openIssues = issues.filter((i) => i.state === "opened");
        const closedIssues = issues.filter((i) => i.state === "closed");

        if (openIssues.length > 0) {
          lines.push("Open Issues:");
          lines.push("-".repeat(80));
          for (const issue of openIssues) {
            const assignee = issue.assignee?.username ||
              issue.assignees?.[0]?.username || "unassigned";
            const labels = issue.labels && issue.labels.length > 0
              ? `[${issue.labels.join(", ")}]`
              : "";
            const date = new Date(issue.created_at).toLocaleDateString();
            lines.push(
              `#${issue.iid} ${issue.title} ${labels} @${assignee} ${date}`,
            );
          }
          lines.push("");
        }

        if (closedIssues.length > 0) {
          lines.push("Closed Issues:");
          lines.push("-".repeat(80));
          for (const issue of closedIssues) {
            const assignee = issue.assignee?.username ||
              issue.assignees?.[0]?.username || "unassigned";
            const labels = issue.labels && issue.labels.length > 0
              ? `[${issue.labels.join(", ")}]`
              : "";
            const date = new Date(issue.updated_at).toLocaleDateString();
            lines.push(
              `#${issue.iid} ${issue.title} ${labels} @${assignee} ${date}`,
            );
          }
          lines.push("");
        }

        // Set buffer content
        await buffer.ensure(denops, bufnr, async () => {
          await buffer.replace(denops, bufnr, lines);
        });

        // Set buffer options
        await vars.b.set(denops, "buftype", "nofile");
        await vars.b.set(denops, "bufhidden", "wipe");
        await vars.b.set(denops, "modifiable", false);
        await vars.b.set(denops, "filetype", "gitxab-issues");

        // Set up key mappings
        // Use JSON.stringify for projectId to handle both string and number
        const projectIdStr = JSON.stringify(projectId);

        await mapping.map(
          denops,
          "<CR>",
          `<Cmd>call denops#request('${denops.name}', 'openIssueDetail', [bufnr('%'), ${projectIdStr}])<CR>`,
          { mode: "n", buffer: true },
        );
        await mapping.map(
          denops,
          "q",
          "<Cmd>close<CR>",
          { mode: "n", buffer: true },
        );
        await mapping.map(
          denops,
          "r",
          `<Cmd>call denops#request('${denops.name}', 'listIssues', [${projectIdStr}, '${
            stateFilter || ""
          }'])<CR>`,
          { mode: "n", buffer: true },
        );
        await mapping.map(
          denops,
          "n",
          `<Cmd>call denops#request('${denops.name}', 'createIssue', [${projectIdStr}])<CR>`,
          { mode: "n", buffer: true },
        );
        await mapping.map(
          denops,
          "?",
          `<Cmd>call denops#request('${denops.name}', 'showHelp', ['issues'])<CR>`,
          { mode: "n", buffer: true },
        );

        return issues;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        await denops.call(
          "nvim_err_writeln",
          `GitXab: Failed to list issues: ${message}`,
        );
        throw error;
      }
    },

    /**
     * Create a new issue
     * @param projectId - GitLab project ID
     */
    async createIssue(projectId: unknown): Promise<void> {
      try {
        if (typeof projectId !== "number" && typeof projectId !== "string") {
          throw new Error("Project ID is required");
        }

        // Prompt for issue title
        const title = await denops.call("input", "Issue title: ") as string;
        if (!title || title.trim() === "") {
          await denops.cmd(
            'echohl WarningMsg | echo "Issue creation cancelled" | echohl None',
          );
          return;
        }

        // Prompt for issue description
        const description = await denops.call(
          "input",
          "Issue description (optional): ",
        ) as string;

        // Prompt for labels
        const labelsInput = await denops.call(
          "input",
          "Labels (comma-separated, optional): ",
        ) as string;

        // Build issue params
        const params = {
          title: title.trim(),
          body: description && description.trim()
            ? description.trim()
            : undefined,
          labels: labelsInput && labelsInput.trim()
            ? labelsInput.trim().split(",").map((l) => l.trim())
            : undefined,
        };

        // Create the issue using unified Provider interface
        await denops.cmd('echo "Creating issue..."');
        const provider = await getProvider(denops);
        const issue = await provider.createIssue(projectId, params);

        // Show success message
        await denops.cmd(
          `echohl MoreMsg | echo "✓ Issue #${issue.number} created successfully" | echohl None`,
        );

        // Optionally refresh issue list if we're in an issue buffer
        const filetype = await vars.b.get(denops, "filetype");
        if (filetype === "gitxab-issues") {
          await denops.dispatcher.listIssues(projectId);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        await denops.call(
          "nvim_err_writeln",
          `GitXab: Failed to create issue: ${message}`,
        );
      }
    },

    /**
     * Open issue detail view from issue list
     * @param bufnr - Buffer number of issue list
     * @param projectId - GitLab project ID
     */
    async openIssueDetail(bufnr: unknown, projectId: unknown): Promise<void> {
      try {
        if (typeof bufnr !== "number" || typeof projectId !== "number") {
          throw new Error("Invalid buffer number or project ID");
        }

        // Get current line number
        const line = await fn.line(denops, ".") as number;

        // Get current line text to extract issue IID
        const lineText = await fn.getline(denops, line) as string;

        // Extract issue IID from line (format: "#IID Title ...")
        const match = lineText.match(/^#(\d+)\s/);
        if (!match) {
          return; // Not on a valid issue line
        }

        const issueIid = parseInt(match[1], 10);
        await denops.dispatcher.viewIssue(projectId, issueIid);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        await denops.call(
          "nvim_err_writeln",
          `GitXab: Failed to open issue detail: ${message}`,
        );
      }
    },

    /**
     * View issue details with comments
     * @param projectId - GitLab project ID
     * @param issueIid - Issue IID
     */
    async viewIssue(projectId: unknown, issueIid: unknown): Promise<void> {
      try {
        if (typeof projectId !== "number" && typeof projectId !== "string") {
          throw new Error("Project ID is required");
        }
        if (typeof issueIid !== "number" && typeof issueIid !== "string") {
          throw new Error("Issue IID is required");
        }

        const pid = typeof projectId === "string"
          ? parseInt(projectId, 10)
          : projectId;
        const iid = typeof issueIid === "string"
          ? parseInt(issueIid, 10)
          : issueIid;

        if (isNaN(pid) || isNaN(iid)) {
          throw new Error("Invalid project ID or issue IID");
        }

        // Fetch issue details and discussions
        await denops.cmd('echo "Loading issue..."');
        const [issue, discussions] = await Promise.all([
          apiGetIssue(pid, iid),
          apiGetIssueDiscussions(pid, iid),
        ]);

        // Find or create buffer for displaying issue details
        const { bufnr, isNew: _isNew } = await findOrCreateBuffer(
          denops,
          "gitxab-issue",
          `GitXab://project/${pid}/issue/${iid}`,
        );

        // Format issue details
        const lines: string[] = [
          `GitLab Issue #${issue.iid}: ${issue.title}`,
          "=".repeat(80),
          "Keys: c=Comment  R=Reply  e=Edit  r=Refresh  q=Close  ?=Help",
          "=".repeat(80),
          `Project: #${pid}`,
          `State: ${issue.state}`,
          `Author: @${issue.author.username}`,
          `Created: ${new Date(issue.created_at).toLocaleString()}`,
          `Updated: ${new Date(issue.updated_at).toLocaleString()}`,
        ];

        if (issue.assignee || issue.assignees?.length) {
          const assignees = issue.assignees?.map((a: { username: string }) =>
            `@${a.username}`
          ).join(", ") || `@${issue.assignee?.username}`;
          lines.push(`Assignees: ${assignees}`);
        }

        if (issue.labels && issue.labels.length > 0) {
          lines.push(`Labels: ${issue.labels.join(", ")}`);
        }

        if (issue.web_url) {
          lines.push(`URL: ${issue.web_url}`);
        }

        lines.push("");
        lines.push("Description:");
        lines.push("-".repeat(80));
        if (issue.description) {
          lines.push(...issue.description.split("\n"));
        } else {
          lines.push("(no description)");
        }

        // Add discussions with numbering
        // Filter to only include discussions with user comments (not system notes)
        // Include both individual notes and discussion threads
        const userDiscussions = discussions.filter((d: Discussion) =>
          d.notes.some((n: DiscussionNote) => !n.system)
        );

        if (userDiscussions.length > 0) {
          lines.push("");
          lines.push(`Discussions (${userDiscussions.length}):`);
          lines.push("=".repeat(80));

          for (let i = 0; i < userDiscussions.length; i++) {
            const discussion = userDiscussions[i];
            const discussionType = discussion.individual_note
              ? "Comment"
              : "Thread";
            lines.push("");
            lines.push(
              `[${i + 1}] ${discussionType} - Discussion ID: ${discussion.id}`,
            );

            // Display all notes in this discussion
            for (const note of discussion.notes) {
              if (note.system) continue; // Skip system notes
              lines.push("");
              lines.push(
                `  @${note.author.username} - ${
                  new Date(note.created_at).toLocaleString()
                }`,
              );
              lines.push("  " + "-".repeat(78));
              lines.push(
                ...note.body.split("\n").map((line: string) => `  ${line}`),
              );
            }
          }
        }

        // Store discussions data in buffer variable for reply feature
        await vars.b.set(denops, "gitxab_discussions", userDiscussions);

        // Set buffer content
        await buffer.ensure(denops, bufnr, async () => {
          await buffer.replace(denops, bufnr, lines);
        });

        // Set buffer options
        await vars.b.set(denops, "buftype", "nofile");
        await vars.b.set(denops, "bufhidden", "wipe");
        await vars.b.set(denops, "modifiable", false);
        await vars.b.set(denops, "filetype", "gitxab-issue");

        // Store issue info in buffer variables
        await vars.b.set(denops, "gitxab_project_id", pid);
        await vars.b.set(denops, "gitxab_issue_iid", iid);

        // Set up key mappings
        await mapping.map(
          denops,
          "q",
          "<Cmd>close<CR>",
          { mode: "n", buffer: true },
        );
        await mapping.map(
          denops,
          "c",
          `<Cmd>call denops#request('${denops.name}', 'addComment', [${pid}, ${iid}])<CR>`,
          { mode: "n", buffer: true },
        );
        await mapping.map(
          denops,
          "R",
          `<Cmd>call denops#request('${denops.name}', 'replyToComment', [${pid}, ${iid}])<CR>`,
          { mode: "n", buffer: true },
        );
        await mapping.map(
          denops,
          "e",
          `<Cmd>call denops#request('${denops.name}', 'editIssue', [${pid}, ${iid}])<CR>`,
          { mode: "n", buffer: true },
        );
        await mapping.map(
          denops,
          "r",
          `<Cmd>call denops#request('${denops.name}', 'viewIssue', [${pid}, ${iid}])<CR>`,
          { mode: "n", buffer: true },
        );
        await mapping.map(
          denops,
          "?",
          `<Cmd>call denops#request('${denops.name}', 'showHelp', ['issue-detail'])<CR>`,
          { mode: "n", buffer: true },
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        await denops.call(
          "nvim_err_writeln",
          `GitXab: Failed to view issue: ${message}`,
        );
      }
    },

    /**
     * Add comment to issue
     * @param projectId - GitLab project ID
     * @param issueIid - Issue IID
     */
    async addComment(projectId: unknown, issueIid: unknown): Promise<void> {
      try {
        if (typeof projectId !== "number" || typeof issueIid !== "number") {
          throw new Error("Invalid project ID or issue IID");
        }

        // Create temporary file for comment editing
        let tmpDir = await denops.call("expand", "$TMPDIR") as string;
        if (!tmpDir || tmpDir === "$TMPDIR") {
          tmpDir = await denops.call("expand", "$TEMP") as string;
        }
        if (!tmpDir || tmpDir === "$TEMP") {
          const tempPath = await fn.tempname(denops) as string;
          tmpDir = await denops.call("fnamemodify", tempPath, ":h") as string;
        }
        const tmpFile = `${tmpDir}/.gitxab_${projectId}_${issueIid}_comment.md`;

        // Set initial content with instructions
        const instructions = [
          `" GitXab: Add comment to Issue #${issueIid}`,
          `" Project ID: ${projectId}, Issue IID: ${issueIid}`,
          `"`,
          `" Instructions:`,
          `"   1. Write your comment below (markdown supported)`,
          `"   2. Save with :w (or :wq to save and close)`,
          `"   3. Comment will be posted when you close the buffer`,
          `"   4. Close without saving (:q!) to cancel`,
          `"`,
          `" ========================================`,
          "",
        ];

        // Write to temporary file
        await denops.call("writefile", instructions, tmpFile);

        // Open file in split window
        await denops.cmd(`split ${tmpFile}`);
        const bufnr = await fn.bufnr(denops, "%") as number;

        // Set buffer options
        await vars.b.set(denops, "filetype", "markdown");
        await vars.b.set(denops, "gitxab_project_id", projectId);
        await vars.b.set(denops, "gitxab_issue_iid", issueIid);
        await vars.b.set(denops, "gitxab_tmpfile", tmpFile);
        await vars.b.set(denops, "gitxab_action", "comment");

        // Move cursor to first content line
        await denops.cmd(`normal! ${instructions.length + 1}G`);

        // Set up autocmds - post on save, cleanup on unload
        const escapedPath = tmpFile.replace(/\\/g, "\\\\").replace(/ /g, "\\ ");
        await denops.cmd(`augroup GitXabComment`);
        await denops.cmd(`autocmd! * ${escapedPath}`);
        await denops.cmd(
          `autocmd BufWritePost ${escapedPath} call denops#request('${denops.name}', 'onCommentBufferSave', [${bufnr}])`,
        );
        await denops.cmd(
          `autocmd BufUnload ${escapedPath} call denops#request('${denops.name}', 'cleanupCommentEdit', ['${tmpFile}'])`,
        );
        await denops.cmd(`augroup END`);

        await denops.cmd('echo "Write your comment, :w to post, :q to close"');
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        await denops.call(
          "nvim_err_writeln",
          `GitXab: Failed to open comment editor: ${message}`,
        );
      }
    },

    /**
     * Reply to a specific discussion thread
     * @param projectId - GitLab project ID
     * @param issueIid - Issue IID
     */
    async replyToComment(projectId: unknown, issueIid: unknown): Promise<void> {
      try {
        if (typeof projectId !== "number" || typeof issueIid !== "number") {
          throw new Error("Invalid project ID or issue IID");
        }

        // Get stored discussions from buffer
        const discussions = await fn.getbufvar(
          denops,
          "%",
          "gitxab_discussions",
        ) as Discussion[] | string;
        if (
          !discussions || typeof discussions === "string" ||
          discussions.length === 0
        ) {
          await denops.cmd(
            'echohl WarningMsg | echo "No discussions found" | echohl None',
          );
          return;
        }

        // Prompt for discussion number
        const discussionNumStr = await denops.call(
          "input",
          `Reply to discussion [1-${discussions.length}]: `,
        ) as string;
        if (!discussionNumStr || discussionNumStr.trim() === "") {
          await denops.cmd(
            'echohl WarningMsg | echo "Reply cancelled" | echohl None',
          );
          return;
        }

        const discussionNum = parseInt(discussionNumStr.trim(), 10);
        if (
          isNaN(discussionNum) || discussionNum < 1 ||
          discussionNum > discussions.length
        ) {
          await denops.cmd(
            'echohl ErrorMsg | echo "Invalid discussion number" | echohl None',
          );
          return;
        }

        const targetDiscussion = discussions[discussionNum - 1];
        const firstNote = targetDiscussion.notes[0];

        // Create temporary file for reply editing
        let tmpDir = await denops.call("expand", "$TMPDIR") as string;
        if (!tmpDir || tmpDir === "$TMPDIR") {
          tmpDir = await denops.call("expand", "$TEMP") as string;
        }
        if (!tmpDir || tmpDir === "$TEMP") {
          const tempPath = await fn.tempname(denops) as string;
          tmpDir = await denops.call("fnamemodify", tempPath, ":h") as string;
        }
        const tmpFile =
          `${tmpDir}/.gitxab_${projectId}_${issueIid}_reply_${discussionNum}.md`;

        // Set initial content with instructions and context
        const instructions = [
          `" GitXab: Reply to Discussion #${discussionNum} on Issue #${issueIid}`,
          `" Project ID: ${projectId}, Issue IID: ${issueIid}`,
          `" Replying to: @${firstNote.author.username}`,
          `"`,
          `" Original discussion:`,
        ];

        // Add quoted context from the discussion
        for (const note of targetDiscussion.notes) {
          instructions.push(
            `" > @${note.author.username}: ${note.body.split("\n")[0]}`,
          );
        }

        instructions.push(
          `"`,
          `" Instructions:`,
          `"   1. Write your reply below (markdown supported)`,
          `"   2. Save with :w (or :wq to save and close)`,
          `"   3. Reply will be posted when you close the buffer`,
          `"   4. Close without saving (:q!) to cancel`,
          `"`,
          `" ========================================`,
          "",
        );

        // Write to temporary file
        await denops.call("writefile", instructions, tmpFile);

        // Open file in split window
        await denops.cmd(`split ${tmpFile}`);
        const bufnr = await fn.bufnr(denops, "%") as number;

        // Set buffer options and store context
        await vars.b.set(denops, "filetype", "markdown");
        await vars.b.set(denops, "gitxab_project_id", projectId);
        await vars.b.set(denops, "gitxab_issue_iid", issueIid);
        await vars.b.set(denops, "gitxab_tmpfile", tmpFile);
        await vars.b.set(denops, "gitxab_action", "reply");
        await vars.b.set(denops, "gitxab_discussion_id", targetDiscussion.id);
        await vars.b.set(denops, "gitxab_discussion_num", discussionNum);

        // Move cursor to first content line
        await denops.cmd(`normal! ${instructions.length + 1}G`);

        // Set up autocmds - post on save, cleanup on unload
        const escapedPath = tmpFile.replace(/\\/g, "\\\\").replace(/ /g, "\\ ");
        await denops.cmd(`augroup GitXabReply`);
        await denops.cmd(`autocmd! * ${escapedPath}`);
        await denops.cmd(
          `autocmd BufWritePost ${escapedPath} call denops#request('${denops.name}', 'onCommentBufferSave', [${bufnr}])`,
        );
        await denops.cmd(
          `autocmd BufUnload ${escapedPath} call denops#request('${denops.name}', 'cleanupCommentEdit', ['${tmpFile}'])`,
        );
        await denops.cmd(`augroup END`);

        await denops.cmd('echo "Write your reply, :w to post, :q to close"');
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        await denops.call(
          "nvim_err_writeln",
          `GitXab: Failed to open reply editor: ${message}`,
        );
      }
    },

    /**
     * Edit issue (title, description, labels, state)
     * @param projectId - GitLab project ID
     * @param issueIid - Issue IID
     */
    async editIssue(projectId: unknown, issueIid: unknown): Promise<void> {
      try {
        if (typeof projectId !== "number" || typeof issueIid !== "number") {
          throw new Error("Invalid project ID or issue IID");
        }

        // Fetch current issue data
        await denops.cmd('echo "Loading issue..."');
        const issue = await apiGetIssue(projectId, issueIid);

        // Show edit menu
        const choices = [
          `Edit Issue #${issueIid}: ${issue.title}`,
          "1. Edit Title",
          "2. Edit Description",
          "3. Edit Labels",
          "4. Close Issue",
          "5. Reopen Issue",
          "6. Cancel",
        ];

        const choice = await denops.call("inputlist", choices) as number;
        const params: UpdateIssueParams = {};

        if (choice === 1) {
          // Edit title with current value pre-filled
          const title = await denops.call(
            "input",
            "Title: ",
            issue.title,
          ) as string;
          if (title && title.trim() && title.trim() !== issue.title) {
            params.title = title.trim();
          } else {
            await denops.cmd('echo "No changes made"');
            return;
          }
        } else if (choice === 2) {
          // Edit description in a temporary file
          // Get temp directory - use fnamemodify with :p to get full path
          let tmpDir = await denops.call("expand", "$TMPDIR") as string;
          if (!tmpDir || tmpDir === "$TMPDIR") {
            tmpDir = await denops.call("expand", "$TEMP") as string;
          }
          if (!tmpDir || tmpDir === "$TEMP") {
            // Use Vim's tempname() to get a reliable temp directory
            const tempPath = await fn.tempname(denops) as string;
            tmpDir = await denops.call("fnamemodify", tempPath, ":h") as string;
          }
          const tmpFile = `${tmpDir}/.gitxab_${projectId}_${issueIid}_desc.md`;

          // Set initial content with instructions
          const instructions = [
            `" GitXab: Edit description for Issue #${issueIid}`,
            `" Project ID: ${projectId}, Issue IID: ${issueIid}`,
            `" Current title: ${issue.title}`,
            `"`,
            `" Instructions:`,
            `"   1. Edit the description below (markdown supported)`,
            `"   2. Save with :w (or :wq to save and close)`,
            `"   3. Changes will be applied automatically when you close the buffer`,
            `"   4. Close without saving (:q!) to cancel`,
            `"`,
            `" ========================================`,
            "",
          ];

          const contentLines = issue.description
            ? issue.description.split("\n")
            : [""];
          const allLines = [...instructions, ...contentLines];

          // Write to temporary file using vim's writefile
          await denops.call("writefile", allLines, tmpFile);

          // Open file in split window
          await denops.cmd(`split ${tmpFile}`);
          const bufnr = await fn.bufnr(denops, "%") as number;

          // Set buffer options
          await vars.b.set(denops, "filetype", "markdown");

          // Store project and issue info in buffer variables
          await vars.b.set(denops, "gitxab_project_id", projectId);
          await vars.b.set(denops, "gitxab_issue_iid", issueIid);
          await vars.b.set(denops, "gitxab_tmpfile", tmpFile);

          // Move cursor to first content line
          await denops.cmd(`normal! ${instructions.length + 1}G`);

          // Debug: Show buffer info
          await denops.cmd(
            `echo "[GitXab Debug] Setting up autocmds for buffer ${bufnr}, file: ${tmpFile}"`,
          );
          await denops.cmd(
            `echo "[GitXab Debug] Buffer vars: projectId=${projectId}, issueIid=${issueIid}"`,
          );

          // Set up autocmd - update immediately on save
          const escapedPath = tmpFile.replace(/\\/g, "\\\\").replace(
            / /g,
            "\\ ",
          );
          await denops.cmd(`augroup GitXabEditDesc`);
          await denops.cmd(`autocmd! * ${escapedPath}`);
          await denops.cmd(
            `autocmd BufWritePost ${escapedPath} echo "✓ Saved, updating GitLab..." | echo "[GitXab Debug] BufWritePost triggered, calling update" | call denops#request('${denops.name}', 'onDescriptionBufferClose', [${bufnr}])`,
          );
          await denops.cmd(
            `autocmd BufUnload ${escapedPath} echo "[GitXab Debug] BufUnload - cleaning up" | call denops#request('${denops.name}', 'cleanupDescriptionEdit', ['${tmpFile}'])`,
          );
          await denops.cmd(`augroup END`);

          // Verify autocmds were set
          await denops.cmd(
            `echo "[GitXab Debug] Autocmds set for file: ${escapedPath}"`,
          );
          await denops.cmd(
            `echo "[GitXab Debug] Use :au GitXabEditDesc to verify"`,
          );
          await denops.cmd(
            'echo "Edit description, save with :w to update GitLab"',
          );
          return; // Don't proceed with update yet
        } else if (choice === 3) {
          // Edit labels with current values pre-filled
          const currentLabels = Array.isArray(issue.labels)
            ? issue.labels.join(", ")
            : "";
          const labels = await denops.call(
            "input",
            "Labels (comma-separated): ",
            currentLabels,
          ) as string;
          if (labels !== null && labels.trim() !== currentLabels) {
            params.labels = labels.trim();
          } else {
            await denops.cmd('echo "No changes made"');
            return;
          }
        } else if (choice === 4) {
          if (issue.state !== "closed") {
            params.state_event = "close";
          } else {
            await denops.cmd('echo "Issue is already closed"');
            return;
          }
        } else if (choice === 5) {
          if (issue.state === "closed") {
            params.state_event = "reopen";
          } else {
            await denops.cmd('echo "Issue is already open"');
            return;
          }
        } else {
          return; // Cancel
        }

        if (Object.keys(params).length === 0) {
          return;
        }

        // Update issue
        await denops.cmd('echo "Updating issue..."');
        await apiUpdateIssue(projectId, issueIid, params);

        // Show success message
        await denops.cmd(
          'echohl MoreMsg | echo "✓ Issue updated" | echohl None',
        );

        // Refresh issue view
        await denops.dispatcher.viewIssue(projectId, issueIid);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        await denops.call(
          "nvim_err_writeln",
          `GitXab: Failed to edit issue: ${message}`,
        );
      }
    },

    /**
     * Handle description buffer close event
     * @param bufnr - Buffer number
     */
    async onDescriptionBufferClose(bufnr: unknown): Promise<void> {
      const debug = Deno.env.get("GITXAB_DEBUG") === "1";
      try {
        if (typeof bufnr !== "number") {
          if (debug) {
            await denops.cmd(
              'echo "[GitXab Debug] onDescriptionBufferClose: bufnr is not a number"',
            );
          }
          return;
        }

        if (debug) {
          await denops.cmd(
            `echo "[GitXab Debug] onDescriptionBufferClose: bufnr=${bufnr}"`,
          );
        }

        // Get temp file path and project/issue info
        const tmpFile = await fn.getbufvar(
          denops,
          bufnr,
          "gitxab_tmpfile",
        ) as string;
        const projectId = await fn.getbufvar(
          denops,
          bufnr,
          "gitxab_project_id",
        ) as number;
        const issueIid = await fn.getbufvar(
          denops,
          bufnr,
          "gitxab_issue_iid",
        ) as number;

        if (debug) {
          await denops.cmd(
            `echo "[GitXab Debug] tmpFile=${tmpFile}, projectId=${projectId}, issueIid=${issueIid}"`,
          );
        }

        if (!tmpFile || !projectId || !issueIid) {
          if (debug) {
            await denops.cmd(
              'echo "[GitXab Debug] Missing required variables, exiting"',
            );
          }
          return;
        }

        // Check if file exists and was modified (saved)
        const fileExists = await fn.filereadable(denops, tmpFile) as number;
        if (debug) {
          await denops.cmd(`echo "[GitXab Debug] fileExists=${fileExists}"`);
        }
        if (!fileExists) {
          // File doesn't exist, likely deleted - no action needed
          if (debug) {
            await denops.cmd(
              'echo "[GitXab Debug] File does not exist, exiting"',
            );
          }
          return;
        }

        // Note: We don't check modified flag anymore since we update on every save (BufWritePost)
        // Just proceed with the update

        // Read content from temp file
        const lines = await denops.call("readfile", tmpFile) as string[];
        if (debug) {
          await denops.cmd(
            `echo "[GitXab Debug] Read ${lines.length} lines from temp file"`,
          );
        }

        // Find where instructions end (look for the separator line)
        let contentStart = 0;
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].includes("========================================")) {
            contentStart = i + 2; // Skip separator and empty line
            break;
          }
        }

        if (debug) {
          await denops.cmd(
            `echo "[GitXab Debug] Content starts at line ${contentStart}"`,
          );
        }

        // Get description content (everything after instructions)
        const descriptionLines = lines.slice(contentStart);
        const description = descriptionLines.join("\n").trim();

        if (debug) {
          await denops.cmd(
            `echo "[GitXab Debug] Description length: ${description.length} chars"`,
          );
        }

        // Update issue
        await denops.cmd('echo "Updating issue..."');
        if (debug) {
          await denops.cmd(
            `echo "[GitXab Debug] Calling apiUpdateIssue(${projectId}, ${issueIid}, ...)"`,
          );
        }
        await apiUpdateIssue(projectId, issueIid, { description });

        // Show success message
        await denops.cmd(
          'echohl MoreMsg | echo "✓ Description updated in GitLab" | echohl None',
        );

        // Note: Cleanup (temp file deletion, autocmd removal) happens in BufUnload via cleanupDescriptionEdit

        // Refresh issue view if it's open
        if (debug) {
          await denops.cmd(`echo "[GitXab Debug] Refreshing issue view"`);
        }
        await denops.dispatcher.viewIssue(projectId, issueIid);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        await denops.call(
          "nvim_err_writeln",
          `GitXab: Failed to save description: ${message}`,
        );
      }
    },

    /**
     * Handle comment buffer save event (posts comment/reply)
     * @param bufnr - Buffer number
     */
    async onCommentBufferSave(bufnr: unknown): Promise<void> {
      try {
        if (typeof bufnr !== "number") return;

        // Get temp file path and context info
        const tmpFile = await fn.getbufvar(
          denops,
          bufnr,
          "gitxab_tmpfile",
        ) as string;
        const projectId = await fn.getbufvar(
          denops,
          bufnr,
          "gitxab_project_id",
        ) as number;
        const issueIid = await fn.getbufvar(
          denops,
          bufnr,
          "gitxab_issue_iid",
        ) as number;
        const action = await fn.getbufvar(
          denops,
          bufnr,
          "gitxab_action",
        ) as string;
        const discussionId = await fn.getbufvar(
          denops,
          bufnr,
          "gitxab_discussion_id",
        ) as string;
        const discussionNum = await fn.getbufvar(
          denops,
          bufnr,
          "gitxab_discussion_num",
        ) as number;

        if (!tmpFile || !projectId || !issueIid || !action) {
          return;
        }

        // Check if file exists
        const fileExists = await fn.filereadable(denops, tmpFile) as number;
        if (!fileExists) {
          return;
        }

        // Read content from temp file
        const lines = await denops.call("readfile", tmpFile) as string[];

        // Find where instructions end
        let contentStart = 0;
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].includes("========================================")) {
            contentStart = i + 2;
            break;
          }
        }

        // Get comment content
        const contentLines = lines.slice(contentStart);
        const content = contentLines.join("\n").trim();

        if (!content) {
          await denops.cmd(
            'echohl WarningMsg | echo "No content, not posting" | echohl None',
          );
          return;
        }

        // Post comment or reply based on action
        if (action === "comment") {
          await denops.cmd('echo "Posting comment..."');
          await apiCreateIssueNote(projectId, issueIid, content);
          await denops.cmd(
            'echohl MoreMsg | echo "✓ Comment posted" | echohl None',
          );
        } else if (action === "reply" && discussionId) {
          await denops.cmd('echo "Posting reply to discussion..."');
          await apiAddNoteToDiscussion(
            projectId,
            issueIid,
            discussionId,
            content,
          );
          await denops.cmd(
            `echohl MoreMsg | echo "✓ Reply to discussion ${discussionNum} posted" | echohl None`,
          );
        }

        // Refresh issue view
        await denops.dispatcher.viewIssue(projectId, issueIid);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        await denops.call(
          "nvim_err_writeln",
          `GitXab: Failed to post: ${message}`,
        );
      }
    },

    /**
     * Cleanup comment/reply temp file and autocmds when buffer is unloaded
     */
    async cleanupCommentEdit(tmpFile: unknown): Promise<void> {
      try {
        if (typeof tmpFile !== "string") return;

        // Clean up temp file
        const fileExists = await fn.filereadable(denops, tmpFile) as number;
        if (fileExists) {
          await denops.call("delete", tmpFile);
        }

        // Clean up autocmds for both comment and reply
        const escapedPath = tmpFile.replace(/\\/g, "\\\\").replace(/ /g, "\\ ");
        await denops.cmd(`augroup GitXabComment`);
        await denops.cmd(`autocmd! * ${escapedPath}`);
        await denops.cmd(`augroup END`);
        await denops.cmd(`augroup GitXabReply`);
        await denops.cmd(`autocmd! * ${escapedPath}`);
        await denops.cmd(`augroup END`);
      } catch (_error) {
        // Ignore cleanup errors
      }
    },

    /**
     * Cleanup temp file and autocmds when buffer is unloaded
     */
    async cleanupDescriptionEdit(tmpFile: unknown): Promise<void> {
      const debug = Deno.env.get("GITXAB_DEBUG") === "1";
      try {
        if (typeof tmpFile !== "string") return;

        if (debug) {
          await denops.cmd(`echo "[GitXab Debug] Cleaning up ${tmpFile}"`);
        }

        // Clean up temp file
        const fileExists = await fn.filereadable(denops, tmpFile) as number;
        if (fileExists) {
          await denops.call("delete", tmpFile);
          if (debug) {
            await denops.cmd(`echo "[GitXab Debug] Deleted temp file"`);
          }
        }

        // Clean up autocmds
        const escapedPath = tmpFile.replace(/\\/g, "\\\\").replace(/ /g, "\\ ");
        await denops.cmd(`augroup GitXabEditDesc`);
        await denops.cmd(`autocmd! * ${escapedPath}`);
        await denops.cmd(`augroup END`);
        if (debug) {
          await denops.cmd(`echo "[GitXab Debug] Cleaned up autocmds"`);
        }
      } catch (_error) {
        // Ignore cleanup errors
      }
    },

    /**
     * Save edited description from buffer (manual command)
     * @param projectId - Project ID
     * @param issueIid - Issue IID
     */
    async saveDescription(
      projectId: unknown,
      issueIid: unknown,
    ): Promise<void> {
      try {
        if (typeof projectId !== "number" || typeof issueIid !== "number") {
          throw new Error("Invalid project ID or issue IID");
        }

        // Get current buffer content
        const bufnr = await fn.bufnr(denops, "%") as number;
        const lines = await fn.getbufline(denops, bufnr, 1, "$") as string[];

        // Find where instructions end (look for the separator line)
        let contentStart = 0;
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].includes("========================================")) {
            contentStart = i + 2; // Skip separator and empty line
            break;
          }
        }

        // Get description content (everything after instructions)
        const descriptionLines = lines.slice(contentStart);
        const description = descriptionLines.join("\n").trim();

        // Update issue
        await denops.cmd('echo "Updating issue..."');
        await apiUpdateIssue(projectId, issueIid, { description });

        // Close edit buffer
        await denops.cmd("bwipeout!");

        // Show success message
        await denops.cmd(
          'echohl MoreMsg | echo "✓ Description updated" | echohl None',
        );

        // Refresh issue view if it's open
        await denops.dispatcher.viewIssue(projectId, issueIid);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        await denops.call(
          "nvim_err_writeln",
          `GitXab: Failed to save description: ${message}`,
        );
      }
    },

    /**
     * Show help for keyboard shortcuts
     * @param context - Context: 'projects', 'issues', 'issue-detail'
     */
    async showHelp(context: unknown): Promise<void> {
      const helpText: Record<string, string[]> = {
        projects: [
          "GitXab.vim - Project List Help",
          "=".repeat(60),
          "",
          "Keyboard Shortcuts:",
          "  <Enter>  - Open project menu",
          "  q        - Close buffer",
          "  ?        - Show this help",
          "",
          "Project Menu Options:",
          "  1. View Issues - Display issues for this project",
          "  2. Create New Issue - Create a new issue",
          "  3. View Merge Requests - Display merge requests",
          "  4. Create New Merge Request - Create a new MR",
        ],
        issues: [
          "GitXab.vim - Issue List Help",
          "=".repeat(60),
          "",
          "Keyboard Shortcuts:",
          "  <Enter>  - View issue details and comments",
          "  n        - Create new issue",
          "  r        - Refresh issue list",
          "  q        - Close buffer",
          "  ?        - Show this help",
          "",
          "Issue Format:",
          "  #IID Title [labels] @assignee date",
        ],
        "issue-detail": [
          "GitXab.vim - Issue Detail Help",
          "=".repeat(60),
          "",
          "Keyboard Shortcuts:",
          "  c  - Add comment to this issue",
          "  R  - Reply to a discussion thread (by number)",
          "  e  - Edit issue (title/description/labels/state)",
          "  r  - Refresh issue view",
          "  q  - Close buffer",
          "  ?  - Show this help",
          "",
          "Discussion Threads:",
          "  Discussion threads are numbered [1], [2], [3]...",
          "  Use 'R' to reply to a discussion thread",
          "  Replies are added to the existing thread",
          "",
          "Edit Menu Options:",
          "  1. Edit Title - Change issue title",
          "  2. Edit Description - Change issue description",
          "  3. Edit Labels - Modify labels (comma-separated)",
          "  4. Close Issue - Mark issue as closed",
          "  5. Reopen Issue - Reopen a closed issue",
        ],
        "mrs": [
          "GitXab.vim - Merge Request List Help",
          "=".repeat(60),
          "",
          "Keyboard Shortcuts:",
          "  <Enter>  - View merge request details and discussions",
          "  n        - Create new merge request",
          "  r        - Refresh merge request list",
          "  q        - Close buffer",
          "  ?        - Show this help",
          "",
          "MR Format:",
          "  🟢 !IID Title [labels] @assignee date",
          "     source_branch → target_branch",
          "",
          "Status Icons:",
          "  🟢 - Opened",
          "  🟣 - Merged",
          "  🔴 - Closed",
        ],
        "mr-detail": [
          "GitXab.vim - Merge Request Detail Help",
          "=".repeat(60),
          "",
          "Keyboard Shortcuts:",
          "  d  - View diffs (changed files)",
          "  c  - Add comment to this merge request",
          "  R  - Reply to a discussion thread (by number)",
          "  r  - Refresh merge request view",
          "  q  - Close buffer",
          "  ?  - Show this help",
          "",
          "Discussion Threads:",
          "  Discussion threads are numbered [1], [2], [3]...",
          "  Use 'R' to reply to a discussion thread",
          "  Replies are added to the existing thread",
        ],
        "mr-diffs": [
          "GitXab.vim - Merge Request Diffs Help",
          "=".repeat(60),
          "",
          "Keyboard Shortcuts:",
          "  q  - Close buffer",
          "  ?  - Show this help",
          "",
          "Diff Format:",
          "  [NEW]      - New file added",
          "  [DELETED]  - File removed",
          "  [RENAMED]  - File renamed",
          "  [MODIFIED] - File changed",
          "",
          "Diff Markers:",
          "  +  - Lines added",
          "  -  - Lines removed",
          "  @@ - Hunk header (line numbers)",
        ],
      };

      const ctx = typeof context === "string" ? context : "projects";
      const lines = helpText[ctx] || helpText.projects;

      // Display help using echo commands
      await denops.cmd('echo ""');
      for (const line of lines) {
        const escapedLine = line.replace(/'/g, "''");
        await denops.cmd(`echo '${escapedLine}'`);
      }
      await denops.cmd('echo ""');
    },

    /**
     * Set provider type (github or gitlab)
     * @param providerType - "github" or "gitlab"
     */
    async setProvider(providerType: unknown): Promise<void> {
      try {
        if (typeof providerType !== "string") {
          await denops.cmd(
            'echohl ErrorMsg | echo "Usage: :GitXabSetProvider github|gitlab" | echohl None',
          );
          return;
        }

        const provider = providerType.toLowerCase();
        if (provider !== "github" && provider !== "gitlab") {
          await denops.cmd(
            'echohl ErrorMsg | echo "Invalid provider. Use: github or gitlab" | echohl None',
          );
          return;
        }

        // Set the provider preference
        await vars.g.set(denops, "gitxab_provider", provider);

        // Reset provider instance to force re-initialization
        providerInstance = null;

        await denops.cmd(
          `echomsg 'GitXab: Provider set to ${provider}. Re-run commands to use new provider.'`,
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        await denops.cmd(
          `echohl ErrorMsg | echo "Failed to set provider: ${message}" | echohl None`,
        );
      }
    },

    /**
     * Show current provider
     */
    async showProvider(): Promise<void> {
      try {
        const provider = await getProvider(denops);
        const providerType = provider.name;
        const baseUrl = provider.baseUrl;
        await denops.cmd(
          `echomsg 'GitXab: Current provider is ${providerType} (${baseUrl})'`,
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        await denops.cmd(
          `echohl ErrorMsg | echo "Failed to get provider: ${message}" | echohl None`,
        );
      }
    },

    /**
     * List merge requests
     * @param projectId - GitLab project ID
     */
    async listMergeRequests(projectId: unknown): Promise<unknown> {
      try {
        if (typeof projectId !== "number" && typeof projectId !== "string") {
          throw new Error("Project ID is required");
        }

        const pid = typeof projectId === "string"
          ? parseInt(projectId, 10)
          : projectId;
        if (isNaN(pid)) {
          throw new Error("Invalid project ID");
        }

        const mrs = await apiListMergeRequests(pid);

        if (!Array.isArray(mrs)) {
          throw new Error("API returned unexpected format for merge requests");
        }

        if (mrs.length === 0) {
          await denops.cmd(
            'echohl WarningMsg | echo "No merge requests found" | echohl None',
          );
          return [];
        }

        // Find or create buffer for displaying MRs
        const { bufnr, isNew: _isNew } = await findOrCreateBuffer(
          denops,
          "gitxab-mrs",
          `GitXab://project/${pid}/merge-requests`,
        );

        // Store MR data for this buffer
        mrDataMap.set(bufnr, mrs);

        // Format MRs for display
        const lines: string[] = [
          `GitLab Merge Requests - Project #${pid}`,
          "=".repeat(80),
          "",
          `Total: ${mrs.length} merge requests`,
          "",
        ];

        for (const mr of mrs) {
          const stateIcon = mr.state === "opened"
            ? "🟢"
            : mr.state === "merged"
            ? "🟣"
            : "🔴";
          const labels = mr.labels && mr.labels.length > 0
            ? ` [${mr.labels.join(", ")}]`
            : "";
          const assignees = mr.assignees && mr.assignees.length > 0
            ? ` @${
              mr.assignees.map((a: { username: string }) => a.username).join(
                ", @",
              )
            }`
            : "";
          const date = new Date(mr.created_at).toLocaleDateString();

          lines.push(
            `${stateIcon} !${mr.iid} ${mr.title}${labels}${assignees} ${date}`,
            `    ${mr.source_branch} → ${mr.target_branch}`,
            "",
          );
        }

        lines.push(
          "",
          "Keys: <Enter>=View  n=Create MR  r=Refresh  q=Close  ?=Help",
        );

        // Set buffer content
        await buffer.replace(denops, bufnr, lines);

        // Set buffer options
        await fn.setbufvar(denops, bufnr, "&filetype", "gitxab-mrs");
        await fn.setbufvar(denops, bufnr, "&buftype", "nofile");
        await fn.setbufvar(denops, bufnr, "&modifiable", 0);
        await fn.setbufvar(denops, bufnr, "gitxab_project_id", pid);

        // Switch to buffer
        await denops.cmd(`buffer ${bufnr}`);

        // Set up key mappings
        await mapping.map(
          denops,
          "<CR>",
          `<Cmd>call denops#request('${denops.name}', 'openMRFromList', [${bufnr}])<CR>`,
          { buffer: true, silent: true, noremap: true },
        );
        await mapping.map(
          denops,
          "n",
          `<Cmd>call denops#request('${denops.name}', 'createMergeRequest', [${pid}])<CR>`,
          { buffer: true, silent: true, noremap: true },
        );
        await mapping.map(
          denops,
          "r",
          `<Cmd>call denops#request('${denops.name}', 'listMergeRequests', [${pid}])<CR>`,
          { buffer: true, silent: true, noremap: true },
        );
        await mapping.map(
          denops,
          "q",
          "<Cmd>bwipeout!<CR>",
          { buffer: true, silent: true, noremap: true },
        );
        await mapping.map(
          denops,
          "?",
          `<Cmd>call denops#request('${denops.name}', 'showHelp', ['mrs'])<CR>`,
          { buffer: true, silent: true, noremap: true },
        );

        return mrs;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        await denops.call(
          "nvim_err_writeln",
          `GitXab: Failed to list merge requests: ${message}`,
        );
        return null;
      }
    },

    /**
     * Open MR detail from MR list buffer
     * @param bufnr - Buffer number of MR list
     */
    async openMRFromList(bufnr: unknown): Promise<void> {
      try {
        if (typeof bufnr !== "number") {
          throw new Error("Invalid buffer number");
        }

        // Get current line text to extract MR IID
        const line = await fn.line(denops, ".") as number;
        const lineText = await fn.getline(denops, line) as string;

        // Get MR data for this buffer
        const mrs = mrDataMap.get(bufnr);
        if (!mrs) {
          await denops.call("nvim_err_writeln", "GitXab: No MR data found");
          return;
        }

        // Parse MR IID from line (format: "🟢 !123 Title..." or any emoji + !number)
        // More flexible pattern to handle Unicode properly
        const match = lineText.match(/!\s*(\d+)\s+/);
        if (!match) {
          // Not on a valid MR line (empty line, header, etc.)
          return;
        }

        const mrIid = parseInt(match[1], 10);
        const mr = mrs.find((m) => m.iid === mrIid);

        if (!mr) {
          await denops.call(
            "nvim_err_writeln",
            `GitXab: MR !${mrIid} not found in list`,
          );
          return;
        }

        // View MR detail
        await denops.dispatcher.viewMergeRequest(mr.project_id, mrIid);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        await denops.call(
          "nvim_err_writeln",
          `GitXab: Failed to open MR: ${message}`,
        );
      }
    },

    /**
     * View merge request detail with discussions
     * @param projectId - GitLab project ID
     * @param mrIid - Merge Request IID
     */
    async viewMergeRequest(projectId: unknown, mrIid: unknown): Promise<void> {
      try {
        if (typeof projectId !== "number" || typeof mrIid !== "number") {
          throw new Error("Invalid project ID or MR IID");
        }

        // Fetch MR detail and discussions
        const [mr, discussions] = await Promise.all([
          apiGetMergeRequest(projectId, mrIid),
          apiGetMRDiscussions(projectId, mrIid),
        ]);

        if (!mr) {
          throw new Error("Merge request not found");
        }

        // Find or create buffer for displaying MR detail
        const { bufnr } = await findOrCreateBuffer(
          denops,
          "gitxab-mr-detail",
          `GitXab://project/${projectId}/mr/${mrIid}`,
        );

        // Format MR detail for display
        const lines: string[] = [
          `!${mr.iid}: ${mr.title}`,
          "=".repeat(80),
          "",
          `State: ${mr.state}`,
          `Author: ${mr.author.name} (@${mr.author.username})`,
          `Created: ${new Date(mr.created_at).toLocaleString()}`,
          `Source: ${mr.source_branch} → Target: ${mr.target_branch}`,
        ];

        if (mr.assignees && mr.assignees.length > 0) {
          lines.push(
            `Assignees: ${
              mr.assignees.map((a: { username: string }) => `@${a.username}`)
                .join(", ")
            }`,
          );
        }

        if (mr.labels && mr.labels.length > 0) {
          lines.push(`Labels: ${mr.labels.join(", ")}`);
        }

        lines.push("", "Description:", "-".repeat(80));

        if (mr.description) {
          lines.push(...mr.description.split("\n"));
        } else {
          lines.push("(No description)");
        }

        lines.push("", "=".repeat(80), "");

        // Add discussions
        if (Array.isArray(discussions) && discussions.length > 0) {
          lines.push(`Discussions (${discussions.length}):`, "");

          let discussionNum = 1;
          for (const discussion of discussions) {
            if (!discussion.notes || discussion.notes.length === 0) continue;

            lines.push(`[${discussionNum}] Discussion:`);

            for (let i = 0; i < discussion.notes.length; i++) {
              const note = discussion.notes[i];
              if (note.system) continue;

              const prefix = i === 0 ? "  " : "    ↳ ";
              const date = new Date(note.created_at).toLocaleString();
              lines.push(
                `${prefix}@${note.author.username} (${date}):`,
                ...note.body.split("\n").map((l: string) => `${prefix}${l}`),
                "",
              );
            }

            discussionNum++;
          }
        } else {
          lines.push("No discussions yet", "");
        }

        lines.push(
          "",
          "=".repeat(80),
          "Keys: d=Diffs  c=Comment  R=Reply  r=Refresh  q=Close  ?=Help",
        );

        // Set buffer content
        await buffer.replace(denops, bufnr, lines);

        // Store discussions data in buffer variable for reply feature
        await vars.b.set(denops, "gitxab_mr_discussions", discussions);

        // Set buffer options
        await fn.setbufvar(denops, bufnr, "&filetype", "gitxab-mr-detail");
        await fn.setbufvar(denops, bufnr, "&buftype", "nofile");
        await fn.setbufvar(denops, bufnr, "&modifiable", 0);

        // Switch to buffer
        await denops.cmd(`buffer ${bufnr}`);

        // Set up key mappings
        await mapping.map(
          denops,
          "d",
          `<Cmd>call denops#request('${denops.name}', 'viewMRDiffs', [${projectId}, ${mrIid}])<CR>`,
          { buffer: true, silent: true, noremap: true },
        );
        await mapping.map(
          denops,
          "c",
          `<Cmd>call denops#request('${denops.name}', 'commentOnMR', [${projectId}, ${mrIid}])<CR>`,
          { buffer: true, silent: true, noremap: true },
        );
        await mapping.map(
          denops,
          "R",
          `<Cmd>call denops#request('${denops.name}', 'replyToMRComment', [${projectId}, ${mrIid}])<CR>`,
          { buffer: true, silent: true, noremap: true },
        );
        await mapping.map(
          denops,
          "r",
          `<Cmd>call denops#request('${denops.name}', 'viewMergeRequest', [${projectId}, ${mrIid}])<CR>`,
          { buffer: true, silent: true, noremap: true },
        );
        await mapping.map(
          denops,
          "q",
          "<Cmd>bwipeout!<CR>",
          { buffer: true, silent: true, noremap: true },
        );
        await mapping.map(
          denops,
          "?",
          `<Cmd>call denops#request('${denops.name}', 'showHelp', ['mr-detail'])<CR>`,
          { buffer: true, silent: true, noremap: true },
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        await denops.call(
          "nvim_err_writeln",
          `GitXab: Failed to view merge request: ${message}`,
        );
      }
    },

    /**
     * Add comment to merge request
     * @param projectId - GitLab project ID
     * @param mrIid - MR IID
     */
    async commentOnMR(projectId: unknown, mrIid: unknown): Promise<void> {
      try {
        if (typeof projectId !== "number" || typeof mrIid !== "number") {
          throw new Error("Invalid project ID or MR IID");
        }

        // Create temporary file for comment editing
        let tmpDir = await denops.call("expand", "$TMPDIR") as string;
        if (!tmpDir || tmpDir === "$TMPDIR") {
          tmpDir = await denops.call("expand", "$TEMP") as string;
        }
        if (!tmpDir || tmpDir === "$TEMP") {
          const tempPath = await fn.tempname(denops) as string;
          tmpDir = await denops.call("fnamemodify", tempPath, ":h") as string;
        }
        const tmpFile = `${tmpDir}/.gitxab_${projectId}_mr${mrIid}_comment.md`;

        // Set initial content with instructions
        const instructions = [
          `" GitXab: Add comment to Merge Request !${mrIid}`,
          `" Project ID: ${projectId}, MR IID: ${mrIid}`,
          `"`,
          `" Instructions:`,
          `"   1. Write your comment below (markdown supported)`,
          `"   2. Save with :w (or :wq to save and close)`,
          `"   3. Comment will be posted when you close the buffer`,
          `"   4. Close without saving (:q!) to cancel`,
          `"`,
          `" ========================================`,
          "",
        ];

        // Write to temporary file
        await denops.call("writefile", instructions, tmpFile);

        // Open file in split window
        await denops.cmd(`split ${tmpFile}`);
        const bufnr = await fn.bufnr(denops, "%") as number;

        // Set buffer options
        await vars.b.set(denops, "filetype", "markdown");
        await vars.b.set(denops, "gitxab_project_id", projectId);
        await vars.b.set(denops, "gitxab_mr_iid", mrIid);
        await vars.b.set(denops, "gitxab_tmpfile", tmpFile);
        await vars.b.set(denops, "gitxab_action", "mr_comment");

        // Move cursor to first content line
        await denops.cmd(`normal! ${instructions.length + 1}G`);

        // Set up autocmds
        const escapedPath = tmpFile.replace(/\\/g, "\\\\").replace(/ /g, "\\ ");
        await denops.cmd(`augroup GitXabMRComment`);
        await denops.cmd(`autocmd! * ${escapedPath}`);
        await denops.cmd(
          `autocmd BufWritePost ${escapedPath} call denops#request('${denops.name}', 'onMRCommentBufferSave', [${bufnr}])`,
        );
        await denops.cmd(
          `autocmd BufUnload ${escapedPath} call denops#request('${denops.name}', 'cleanupCommentEdit', ['${tmpFile}'])`,
        );
        await denops.cmd(`augroup END`);

        await denops.cmd('echo "Write your comment, :w to post, :q to close"');
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        await denops.call(
          "nvim_err_writeln",
          `GitXab: Failed to open comment editor: ${message}`,
        );
      }
    },

    /**
     * Reply to MR discussion thread
     * @param projectId - GitLab project ID
     * @param mrIid - MR IID
     */
    async replyToMRComment(projectId: unknown, mrIid: unknown): Promise<void> {
      try {
        if (typeof projectId !== "number" || typeof mrIid !== "number") {
          throw new Error("Invalid project ID or MR IID");
        }

        // Get stored discussions from buffer
        const discussions = await fn.getbufvar(
          denops,
          "%",
          "gitxab_mr_discussions",
        ) as Discussion[] | string;
        if (
          !discussions || typeof discussions === "string" ||
          discussions.length === 0
        ) {
          await denops.cmd(
            'echohl WarningMsg | echo "No discussions found" | echohl None',
          );
          return;
        }

        // Prompt for discussion number
        const discussionNumStr = await denops.call(
          "input",
          `Reply to discussion [1-${discussions.length}]: `,
        ) as string;
        if (!discussionNumStr || discussionNumStr.trim() === "") {
          await denops.cmd(
            'echohl WarningMsg | echo "Reply cancelled" | echohl None',
          );
          return;
        }

        const discussionNum = parseInt(discussionNumStr.trim(), 10);
        if (
          isNaN(discussionNum) || discussionNum < 1 ||
          discussionNum > discussions.length
        ) {
          await denops.cmd(
            'echohl ErrorMsg | echo "Invalid discussion number" | echohl None',
          );
          return;
        }

        const targetDiscussion = discussions[discussionNum - 1];
        const firstNote = targetDiscussion.notes[0];

        // Create temporary file for reply editing
        let tmpDir = await denops.call("expand", "$TMPDIR") as string;
        if (!tmpDir || tmpDir === "$TMPDIR") {
          tmpDir = await denops.call("expand", "$TEMP") as string;
        }
        if (!tmpDir || tmpDir === "$TEMP") {
          const tempPath = await fn.tempname(denops) as string;
          tmpDir = await denops.call("fnamemodify", tempPath, ":h") as string;
        }
        const tmpFile =
          `${tmpDir}/.gitxab_${projectId}_mr${mrIid}_reply_${discussionNum}.md`;

        // Set initial content with instructions and context
        const instructions = [
          `" GitXab: Reply to Discussion #${discussionNum} on MR !${mrIid}`,
          `" Project ID: ${projectId}, MR IID: ${mrIid}`,
          `" Replying to: @${firstNote.author.username}`,
          `"`,
          `" Original discussion:`,
        ];

        // Add quoted context from the discussion
        for (const note of targetDiscussion.notes) {
          instructions.push(
            `" > @${note.author.username}: ${note.body.split("\n")[0]}`,
          );
        }

        instructions.push(
          `"`,
          `" Instructions:`,
          `"   1. Write your reply below (markdown supported)`,
          `"   2. Save with :w (or :wq to save and close)`,
          `"   3. Reply will be posted when you close the buffer`,
          `"   4. Close without saving (:q!) to cancel`,
          `"`,
          `" ========================================`,
          "",
        );

        // Write to temporary file
        await denops.call("writefile", instructions, tmpFile);

        // Open file in split window
        await denops.cmd(`split ${tmpFile}`);
        const bufnr = await fn.bufnr(denops, "%") as number;

        // Set buffer options and store context
        await vars.b.set(denops, "filetype", "markdown");
        await vars.b.set(denops, "gitxab_project_id", projectId);
        await vars.b.set(denops, "gitxab_mr_iid", mrIid);
        await vars.b.set(denops, "gitxab_tmpfile", tmpFile);
        await vars.b.set(denops, "gitxab_action", "mr_reply");
        await vars.b.set(denops, "gitxab_discussion_id", targetDiscussion.id);
        await vars.b.set(denops, "gitxab_discussion_num", discussionNum);

        // Move cursor to first content line
        await denops.cmd(`normal! ${instructions.length + 1}G`);

        // Set up autocmds
        const escapedPath = tmpFile.replace(/\\/g, "\\\\").replace(/ /g, "\\ ");
        await denops.cmd(`augroup GitXabMRReply`);
        await denops.cmd(`autocmd! * ${escapedPath}`);
        await denops.cmd(
          `autocmd BufWritePost ${escapedPath} call denops#request('${denops.name}', 'onMRCommentBufferSave', [${bufnr}])`,
        );
        await denops.cmd(
          `autocmd BufUnload ${escapedPath} call denops#request('${denops.name}', 'cleanupCommentEdit', ['${tmpFile}'])`,
        );
        await denops.cmd(`augroup END`);

        await denops.cmd('echo "Write your reply, :w to post, :q to close"');
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        await denops.call(
          "nvim_err_writeln",
          `GitXab: Failed to open reply editor: ${message}`,
        );
      }
    },

    /**
     * Handle MR comment/reply buffer save event
     */
    async onMRCommentBufferSave(bufnr: unknown): Promise<void> {
      try {
        if (typeof bufnr !== "number") return;

        const projectId = await vars.b.get(
          denops,
          "gitxab_project_id",
        ) as number;
        const mrIid = await vars.b.get(denops, "gitxab_mr_iid") as number;
        const action = await vars.b.get(denops, "gitxab_action") as string;
        const discussionId = await vars.b.get(denops, "gitxab_discussion_id") as
          | string
          | undefined;

        // Get buffer content
        const lines = await fn.getbufline(denops, bufnr, 1, "$") as string[];

        // Find where instructions end
        let contentStart = 0;
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].includes("========================================")) {
            contentStart = i + 2;
            break;
          }
        }

        // Get comment/reply text
        const contentLines = lines.slice(contentStart);
        const body = contentLines.join("\n").trim();

        if (!body) {
          await denops.cmd(
            'echohl WarningMsg | echo "Comment is empty, not posted" | echohl None',
          );
          return;
        }

        // Post comment or reply based on action
        if (action === "mr_comment") {
          await denops.cmd('echo "Posting comment to MR..."');
          await apiCreateMRNote(projectId, mrIid, body);
          await denops.cmd(
            `echohl MoreMsg | echo "✓ Comment posted to MR !${mrIid}" | echohl None`,
          );
        } else if (action === "mr_reply" && discussionId) {
          await denops.cmd('echo "Posting reply to discussion..."');
          const discussionNum = await vars.b.get(
            denops,
            "gitxab_discussion_num",
          ) as number;
          await apiAddNoteToMRDiscussion(projectId, mrIid, discussionId, body);
          await denops.cmd(
            `echohl MoreMsg | echo "✓ Reply to discussion ${discussionNum} posted" | echohl None`,
          );
        }

        // Refresh MR view
        await denops.dispatcher.viewMergeRequest(projectId, mrIid);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        await denops.call(
          "nvim_err_writeln",
          `GitXab: Failed to post: ${message}`,
        );
      }
    },

    /**
     * View merge request diffs
     * @param projectId - GitLab project ID
     * @param mrIid - MR IID
     */
    async viewMRDiffs(projectId: unknown, mrIid: unknown): Promise<void> {
      try {
        if (typeof projectId !== "number" || typeof mrIid !== "number") {
          throw new Error("Invalid project ID or MR IID");
        }

        // Fetch MR changes (includes diff information)
        await denops.cmd('echo "Fetching diffs..."');
        // deno-lint-ignore no-explicit-any
        const mrChanges = await apiGetMRChanges(projectId, mrIid) as any;

        if (!mrChanges || !mrChanges.changes) {
          throw new Error("No diff data available");
        }

        // Find or create buffer for displaying diffs
        const { bufnr } = await findOrCreateBuffer(
          denops,
          "gitxab-mr-diffs",
          `GitXab://project/${projectId}/mr/${mrIid}/diffs`,
        );

        // Format diff for display
        const lines: string[] = [
          `Merge Request !${mrIid}: ${mrChanges.title || "Diffs"}`,
          "=".repeat(80),
          "",
          `Source: ${mrChanges.source_branch} → Target: ${mrChanges.target_branch}`,
          `Files changed: ${mrChanges.changes.length}`,
          "",
          "=".repeat(80),
          "",
        ];

        // Process each file change
        for (const change of mrChanges.changes) {
          const isNewFile = change.new_file;
          const isDeletedFile = change.deleted_file;
          const isRenamedFile = change.renamed_file;

          // File header
          if (isNewFile) {
            lines.push(`[NEW] ${change.new_path}`);
          } else if (isDeletedFile) {
            lines.push(`[DELETED] ${change.old_path}`);
          } else if (isRenamedFile) {
            lines.push(`[RENAMED] ${change.old_path} → ${change.new_path}`);
          } else {
            lines.push(`[MODIFIED] ${change.new_path}`);
          }

          lines.push("-".repeat(80));

          // Show diff content
          if (change.diff) {
            // Parse and format diff lines
            const diffLines = change.diff.split("\n");
            for (const line of diffLines) {
              if (line.startsWith("+++") || line.startsWith("---")) {
                // File markers
                lines.push(line);
              } else if (line.startsWith("@@")) {
                // Hunk header
                lines.push("");
                lines.push(line);
              } else if (line.startsWith("+")) {
                // Addition
                lines.push(line);
              } else if (line.startsWith("-")) {
                // Deletion
                lines.push(line);
              } else {
                // Context
                lines.push(line);
              }
            }
          } else {
            lines.push("(Binary file or no diff available)");
          }

          lines.push("");
          lines.push("");
        }

        lines.push(
          "=".repeat(80),
          "Keys: q=Close  ?=Help",
        );

        // Set buffer content
        await buffer.replace(denops, bufnr, lines);

        // Set buffer options
        await fn.setbufvar(denops, bufnr, "&filetype", "diff");
        await fn.setbufvar(denops, bufnr, "&buftype", "nofile");
        await fn.setbufvar(denops, bufnr, "&modifiable", 0);
        await fn.setbufvar(denops, bufnr, "&syntax", "diff");

        // Switch to buffer
        await denops.cmd(`buffer ${bufnr}`);

        // Set up key mappings
        await mapping.map(
          denops,
          "q",
          "<Cmd>bwipeout!<CR>",
          { buffer: true, silent: true, noremap: true },
        );
        await mapping.map(
          denops,
          "?",
          `<Cmd>call denops#request('${denops.name}', 'showHelp', ['mr-diffs'])<CR>`,
          { buffer: true, silent: true, noremap: true },
        );

        await denops.cmd('echo "Diffs loaded"');
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        await denops.call(
          "nvim_err_writeln",
          `GitXab: Failed to view diffs: ${message}`,
        );
      }
    },

    /**
     * Create new merge request
     * @param projectId - GitLab project ID
     */
    async createMergeRequest(projectId: unknown): Promise<void> {
      try {
        if (typeof projectId !== "number" && typeof projectId !== "string") {
          throw new Error("Project ID is required");
        }

        const pid = typeof projectId === "string"
          ? parseInt(projectId, 10)
          : projectId;
        if (isNaN(pid)) {
          throw new Error("Invalid project ID");
        }

        // Create temporary file for MR creation form
        let tmpDir = await denops.call("expand", "$TMPDIR") as string;
        if (!tmpDir || tmpDir === "$TMPDIR") {
          tmpDir = await denops.call("expand", "$TEMP") as string;
        }
        if (!tmpDir || tmpDir === "$TEMP") {
          const tempPath = await fn.tempname(denops) as string;
          tmpDir = await denops.call("fnamemodify", tempPath, ":h") as string;
        }
        const tmpFile = `${tmpDir}/.gitxab_${pid}_create_mr.md`;

        // Fetch branches from GitLab
        await denops.cmd('echo "Fetching branches..."');
        let branches: Array<{ name: string; default?: boolean }> = [];
        let defaultBranch = "main";

        try {
          const branchData = await apiListBranches(pid);
          if (Array.isArray(branchData)) {
            branches = branchData;
            // Find default branch
            const defBranch = branches.find((b: { default?: boolean }) =>
              b.default
            );
            if (defBranch) {
              defaultBranch = defBranch.name;
            }
          }
        } catch (error) {
          // If branch fetching fails, continue with empty list
          console.error("Failed to fetch branches:", error);
        }

        // Set initial content with form template
        const instructions = [
          `" GitXab: Create Merge Request for Project #${pid}`,
          `"`,
          `" Instructions:`,
          `"   1. Fill in the required fields below`,
          `"   2. Save with :w (or :wq to save and close)`,
          `"   3. MR will be created when you close the buffer`,
          `"   4. Close without saving (:q!) to cancel`,
          `"`,
          `" Fields marked with * are required`,
          `"`,
        ];

        // Add branch list if available
        if (branches.length > 0) {
          instructions.push(`" Available branches (${branches.length} total):`);
          const branchList = branches.slice(0, 20).map((
            b: { name: string; default?: boolean },
          ) => `"   - ${b.name}${b.default ? " (default)" : ""}`);
          instructions.push(...branchList);
          if (branches.length > 20) {
            instructions.push(`"   ... and ${branches.length - 20} more`);
          }
        }

        instructions.push(
          `"`,
          `" ========================================`,
          "",
          "# Merge Request Form",
          "",
          "## * Source Branch (your branch to merge FROM)",
          "source_branch: ",
          "",
          `## * Target Branch (branch to merge INTO, usually '${defaultBranch}')`,
          `target_branch: ${defaultBranch}`,
          "",
          "## * Title",
          "title: ",
          "",
          "## Description (optional, markdown supported)",
          "description: |",
          "  ",
          "",
          "## Labels (optional, comma-separated)",
          "labels: ",
          "",
          "## Remove Source Branch After Merge (optional, true/false)",
          "remove_source_branch: true",
          "",
        );

        // Write to temporary file
        await denops.call("writefile", instructions, tmpFile);

        // Open file in split window
        await denops.cmd(`split ${tmpFile}`);
        const bufnr = await fn.bufnr(denops, "%") as number;

        // Set buffer options
        await vars.b.set(denops, "filetype", "markdown");
        await vars.b.set(denops, "gitxab_project_id", pid);
        await vars.b.set(denops, "gitxab_tmpfile", tmpFile);
        await vars.b.set(denops, "gitxab_action", "create_mr");

        // Move cursor to first editable field (source_branch)
        await denops.cmd(`normal! 16G$`);

        // Set up autocmds
        const escapedPath = tmpFile.replace(/\\/g, "\\\\").replace(/ /g, "\\ ");
        await denops.cmd(`augroup GitXabCreateMR`);
        await denops.cmd(`autocmd! * ${escapedPath}`);
        await denops.cmd(
          `autocmd BufWritePost ${escapedPath} call denops#request('${denops.name}', 'onCreateMRBufferSave', [${bufnr}])`,
        );
        await denops.cmd(
          `autocmd BufUnload ${escapedPath} call denops#request('${denops.name}', 'cleanupCommentEdit', ['${tmpFile}'])`,
        );
        await denops.cmd(`augroup END`);

        await denops.cmd(
          'echo "Fill in the MR form, :w to create, :q to cancel"',
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        await denops.call(
          "nvim_err_writeln",
          `GitXab: Failed to open MR creation form: ${message}`,
        );
      }
    },

    /**
     * Handle MR creation buffer save event
     */
    async onCreateMRBufferSave(bufnrParam: unknown): Promise<void> {
      try {
        if (typeof bufnrParam !== "number") return;
        const bufnr = bufnrParam;

        const projectId = await vars.b.get(
          denops,
          "gitxab_project_id",
        ) as number;

        // Get buffer content
        const lines = await fn.getbufline(denops, bufnr, 1, "$") as string[];

        // Parse form fields
        const formData: Record<string, string> = {};
        let inDescription = false;
        let descriptionLines: string[] = [];

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];

          // Skip comment lines and empty lines
          if (
            line.startsWith('"') || line.startsWith("#") || line.trim() === ""
          ) {
            continue;
          }

          // Handle multi-line description
          if (inDescription) {
            if (line.match(/^[a-z_]+:/)) {
              // New field found, end description
              inDescription = false;
              formData.description = descriptionLines.join("\n").trim();
              descriptionLines = [];
            } else {
              descriptionLines.push(line.replace(/^\s{2}/, "")); // Remove 2-space indent
              continue;
            }
          }

          // Parse field: value format
          const match = line.match(/^([a-z_]+):\s*(.*)$/);
          if (match) {
            const [, key, value] = match;
            if (key === "description" && value === "|") {
              inDescription = true;
            } else {
              formData[key] = value.trim();
            }
          }
        }

        // Handle description if we were still in it
        if (inDescription && descriptionLines.length > 0) {
          formData.description = descriptionLines.join("\n").trim();
        }

        // Validate required fields
        if (!formData.source_branch || formData.source_branch === "") {
          await denops.cmd(
            'echohl ErrorMsg | echo "Error: source_branch is required" | echohl None',
          );
          return;
        }

        if (!formData.target_branch || formData.target_branch === "") {
          await denops.cmd(
            'echohl ErrorMsg | echo "Error: target_branch is required" | echohl None',
          );
          return;
        }

        if (!formData.title || formData.title === "") {
          await denops.cmd(
            'echohl ErrorMsg | echo "Error: title is required" | echohl None',
          );
          return;
        }

        // Build MR params
        const params: {
          source_branch: string;
          target_branch: string;
          title: string;
          description?: string;
          labels?: string;
          remove_source_branch?: boolean;
        } = {
          source_branch: formData.source_branch,
          target_branch: formData.target_branch,
          title: formData.title,
        };

        if (formData.description) {
          params.description = formData.description;
        }

        if (formData.labels) {
          params.labels = formData.labels;
        }

        if (formData.remove_source_branch === "true") {
          params.remove_source_branch = true;
        } else if (formData.remove_source_branch === "false") {
          params.remove_source_branch = false;
        }

        // Create the merge request
        await denops.cmd('echo "Creating merge request..."');
        const mr = await apiCreateMergeRequest(projectId, params);

        // Close the form buffer
        await denops.cmd("bwipeout!");

        // Show success message
        await denops.cmd(
          `echohl MoreMsg | echo "✓ Merge Request !${mr.iid} created successfully" | echohl None`,
        );

        // Refresh MR list if we're in an MR buffer
        const prevBufnr = await fn.bufnr(denops, "#");
        const filetype = await fn.getbufvar(
          denops,
          prevBufnr,
          "&filetype",
        ) as string;
        if (filetype === "gitxab-mrs") {
          await denops.dispatcher.listMergeRequests(projectId);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        await denops.call(
          "nvim_err_writeln",
          `GitXab: Failed to create MR: ${message}`,
        );
      }
    },
  };

  // Register commands directly in denops
  await denops.cmd(
    `command! -nargs=? GitXabProjects call denops#request('${denops.name}', 'listProjects', [<q-args>])`,
  );

  await denops.cmd(
    `command! -nargs=+ GitXabIssues call denops#request('${denops.name}', 'listIssues', [<f-args>])`,
  );

  await denops.cmd(
    `command! -nargs=1 GitXabCreateIssue call denops#request('${denops.name}', 'createIssue', [<f-args>])`,
  );

  await denops.cmd(
    `command! -nargs=1 GitXabMRs call denops#request('${denops.name}', 'listMergeRequests', [<f-args>])`,
  );

  await denops.cmd(
    `command! -nargs=1 GitXabCreateMR call denops#request('${denops.name}', 'createMergeRequest', [<f-args>])`,
  );

  await denops.cmd(
    `command! -nargs=+ GitXabSaveDescription call denops#request('${denops.name}', 'saveDescription', [<f-args>])`,
  );

  await denops.cmd(
    `command! -nargs=1 GitXabSetProvider call denops#request('${denops.name}', 'setProvider', [<q-args>])`,
  );

  await denops.cmd(
    `command! GitXabShowProvider call denops#request('${denops.name}', 'showProvider', [])`,
  );

  console.log("GitXab plugin initialized with commands");
}
