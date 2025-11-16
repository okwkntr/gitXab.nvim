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
import { 
  listProjects, 
  listIssues as apiListIssues,
  getIssue as apiGetIssue,
  createIssue as apiCreateIssue,
  updateIssue as apiUpdateIssue,
  getIssueNotes as apiGetIssueNotes,
  createIssueNote as apiCreateIssueNote,
  getIssueDiscussions as apiGetIssueDiscussions,
  addNoteToDiscussion as apiAddNoteToDiscussion,
  type Project, 
  type Issue,
  type IssueNote,
  type CreateIssueParams,
  type UpdateIssueParams 
} from "../../deno-backend/mod.ts";

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

// Store project data for interactive navigation
const projectDataMap = new Map<number, Project[]>();
// Store issue data for interactive navigation
const issueDataMap = new Map<number, Issue[]>();

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
  bufferName?: string
): Promise<{ bufnr: number; isNew: boolean }> {
  const debug = Deno.env.get("GITXAB_DEBUG") === "1";
  
  if (debug) {
    await denops.cmd(`echo "[GitXab Debug] findOrCreateBuffer: filetype=${filetype}, bufferName=${bufferName || 'none'}"`);
  }
  
  // Get list of all buffers
  const buffers = await fn.getbufinfo(denops, { buflisted: true });
  
  if (debug) {
    await denops.cmd(`echo "[GitXab Debug] Found ${buffers.length} listed buffers"`);
  }
  
  // Search for existing buffer with matching filetype OR buffer name
  for (const buf of buffers) {
    const bufnr = buf.bufnr;
    const ft = await fn.getbufvar(denops, bufnr, "&filetype") as string;
    const bufname = await fn.bufname(denops, bufnr) as string;
    
    if (debug) {
      await denops.cmd(`echo "[GitXab Debug] Checking buffer ${bufnr}: filetype='${ft}', name='${bufname}'"`);
    }
    
    // Match by filetype OR buffer name
    const matchesFiletype = ft === filetype;
    const matchesName = bufferName && bufname === bufferName;
    
    if (matchesFiletype || matchesName) {
      // Found existing buffer - switch to it
      if (debug) {
        const matchType = matchesFiletype ? "filetype" : "name";
        await denops.cmd(`echo "[GitXab Debug] Found existing buffer ${bufnr} by ${matchType}"`);
      }
      
      // Check if buffer is visible in any window
      const winnr = await fn.bufwinnr(denops, bufnr) as number;
      
      if (winnr !== -1) {
        // Buffer is visible - switch to that window and reuse it
        if (debug) {
          await denops.cmd(`echo "[GitXab Debug] Buffer visible in window ${winnr}, switching to it"`);
        }
        await denops.cmd(`${winnr}wincmd w`);
        // Make buffer modifiable temporarily for content update
        await vars.b.set(denops, "modifiable", true);
      } else {
        // Buffer exists but not visible - switch to it in current window
        if (debug) {
          await denops.cmd(`echo "[GitXab Debug] Buffer not visible, switching to it with :buffer ${bufnr}"`);
        }
        await denops.cmd(`buffer ${bufnr}`);
        await vars.b.set(denops, "modifiable", true);
      }
      return { bufnr, isNew: false };
    }
  }
  
  // No existing buffer found - create new one
  if (debug) {
    await denops.cmd(`echo "[GitXab Debug] No existing buffer found, creating new one"`);
  }
  
  await denops.cmd("new");
  const bufnr = await fn.bufnr(denops, "%") as number;
  
  // Set buffer name if provided (only for new buffers)
  if (bufferName) {
    try {
      await denops.cmd(`file ${bufferName}`);
      if (debug) {
        await denops.cmd(`echo "[GitXab Debug] Set buffer name to '${bufferName}'"`);
      }
    } catch (error) {
      // Ignore errors when setting buffer name
      if (debug) {
        const msg = error instanceof Error ? error.message : String(error);
        await denops.cmd(`echo "[GitXab Debug] Failed to set buffer name: ${msg}"`);
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
        const q = typeof query === "string" ? query : undefined;
        const response = await listProjects(q);
        
        // Ensure we have an array
        let projects: Project[];
        if (Array.isArray(response)) {
          projects = response as Project[];
        } else {
          throw new Error(
            `API returned unexpected format (expected array, got ${typeof response}). ` +
            `Check GITLAB_TOKEN and GITLAB_BASE_URL settings.`
          );
        }
        
        if (projects.length === 0) {
          // Use simpler echo command instead of nvim_echo
          await denops.cmd('echohl WarningMsg | echo "No projects found" | echohl None');
          return [];
        }
        
        // Find or create buffer for displaying projects
        const { bufnr, isNew } = await findOrCreateBuffer(
          denops,
          "gitxab-projects",
          "GitXab://projects"
        );
        
        // Store project data for this buffer
        projectDataMap.set(bufnr, projects);
        
        // Format projects with header
        const lines: string[] = [
          "GitLab Projects",
          "=" .repeat(80),
          "Keys: <Enter>=Menu  q=Close  ?=Help",
          "=" .repeat(80),
          "",
        ];
        lines.push(...projects.map(p => `${p.name} - ${p.description || "(no description)"}`));
        
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
          { mode: "n", buffer: true }
        );
        await mapping.map(
          denops,
          "q",
          "<Cmd>close<CR>",
          { mode: "n", buffer: true }
        );
        await mapping.map(
          denops,
          "?",
          `<Cmd>call denops#request('${denops.name}', 'showHelp', ['projects'])<CR>`,
          { mode: "n", buffer: true }
        );
        
        return projects;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        await denops.call("nvim_err_writeln", `GitXab: Failed to list projects: ${message}`);
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
          await denops.call("nvim_err_writeln", "GitXab: No project data found");
          return;
        }
        
        // Find project by matching line text (format: "name - description")
        const projectName = lineText.split(" - ")[0].trim();
        const project = projects.find(p => p.name === projectName);
        
        if (!project) {
          return; // Not on a valid project line
        }
        
        // Show menu using inputlist
        const choices = [
          `Project: ${project.name} (ID: ${project.id})`,
          "1. View Issues",
          "2. Create New Issue",
          "3. View Merge Requests (Coming Soon)",
          "4. Cancel",
        ];
        
        const choice = await denops.call("inputlist", choices) as number;
        
        if (choice === 1) {
          // View issues
          await denops.dispatcher.listIssues(project.id);
        } else if (choice === 2) {
          // Create issue
          await denops.dispatcher.createIssue(project.id);
        } else if (choice === 3) {
          await denops.cmd('echohl WarningMsg | echo "Merge Requests feature coming soon" | echohl None');
        }
        // choice === 4 or 0 (ESC) - do nothing
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        await denops.call("nvim_err_writeln", `GitXab: Failed to open project menu: ${message}`);
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
        
        const pid = typeof projectId === "string" ? parseInt(projectId, 10) : projectId;
        if (isNaN(pid)) {
          throw new Error("Invalid project ID");
        }
        
        const stateFilter = (state === "opened" || state === "closed" || state === "all") 
          ? state 
          : undefined;
        
        const issues = await apiListIssues(pid, stateFilter);
        
        if (!Array.isArray(issues)) {
          throw new Error("API returned unexpected format for issues");
        }
        
        if (issues.length === 0) {
          await denops.cmd('echohl WarningMsg | echo "No issues found" | echohl None');
          return [];
        }
        
        // Find or create buffer for displaying issues
        const { bufnr, isNew } = await findOrCreateBuffer(
          denops,
          "gitxab-issues",
          `GitXab://project/${pid}/issues`
        );
        
        // Store issue data for this buffer
        issueDataMap.set(bufnr, issues);
        
        // Format issues for display
        const lines: string[] = [
          `GitLab Issues - Project #${pid}`,
          "=" .repeat(80),
          "Keys: <Enter>=Detail  n=New  r=Refresh  q=Close  ?=Help",
          "=" .repeat(80),
          `Total: ${issues.length} issues`,
          "",
        ];
        
        // Group by state
        const openIssues = issues.filter(i => i.state === "opened");
        const closedIssues = issues.filter(i => i.state === "closed");
        
        if (openIssues.length > 0) {
          lines.push("Open Issues:");
          lines.push("-".repeat(80));
          for (const issue of openIssues) {
            const assignee = issue.assignee?.username || issue.assignees?.[0]?.username || "unassigned";
            const labels = issue.labels && issue.labels.length > 0 
              ? `[${issue.labels.join(", ")}]` 
              : "";
            const date = new Date(issue.created_at).toLocaleDateString();
            lines.push(`#${issue.iid} ${issue.title} ${labels} @${assignee} ${date}`);
          }
          lines.push("");
        }
        
        if (closedIssues.length > 0) {
          lines.push("Closed Issues:");
          lines.push("-".repeat(80));
          for (const issue of closedIssues) {
            const assignee = issue.assignee?.username || issue.assignees?.[0]?.username || "unassigned";
            const labels = issue.labels && issue.labels.length > 0 
              ? `[${issue.labels.join(", ")}]` 
              : "";
            const date = new Date(issue.updated_at).toLocaleDateString();
            lines.push(`#${issue.iid} ${issue.title} ${labels} @${assignee} ${date}`);
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
        await mapping.map(
          denops,
          "<CR>",
          `<Cmd>call denops#request('${denops.name}', 'openIssueDetail', [bufnr('%'), ${pid}])<CR>`,
          { mode: "n", buffer: true }
        );
        await mapping.map(
          denops,
          "q",
          "<Cmd>close<CR>",
          { mode: "n", buffer: true }
        );
        await mapping.map(
          denops,
          "r",
          `<Cmd>call denops#request('${denops.name}', 'listIssues', [${pid}, '${stateFilter || ""}'])<CR>`,
          { mode: "n", buffer: true }
        );
        await mapping.map(
          denops,
          "n",
          `<Cmd>call denops#request('${denops.name}', 'createIssue', [${pid}])<CR>`,
          { mode: "n", buffer: true }
        );
        await mapping.map(
          denops,
          "?",
          `<Cmd>call denops#request('${denops.name}', 'showHelp', ['issues'])<CR>`,
          { mode: "n", buffer: true }
        );
        
        return issues;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        await denops.call("nvim_err_writeln", `GitXab: Failed to list issues: ${message}`);
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
        
        const pid = typeof projectId === "string" ? parseInt(projectId, 10) : projectId;
        if (isNaN(pid)) {
          throw new Error("Invalid project ID");
        }
        
        // Prompt for issue title
        const title = await denops.call("input", "Issue title: ") as string;
        if (!title || title.trim() === "") {
          await denops.cmd('echohl WarningMsg | echo "Issue creation cancelled" | echohl None');
          return;
        }
        
        // Prompt for issue description
        const description = await denops.call("input", "Issue description (optional): ") as string;
        
        // Prompt for labels
        const labelsInput = await denops.call("input", "Labels (comma-separated, optional): ") as string;
        
        // Build issue params
        const params: CreateIssueParams = {
          title: title.trim(),
        };
        
        if (description && description.trim()) {
          params.description = description.trim();
        }
        
        if (labelsInput && labelsInput.trim()) {
          params.labels = labelsInput.trim();
        }
        
        // Create the issue
        await denops.cmd('echo "Creating issue..."');
        const issue = await apiCreateIssue(pid, params);
        
        // Show success message
        await denops.cmd(`echohl MoreMsg | echo "✓ Issue #${issue.iid} created successfully" | echohl None`);
        
        // Optionally refresh issue list if we're in an issue buffer
        const filetype = await vars.b.get(denops, "filetype");
        if (filetype === "gitxab-issues") {
          await denops.dispatcher.listIssues(pid);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        await denops.call("nvim_err_writeln", `GitXab: Failed to create issue: ${message}`);
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
        await denops.call("nvim_err_writeln", `GitXab: Failed to open issue detail: ${message}`);
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
        
        const pid = typeof projectId === "string" ? parseInt(projectId, 10) : projectId;
        const iid = typeof issueIid === "string" ? parseInt(issueIid, 10) : issueIid;
        
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
        const { bufnr, isNew } = await findOrCreateBuffer(
          denops,
          "gitxab-issue",
          `GitXab://project/${pid}/issue/${iid}`
        );
        
        // Format issue details
        const lines: string[] = [
          `GitLab Issue #${issue.iid}: ${issue.title}`,
          "=" .repeat(80),
          "Keys: c=Comment  R=Reply  e=Edit  r=Refresh  q=Close  ?=Help",
          "=" .repeat(80),
          `Project: #${pid}`,
          `State: ${issue.state}`,
          `Author: @${issue.author.username}`,
          `Created: ${new Date(issue.created_at).toLocaleString()}`,
          `Updated: ${new Date(issue.updated_at).toLocaleString()}`,
        ];
        
        if (issue.assignee || issue.assignees?.length) {
          const assignees = issue.assignees?.map((a: { username: string }) => `@${a.username}`).join(", ") || `@${issue.assignee?.username}`;
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
          lines.push("=" .repeat(80));
          
          for (let i = 0; i < userDiscussions.length; i++) {
            const discussion = userDiscussions[i];
            const discussionType = discussion.individual_note ? "Comment" : "Thread";
            lines.push("");
            lines.push(`[${i + 1}] ${discussionType} - Discussion ID: ${discussion.id}`);
            
            // Display all notes in this discussion
            for (const note of discussion.notes) {
              if (note.system) continue; // Skip system notes
              lines.push("");
              lines.push(`  @${note.author.username} - ${new Date(note.created_at).toLocaleString()}`);
              lines.push("  " + "-".repeat(78));
              lines.push(...note.body.split("\n").map((line: string) => `  ${line}`));
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
          { mode: "n", buffer: true }
        );
        await mapping.map(
          denops,
          "c",
          `<Cmd>call denops#request('${denops.name}', 'addComment', [${pid}, ${iid}])<CR>`,
          { mode: "n", buffer: true }
        );
        await mapping.map(
          denops,
          "R",
          `<Cmd>call denops#request('${denops.name}', 'replyToComment', [${pid}, ${iid}])<CR>`,
          { mode: "n", buffer: true }
        );
        await mapping.map(
          denops,
          "e",
          `<Cmd>call denops#request('${denops.name}', 'editIssue', [${pid}, ${iid}])<CR>`,
          { mode: "n", buffer: true }
        );
        await mapping.map(
          denops,
          "r",
          `<Cmd>call denops#request('${denops.name}', 'viewIssue', [${pid}, ${iid}])<CR>`,
          { mode: "n", buffer: true }
        );
        await mapping.map(
          denops,
          "?",
          `<Cmd>call denops#request('${denops.name}', 'showHelp', ['issue-detail'])<CR>`,
          { mode: "n", buffer: true }
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        await denops.call("nvim_err_writeln", `GitXab: Failed to view issue: ${message}`);
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
        
        // Prompt for comment
        const comment = await denops.call("input", "Comment: ") as string;
        if (!comment || comment.trim() === "") {
          await denops.cmd('echohl WarningMsg | echo "Comment cancelled" | echohl None');
          return;
        }
        
        // Post comment
        await denops.cmd('echo "Posting comment..."');
        await apiCreateIssueNote(projectId, issueIid, comment.trim());
        
        // Show success message
        await denops.cmd('echohl MoreMsg | echo "✓ Comment added" | echohl None');
        
        // Refresh issue view
        await denops.dispatcher.viewIssue(projectId, issueIid);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        await denops.call("nvim_err_writeln", `GitXab: Failed to add comment: ${message}`);
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
        const discussions = await fn.getbufvar(denops, "%", "gitxab_discussions") as Discussion[] | string;
        if (!discussions || typeof discussions === "string" || discussions.length === 0) {
          await denops.cmd('echohl WarningMsg | echo "No discussions found" | echohl None');
          return;
        }
        
        // Prompt for discussion number
        const discussionNumStr = await denops.call("input", `Reply to discussion [1-${discussions.length}]: `) as string;
        if (!discussionNumStr || discussionNumStr.trim() === "") {
          await denops.cmd('echohl WarningMsg | echo "Reply cancelled" | echohl None');
          return;
        }
        
        const discussionNum = parseInt(discussionNumStr.trim(), 10);
        if (isNaN(discussionNum) || discussionNum < 1 || discussionNum > discussions.length) {
          await denops.cmd('echohl ErrorMsg | echo "Invalid discussion number" | echohl None');
          return;
        }
        
        const targetDiscussion = discussions[discussionNum - 1];
        const firstNote = targetDiscussion.notes[0];
        
        // Prompt for reply text
        const reply = await denops.call("input", `Reply to discussion by @${firstNote.author.username}: `) as string;
        if (!reply || reply.trim() === "") {
          await denops.cmd('echohl WarningMsg | echo "Reply cancelled" | echohl None');
          return;
        }
        
        // Post reply to discussion using Discussion API
        await denops.cmd('echo "Posting reply to discussion..."');
        await apiAddNoteToDiscussion(projectId, issueIid, targetDiscussion.id, reply.trim());
        
        // Show success message
        await denops.cmd(`echohl MoreMsg | echo "✓ Reply to discussion ${discussionNum} posted" | echohl None`);
        
        // Refresh issue view
        await denops.dispatcher.viewIssue(projectId, issueIid);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        await denops.call("nvim_err_writeln", `GitXab: Failed to reply: ${message}`);
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
          const title = await denops.call("input", "Title: ", issue.title) as string;
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
          
          const contentLines = issue.description ? issue.description.split("\n") : [""];
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
          await denops.cmd(`echo "[GitXab Debug] Setting up autocmds for buffer ${bufnr}, file: ${tmpFile}"`);
          await denops.cmd(`echo "[GitXab Debug] Buffer vars: projectId=${projectId}, issueIid=${issueIid}"`);
          
          // Set up autocmd - update immediately on save
          const escapedPath = tmpFile.replace(/\\/g, '\\\\').replace(/ /g, '\\ ');
          await denops.cmd(`augroup GitXabEditDesc`);
          await denops.cmd(`autocmd! * ${escapedPath}`);
          await denops.cmd(`autocmd BufWritePost ${escapedPath} echo "✓ Saved, updating GitLab..." | echo "[GitXab Debug] BufWritePost triggered, calling update" | call denops#request('${denops.name}', 'onDescriptionBufferClose', [${bufnr}])`);
          await denops.cmd(`autocmd BufUnload ${escapedPath} echo "[GitXab Debug] BufUnload - cleaning up" | call denops#request('${denops.name}', 'cleanupDescriptionEdit', ['${tmpFile}'])`);
          await denops.cmd(`augroup END`);
          
          // Verify autocmds were set
          await denops.cmd(`echo "[GitXab Debug] Autocmds set for file: ${escapedPath}"`);
          await denops.cmd(`echo "[GitXab Debug] Use :au GitXabEditDesc to verify"`);
          await denops.cmd('echo "Edit description, save with :w to update GitLab"');
          return; // Don't proceed with update yet
        } else if (choice === 3) {
          // Edit labels with current values pre-filled
          const currentLabels = Array.isArray(issue.labels) ? issue.labels.join(", ") : "";
          const labels = await denops.call("input", "Labels (comma-separated): ", currentLabels) as string;
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
        await denops.cmd('echohl MoreMsg | echo "✓ Issue updated" | echohl None');
        
        // Refresh issue view
        await denops.dispatcher.viewIssue(projectId, issueIid);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        await denops.call("nvim_err_writeln", `GitXab: Failed to edit issue: ${message}`);
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
          if (debug) await denops.cmd('echo "[GitXab Debug] onDescriptionBufferClose: bufnr is not a number"');
          return;
        }
        
        if (debug) await denops.cmd(`echo "[GitXab Debug] onDescriptionBufferClose: bufnr=${bufnr}"`);
        
        // Get temp file path and project/issue info
        const tmpFile = await fn.getbufvar(denops, bufnr, "gitxab_tmpfile") as string;
        const projectId = await fn.getbufvar(denops, bufnr, "gitxab_project_id") as number;
        const issueIid = await fn.getbufvar(denops, bufnr, "gitxab_issue_iid") as number;
        
        if (debug) await denops.cmd(`echo "[GitXab Debug] tmpFile=${tmpFile}, projectId=${projectId}, issueIid=${issueIid}"`);
        
        if (!tmpFile || !projectId || !issueIid) {
          if (debug) await denops.cmd('echo "[GitXab Debug] Missing required variables, exiting"');
          return;
        }
        
        // Check if file exists and was modified (saved)
        const fileExists = await fn.filereadable(denops, tmpFile) as number;
        if (debug) await denops.cmd(`echo "[GitXab Debug] fileExists=${fileExists}"`);
        if (!fileExists) {
          // File doesn't exist, likely deleted - no action needed
          if (debug) await denops.cmd('echo "[GitXab Debug] File does not exist, exiting"');
          return;
        }
        
        // Note: We don't check modified flag anymore since we update on every save (BufWritePost)
        // Just proceed with the update
        
        // Read content from temp file
        const lines = await denops.call("readfile", tmpFile) as string[];
        if (debug) await denops.cmd(`echo "[GitXab Debug] Read ${lines.length} lines from temp file"`);
        
        // Find where instructions end (look for the separator line)
        let contentStart = 0;
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].includes("========================================")) {
            contentStart = i + 2; // Skip separator and empty line
            break;
          }
        }
        
        if (debug) await denops.cmd(`echo "[GitXab Debug] Content starts at line ${contentStart}"`);
        
        // Get description content (everything after instructions)
        const descriptionLines = lines.slice(contentStart);
        const description = descriptionLines.join("\n").trim();
        
        if (debug) await denops.cmd(`echo "[GitXab Debug] Description length: ${description.length} chars"`);
        
        // Update issue
        await denops.cmd('echo "Updating issue..."');
        if (debug) await denops.cmd(`echo "[GitXab Debug] Calling apiUpdateIssue(${projectId}, ${issueIid}, ...)"`);
        await apiUpdateIssue(projectId, issueIid, { description });
        
        // Show success message
        await denops.cmd('echohl MoreMsg | echo "✓ Description updated in GitLab" | echohl None');
        
        // Note: Cleanup (temp file deletion, autocmd removal) happens in BufUnload via cleanupDescriptionEdit
        
        // Refresh issue view if it's open
        if (debug) await denops.cmd(`echo "[GitXab Debug] Refreshing issue view"`);
        await denops.dispatcher.viewIssue(projectId, issueIid);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        await denops.call("nvim_err_writeln", `GitXab: Failed to save description: ${message}`);
      }
    },

    /**
     * Cleanup temp file and autocmds when buffer is unloaded
     */
    async cleanupDescriptionEdit(tmpFile: unknown): Promise<void> {
      const debug = Deno.env.get("GITXAB_DEBUG") === "1";
      try {
        if (typeof tmpFile !== "string") return;
        
        if (debug) await denops.cmd(`echo "[GitXab Debug] Cleaning up ${tmpFile}"`);
        
        // Clean up temp file
        const fileExists = await fn.filereadable(denops, tmpFile) as number;
        if (fileExists) {
          await denops.call("delete", tmpFile);
          if (debug) await denops.cmd(`echo "[GitXab Debug] Deleted temp file"`);
        }
        
        // Clean up autocmds
        const escapedPath = tmpFile.replace(/\\/g, '\\\\').replace(/ /g, '\\ ');
        await denops.cmd(`augroup GitXabEditDesc`);
        await denops.cmd(`autocmd! * ${escapedPath}`);
        await denops.cmd(`augroup END`);
        if (debug) await denops.cmd(`echo "[GitXab Debug] Cleaned up autocmds"`);
      } catch (error) {
        // Ignore cleanup errors
      }
    },

    /**
     * Save edited description from buffer (manual command)
     * @param projectId - Project ID
     * @param issueIid - Issue IID
     */
    async saveDescription(projectId: unknown, issueIid: unknown): Promise<void> {
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
        await denops.cmd('echohl MoreMsg | echo "✓ Description updated" | echohl None');
        
        // Refresh issue view if it's open
        await denops.dispatcher.viewIssue(projectId, issueIid);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        await denops.call("nvim_err_writeln", `GitXab: Failed to save description: ${message}`);
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
          "=" .repeat(60),
          "",
          "Keyboard Shortcuts:",
          "  <Enter>  - Open project menu (View Issues / Create Issue)",
          "  q        - Close buffer",
          "  ?        - Show this help",
          "",
          "Project Menu Options:",
          "  1. View Issues - Display issues for this project",
          "  2. Create New Issue - Create a new issue",
          "  3. View Merge Requests - (Coming Soon)",
        ],
        issues: [
          "GitXab.vim - Issue List Help",
          "=" .repeat(60),
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
          "=" .repeat(60),
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
     * List merge requests
     * @param projectId - GitLab project ID
     */
    async listMergeRequests(projectId: unknown): Promise<unknown> {
      // TODO: Implement MR list display
      await denops.call("nvim_echo", [[`Not implemented yet: listMergeRequests(${projectId})`]], false, {});
      return null;
    },
  };

  // Register commands directly in denops
  await denops.cmd(
    `command! -nargs=? GitXabProjects call denops#request('${denops.name}', 'listProjects', [<q-args>])`
  );
  
  await denops.cmd(
    `command! -nargs=+ GitXabIssues call denops#request('${denops.name}', 'listIssues', [<f-args>])`
  );
  
  await denops.cmd(
    `command! -nargs=1 GitXabCreateIssue call denops#request('${denops.name}', 'createIssue', [<f-args>])`
  );
  
  await denops.cmd(
    `command! -nargs=1 GitXabMRs call denops#request('${denops.name}', 'listMergeRequests', [<f-args>])`
  );
  
  await denops.cmd(
    `command! -nargs=+ GitXabSaveDescription call denops#request('${denops.name}', 'saveDescription', [<f-args>])`
  );

  console.log("GitXab plugin initialized with commands");
}
