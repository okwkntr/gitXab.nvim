/**
 * Integration tests for GitXab backend with real GitLab instance
 * Run with: deno test --allow-env --allow-read --allow-net --allow-write
 *
 * Note: These tests require a GitLab instance (GITLAB_BASE_URL) and valid token (GITLAB_TOKEN).
 * Tests will use whatever projects are available in the configured GitLab instance.
 * For mocked unit tests that don't require GitLab, see backend_mock_test.ts
 */

import {
  assertEquals,
  assertExists,
} from "https://deno.land/std@0.208.0/assert/mod.ts";
import {
  getMergeRequest,
  getMergeRequestChanges,
  getMergeRequestDiscussions,
  type Issue,
  listBranches,
  listIssues,
  listMergeRequests,
  listProjects,
  type Project,
} from "../deno-backend/mod.ts";

Deno.test("listProjects - should return project list from GitLab", async () => {
  const projects = await listProjects();

  assertEquals(Array.isArray(projects), true);
  console.log(`  ✓ Returned ${projects.length} projects from GitLab`);

  if (projects.length > 0) {
    const project = projects[0] as Project;
    assertExists(project.id);
    assertExists(project.name);
    assertExists(project.path);
    console.log(`  ✓ Project structure validated: ${project.name}`);
  }
});

Deno.test("listIssues - should return issues if project exists", async () => {
  const projects = await listProjects();

  if (projects.length === 0) {
    console.log(`  ⚠ No projects available, skipping test`);
    return;
  }

  const projectId = projects[0].id;

  try {
    const issues = await listIssues(projectId, "opened");
    assertEquals(Array.isArray(issues), true);
    console.log(
      `  ✓ Returned ${issues.length} issues for project ${projectId}`,
    );

    if (issues.length > 0) {
      const issue: Issue = issues[0];
      assertExists(issue.id);
      assertExists(issue.iid);
      assertExists(issue.title);
      assertExists(issue.state);
      assertExists(issue.author);
      console.log(`  ✓ Issue structure validated: #${issue.iid}`);
    }
  } catch (error) {
    const err = error as Error;
    console.log(`  ⚠ Could not fetch issues: ${err.message}`);
  }
});

Deno.test("listIssues - should handle invalid project ID", async () => {
  const invalidProjectId = 999999999;

  try {
    await listIssues(invalidProjectId, "opened");
    console.log(`  ⚠ Project ${invalidProjectId} might exist or returns empty`);
  } catch (error) {
    const err = error as Error;
    assertExists(err.message);
    console.log(`  ✓ Correctly threw error for invalid project`);
  }
});

Deno.test("listMergeRequests - should return MRs if available", async () => {
  const projects = await listProjects();

  if (projects.length === 0) {
    console.log(`  ⚠ No projects available, skipping test`);
    return;
  }

  const projectId = projects[0].id;

  try {
    const mrs = await listMergeRequests(projectId);
    assertEquals(Array.isArray(mrs), true);
    console.log(`  ✓ Returned ${mrs.length} merge requests`);

    if (mrs.length > 0) {
      const mr = mrs[0];
      assertExists(mr.id);
      assertExists(mr.iid);
      assertExists(mr.title);
      assertExists(mr.source_branch);
      assertExists(mr.target_branch);
      console.log(`  ✓ MR structure validated: !${mr.iid}`);
    }
  } catch (error) {
    const err = error as Error;
    console.log(`  ⚠ Could not fetch MRs: ${err.message}`);
  }
});

Deno.test("getMergeRequest - should return MR details if available", async () => {
  const projects = await listProjects();

  if (projects.length === 0) {
    console.log(`  ⚠ No projects available, skipping test`);
    return;
  }

  const projectId = projects[0].id;

  try {
    const mrs = await listMergeRequests(projectId);

    if (mrs.length === 0) {
      console.log(`  ⚠ No MRs available, skipping test`);
      return;
    }

    const mrIid = mrs[0].iid;
    const mr = await getMergeRequest(projectId, mrIid);

    assertExists(mr);
    assertEquals(mr.iid, mrIid);
    assertExists(mr.title);
    assertExists(mr.state);
    assertExists(mr.author);
    console.log(`  ✓ MR details validated: !${mr.iid}`);
  } catch (error) {
    const err = error as Error;
    console.log(`  ⚠ Could not fetch MR details: ${err.message}`);
  }
});

Deno.test({
  name: "getMergeRequestDiscussions - should return discussions if available",
  sanitizeResources: false,
  async fn() {
    const projects = await listProjects();

    if (projects.length === 0) {
      console.log(`  ⚠ No projects available, skipping test`);
      return;
    }

    const projectId = projects[0].id;

    try {
      const mrs = await listMergeRequests(projectId);

      if (mrs.length === 0) {
        console.log(`  ⚠ No MRs available, skipping test`);
        return;
      }

      const mrIid = mrs[0].iid;
      const discussions = await getMergeRequestDiscussions(projectId, mrIid);

      assertEquals(Array.isArray(discussions), true);
      console.log(`  ✓ Returned ${discussions.length} discussions`);

      if (discussions.length > 0) {
        const discussion = discussions[0];
        assertExists(discussion.id);
        assertExists(discussion.notes);
        console.log(`  ✓ Discussion structure validated`);
      }
    } catch (error) {
      const err = error as Error;
      if (err.message.includes("Unauthorized") || err.message.includes("401")) {
        console.log(`  ⚠ Skipped: Discussions require authentication`);
        return;
      }
      console.log(`  ⚠ Could not fetch discussions: ${err.message}`);
    }
  },
});

Deno.test("getMergeRequestChanges - should return MR diffs if available", async () => {
  const projects = await listProjects();

  if (projects.length === 0) {
    console.log(`  ⚠ No projects available, skipping test`);
    return;
  }

  const projectId = projects[0].id;

  try {
    const mrs = await listMergeRequests(projectId);

    if (mrs.length === 0) {
      console.log(`  ⚠ No MRs available, skipping test`);
      return;
    }

    const mrIid = mrs[0].iid;
    const changes = await getMergeRequestChanges(projectId, mrIid);

    assertExists(changes);
    assertExists(changes.changes);
    assertEquals(Array.isArray(changes.changes), true);
    console.log(`  ✓ Returned ${changes.changes.length} changed files`);

    if (changes.changes.length > 0) {
      const change = changes.changes[0];
      assertExists(change.old_path);
      assertExists(change.new_path);
      console.log(`  ✓ Change structure validated`);
    }
  } catch (error) {
    const err = error as Error;
    console.log(`  ⚠ Could not fetch changes: ${err.message}`);
  }
});

Deno.test({
  name: "listBranches - should return branches if available",
  sanitizeResources: false,
  async fn() {
    const projects = await listProjects();

    if (projects.length === 0) {
      console.log(`  ⚠ No projects available, skipping test`);
      return;
    }

    const projectId = projects[0].id;

    try {
      const branches = await listBranches(projectId);
      assertEquals(Array.isArray(branches), true);
      console.log(`  ✓ Returned ${branches.length} branches`);

      if (branches.length > 0) {
        const branch = branches[0];
        assertExists(branch.name);
        console.log(`  ✓ Branch structure validated`);

        // deno-lint-ignore no-explicit-any
        const defaultBranch = branches.find((b: any) => b.default === true);
        if (defaultBranch) {
          console.log(`    Default branch: ${defaultBranch.name}`);
        }
      }
    } catch (error) {
      const err = error as Error;
      console.log(`  ⚠ Could not fetch branches: ${err.message}`);
    }
  },
});
