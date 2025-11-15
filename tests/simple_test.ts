// Simple test: Check if listIssues can be imported and called
console.log("Step 1: Importing...");
const { listIssues } = await import("../deno-backend/mod.ts");

console.log("Step 2: Import successful");
console.log("listIssues type:", typeof listIssues);

console.log("\nStep 3: Calling listIssues(278964, 'opened')...");
const issues = await listIssues(278964, "opened");

console.log("\nStep 4: Success!");
console.log("Received", issues.length, "issues");
if (issues.length > 0) {
  console.log("First issue:", issues[0].iid, issues[0].title);
}
