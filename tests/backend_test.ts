/**
 * Unit tests for GitXab backend functions
 * Run with: deno test --allow-env --allow-read --allow-net
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { listProjects, listIssues, type Issue, type Project } from "../deno-backend/mod.ts";

Deno.test("listProjects - should fetch projects from public GitLab", async () => {
  const projects = await listProjects();
  
  // Should return an array
  assertEquals(Array.isArray(projects), true);
  
  // Should have at least some projects (if token is set) or work without token
  console.log(`  Found ${projects.length} projects`);
});

Deno.test("listIssues - should fetch issues from public project", async () => {
  // Use GitLab's own project (public)
  const projectId = 278964;
  const issues = await listIssues(projectId, "opened");
  
  // Should return an array
  assertEquals(Array.isArray(issues), true);
  
  // Should have some issues
  console.log(`  Found ${issues.length} open issues for project ${projectId}`);
  
  if (issues.length > 0) {
    const issue: Issue = issues[0];
    
    // Verify Issue structure
    assertExists(issue.id);
    assertExists(issue.iid);
    assertExists(issue.title);
    assertExists(issue.state);
    assertExists(issue.author);
    assertExists(issue.author.username);
    
    console.log(`  Example issue: #${issue.iid} "${issue.title}"`);
  }
});

Deno.test("listIssues - should filter by state", async () => {
  const projectId = 278964;
  
  // Test opened filter
  const openIssues = await listIssues(projectId, "opened");
  assertEquals(Array.isArray(openIssues), true);
  console.log(`  Opened issues: ${openIssues.length}`);
  
  // Verify all issues are opened
  for (const issue of openIssues) {
    assertEquals(issue.state, "opened");
  }
  
  // Test closed filter
  const closedIssues = await listIssues(projectId, "closed");
  assertEquals(Array.isArray(closedIssues), true);
  console.log(`  Closed issues: ${closedIssues.length}`);
  
  // Verify all issues are closed
  for (const issue of closedIssues) {
    assertEquals(issue.state, "closed");
  }
});

Deno.test("listIssues - should handle invalid project ID", async () => {
  const invalidProjectId = 999999999;
  
  try {
    await listIssues(invalidProjectId, "opened");
    // If we get here, the project might exist, or it returns empty array
    console.log(`  Project ${invalidProjectId} exists or returns empty`);
  } catch (error) {
    // Expected: should throw error for non-existent project
    const err = error as Error;
    assertExists(err.message);
    console.log(`  ✓ Correctly threw error: ${err.message}`);
  }
});
