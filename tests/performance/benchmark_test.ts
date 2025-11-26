/**
 * Performance benchmarks for GitXab backend
 * Run with: deno bench --allow-env --allow-read --allow-net tests/performance/
 */

import { 
  listProjects, 
  listIssues,
  getIssue 
} from "../../deno-backend/mod.ts";

const TEST_PROJECT_ID = 278964; // GitLab's own project

// Benchmark: List projects
Deno.bench("listProjects - without search", async () => {
  await listProjects();
});

Deno.bench("listProjects - with search query", async () => {
  await listProjects("gitlab");
});

// Benchmark: List issues
Deno.bench("listIssues - opened state", async () => {
  await listIssues(TEST_PROJECT_ID, "opened");
});

Deno.bench("listIssues - all states", async () => {
  await listIssues(TEST_PROJECT_ID, "all");
});

// Benchmark: Get single issue (needs to fetch list first to get valid IID)
Deno.bench({
  name: "getIssue - single issue detail",
  async fn() {
    // Use a known issue IID for benchmarking
    const issues = await listIssues(TEST_PROJECT_ID, "opened");
    if (issues.length > 0) {
      await getIssue(TEST_PROJECT_ID, issues[0].iid);
    }
  },
});

// Benchmark: Cache effectiveness
Deno.bench({
  name: "listProjects - with cache (2nd call)",
  async fn() {
    // First call to populate cache
    await listProjects();
    // Second call should use cache
    await listProjects();
  },
});
