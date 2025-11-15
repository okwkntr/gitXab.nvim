/**
 * Test for createIssue function
 * Note: This test requires a valid GITLAB_TOKEN and will create a real issue
 * Run with: deno run --allow-env --allow-read --allow-net tests/test_create_issue.ts
 */

import { createIssue } from "../deno-backend/mod.ts";

const projectId = parseInt(Deno.env.get("TEST_PROJECT_ID") || "0");

if (!projectId) {
  console.log("⚠ Skipping create issue test - TEST_PROJECT_ID not set");
  console.log("To test issue creation:");
  console.log("  TEST_PROJECT_ID=<your_project_id> GITLAB_TOKEN=<token> deno run --allow-env --allow-read --allow-net tests/test_create_issue.ts");
  Deno.exit(0);
}

if (!Deno.env.get("GITLAB_TOKEN")) {
  console.log("⚠ Skipping create issue test - GITLAB_TOKEN not set");
  Deno.exit(0);
}

console.log(`Testing createIssue for project ${projectId}...`);
console.log("");

try {
  const issue = await createIssue(projectId, {
    title: `Test Issue - ${new Date().toISOString()}`,
    description: "This is a test issue created by GitXab.vim automated test",
    labels: "test,automated",
  });
  
  console.log("✓ Issue created successfully!");
  console.log(`  Issue IID: #${issue.iid}`);
  console.log(`  Title: ${issue.title}`);
  console.log(`  URL: ${issue.web_url}`);
  console.log(`  State: ${issue.state}`);
  console.log("");
  console.log("⚠ Please manually close this test issue in GitLab");
} catch (error) {
  console.error("✗ Error:", error instanceof Error ? error.message : String(error));
  Deno.exit(1);
}
