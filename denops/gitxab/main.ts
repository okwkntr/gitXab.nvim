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
import { 
  listProjects, 
  listIssues as apiListIssues, 
  type Project, 
  type Issue 
} from "../../deno-backend/mod.ts";

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
        
        // Create a new buffer for displaying projects
        await denops.cmd("new");
        const bufnr = await fn.bufnr(denops, "%");
        
        // Set buffer options
        await buffer.ensure(denops, bufnr, async () => {
          await buffer.replace(denops, bufnr, 
            projects.map(p => `${p.name} - ${p.description || "(no description)"}`)
          );
        });
        
        // Set buffer as non-modifiable and scratch
        await vars.b.set(denops, "buftype", "nofile");
        await vars.b.set(denops, "bufhidden", "wipe");
        await vars.b.set(denops, "modifiable", false);
        await vars.b.set(denops, "filetype", "gitxab-projects");
        
        return projects;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        await denops.call("nvim_err_writeln", `GitXab: Failed to list projects: ${message}`);
        throw error;
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
        
        // Create a new buffer for displaying issues
        await denops.cmd("new");
        const bufnr = await fn.bufnr(denops, "%");
        
        // Format issues for display
        const lines: string[] = [
          `Project: #${pid} (${issues.length} issues)`,
          "=" .repeat(80),
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
        
        return issues;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        await denops.call("nvim_err_writeln", `GitXab: Failed to list issues: ${message}`);
        throw error;
      }
    },

    /**
     * Get issue details
     * @param projectId - GitLab project ID
     * @param issueIid - Issue IID
     */
    async getIssue(projectId: unknown, issueIid: unknown): Promise<unknown> {
      // TODO: Implement issue details display
      await denops.call("nvim_echo", [[`Not implemented yet: getIssue(${projectId}, ${issueIid})`]], false, {});
      return null;
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
    `command! -nargs=1 GitXabMRs call denops#request('${denops.name}', 'listMergeRequests', [<f-args>])`
  );

  console.log("GitXab plugin initialized with commands");
}
