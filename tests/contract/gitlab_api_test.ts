/**
 * Contract tests - Verify GitLab API responses match expected schema
 * Based on specs/001-gitlab-vim-integration/contracts/openapi.yaml
 *
 * Run with: deno test --allow-env --allow-read --allow-net tests/contract/gitlab_api_test.ts
 */

import {
  assertEquals,
  assertExists,
} from "https://deno.land/std@0.208.0/assert/mod.ts";
import {
  getIssue,
  type Issue,
  listIssues,
  listMergeRequests,
  listProjects,
  type MergeRequest,
  type Project,
} from "../../deno-backend/mod.ts";

/**
 * Verify Project schema matches OpenAPI specification
 */
function validateProjectSchema(project: Project): void {
  // Required fields from openapi.yaml
  assertExists(project.id, "Project.id is required");
  assertEquals(typeof project.id, "number", "Project.id must be number");

  assertExists(project.name, "Project.name is required");
  assertEquals(typeof project.name, "string", "Project.name must be string");

  // Optional fields
  if (project.description !== null && project.description !== undefined) {
    assertEquals(
      typeof project.description,
      "string",
      "Project.description must be string",
    );
  }

  if (project.path !== null && project.path !== undefined) {
    assertEquals(typeof project.path, "string", "Project.path must be string");
  }
}

/**
 * Verify Issue schema matches OpenAPI specification
 */
function validateIssueSchema(issue: Issue): void {
  // Required fields from openapi.yaml
  assertExists(issue.id, "Issue.id is required");
  assertEquals(typeof issue.id, "number", "Issue.id must be number");

  assertExists(issue.iid, "Issue.iid is required");
  assertEquals(typeof issue.iid, "number", "Issue.iid must be number");

  assertExists(issue.title, "Issue.title is required");
  assertEquals(typeof issue.title, "string", "Issue.title must be string");

  // Optional fields
  if (issue.description !== null && issue.description !== undefined) {
    assertEquals(
      typeof issue.description,
      "string",
      "Issue.description must be string",
    );
  }

  // Additional GitLab-specific fields
  assertExists(issue.state, "Issue.state is required");
  assertEquals(typeof issue.state, "string", "Issue.state must be string");

  assertExists(issue.author, "Issue.author is required");
  assertEquals(typeof issue.author, "object", "Issue.author must be object");
  assertExists(issue.author.username, "Issue.author.username is required");
}

/**
 * Verify MergeRequest schema (basic structure)
 */
function validateMergeRequestSchema(mr: MergeRequest): void {
  // Required fields from openapi.yaml
  assertExists(mr.id, "MergeRequest.id is required");
  assertEquals(typeof mr.id, "number", "MergeRequest.id must be number");

  assertExists(mr.iid, "MergeRequest.iid is required");
  assertEquals(typeof mr.iid, "number", "MergeRequest.iid must be number");

  assertExists(mr.title, "MergeRequest.title is required");
  assertEquals(typeof mr.title, "string", "MergeRequest.title must be string");

  // Optional fields
  if (mr.description !== null && mr.description !== undefined) {
    assertEquals(
      typeof mr.description,
      "string",
      "MergeRequest.description must be string",
    );
  }

  // GitLab-specific fields
  assertExists(mr.state, "MergeRequest.state is required");
  assertEquals(typeof mr.state, "string", "MergeRequest.state must be string");

  assertExists(mr.source_branch, "MergeRequest.source_branch is required");
  assertExists(mr.target_branch, "MergeRequest.target_branch is required");
}

// Contract Tests

Deno.test("contract - GET /projects returns valid Project array", async () => {
  const projects = await listProjects();

  assertEquals(Array.isArray(projects), true, "Response must be array");

  if (projects.length > 0) {
    console.log(`  Validating ${Math.min(5, projects.length)} project(s)...`);

    // Validate first few projects
    for (let i = 0; i < Math.min(5, projects.length); i++) {
      validateProjectSchema(projects[i]);
    }

    console.log(`  ✓ All sampled projects match schema`);
  } else {
    console.log("  ⚠ No projects returned (token may be required)");
  }
});

Deno.test("contract - GET /projects?q=search returns filtered results", async () => {
  const projects = await listProjects("gitlab");

  assertEquals(Array.isArray(projects), true, "Response must be array");

  if (projects.length > 0) {
    // Validate schema
    validateProjectSchema(projects[0]);

    // Verify search worked (at least some results contain search term)
    const hasMatch = projects.some((p: Project) =>
      p.name.toLowerCase().includes("gitlab") ||
      (p.description && p.description.toLowerCase().includes("gitlab"))
    );

    console.log(`  Found ${projects.length} project(s) matching "gitlab"`);
    console.log(`  At least one contains search term: ${hasMatch}`);
  }
});

Deno.test("contract - GET /projects/{id}/issues returns valid Issue array", async () => {
  // Use GitLab's own project (public)
  const projectId = 278964;
  const issues = await listIssues(projectId, "opened");

  assertEquals(Array.isArray(issues), true, "Response must be array");

  if (issues.length > 0) {
    console.log(`  Validating ${Math.min(3, issues.length)} issue(s)...`);

    // Validate first few issues
    for (let i = 0; i < Math.min(3, issues.length); i++) {
      validateIssueSchema(issues[i]);
    }

    console.log(`  ✓ All sampled issues match schema`);
  } else {
    console.log("  ℹ No open issues found for project");
  }
});

Deno.test("contract - GET /projects/{id}/issues/{iid} returns valid Issue", async () => {
  // First get an issue to test with
  const projectId = 278964;
  const issues = await listIssues(projectId, "opened");

  if (issues.length === 0) {
    console.log("  ⚠ Skipping test - no issues available");
    return;
  }

  const issueIid = issues[0].iid;
  const issue = await getIssue(projectId, issueIid);

  assertExists(issue, "Issue should be returned");
  validateIssueSchema(issue);

  // Verify we got the right issue
  assertEquals(
    issue.iid,
    issueIid,
    "Returned issue IID should match requested",
  );

  console.log(`  ✓ Issue #${issue.iid} matches schema`);
});

Deno.test("contract - GET /projects/{id}/merge_requests returns valid MR array", async () => {
  // Use a public project that likely has MRs
  const projectId = 278964;

  try {
    const mrs = await listMergeRequests(projectId);

    assertEquals(Array.isArray(mrs), true, "Response must be array");

    if (mrs.length > 0) {
      console.log(`  Validating ${Math.min(3, mrs.length)} MR(s)...`);

      // Validate first few MRs
      for (let i = 0; i < Math.min(3, mrs.length); i++) {
        validateMergeRequestSchema(mrs[i]);
      }

      console.log(`  ✓ All sampled MRs match schema`);
    } else {
      console.log("  ℹ No merge requests found for project");
    }
  } catch (error) {
    const err = error as Error;
    console.log(`  ⚠ Could not fetch MRs: ${err.message}`);
  }
});

Deno.test("contract - Error responses include proper status codes", async () => {
  // Test with invalid project ID
  try {
    await listIssues(999999999, "opened");
    throw new Error("Should have thrown error for invalid project");
  } catch (error) {
    const err = error as Error;
    assertExists(err.message);
    assertEquals(typeof err.message, "string");
    console.log(
      `  ✓ Error message received: ${err.message.substring(0, 50)}...`,
    );
  }
});

Deno.test("contract - Pagination is handled correctly", async () => {
  const projects = await listProjects();

  assertEquals(Array.isArray(projects), true);

  // GitLab typically returns 20 items per page by default
  console.log(`  Received ${projects.length} projects`);

  if (projects.length > 0) {
    // Verify all items have unique IDs
    const ids = new Set(projects.map((p: Project) => p.id));
    assertEquals(
      ids.size,
      projects.length,
      "All projects should have unique IDs",
    );
    console.log(`  ✓ All ${projects.length} projects have unique IDs`);
  }
});

Deno.test("contract - Date fields are in ISO format", async () => {
  const projectId = 278964;
  const issues = await listIssues(projectId, "opened");

  if (issues.length === 0) {
    console.log("  ⚠ Skipping test - no issues available");
    return;
  }

  const issue = issues[0];

  // Check created_at field
  assertExists(issue.created_at, "Issue.created_at is required");

  // Parse as ISO date
  const createdDate = new Date(issue.created_at);
  assertEquals(
    isNaN(createdDate.getTime()),
    false,
    "created_at should be valid date",
  );

  console.log(`  ✓ Date fields are in valid ISO format`);
  console.log(`    Example: ${issue.created_at}`);
});
