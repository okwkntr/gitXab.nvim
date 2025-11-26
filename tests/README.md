# Testing Guide

This guide explains how to run tests for GitXab.vim and how to write new tests.

## Test Structure

```
tests/
├── unit/                 # Unit tests for individual functions
│   ├── cache_test.ts    # Cache manager tests
│   └── auth_test.ts     # Authentication tests
├── integration/          # Integration tests with GitLab API
│   ├── projects_test.ts # Project operations
│   ├── issues_test.ts   # Issue operations
│   └── mrs_test.ts      # Merge request operations
├── contract/            # API contract tests
│   └── gitlab_api_test.ts
├── backend_test.ts      # Legacy backend tests
└── integration_test.ts  # Legacy integration tests
```

## Running Tests

### All Tests

```bash
deno test --allow-env --allow-read --allow-net --allow-write
```

### Specific Test File

```bash
deno test --allow-env --allow-read --allow-net tests/unit/cache_test.ts
```

### With Coverage

```bash
deno test --allow-env --allow-read --allow-net --coverage=coverage/
deno coverage coverage/ --lcov > coverage/lcov.info
```

### Watch Mode

```bash
deno test --allow-env --allow-read --allow-net --watch
```

## Test Types

### Unit Tests

Test individual functions in isolation with mocked dependencies.

**Location:** `tests/unit/`

**Example:**
```typescript
import { assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { cacheManager } from "../../deno-backend/src/cache/cache_manager.ts";

Deno.test("cache - should store and retrieve values", () => {
  const key = "test-key";
  const value = { data: "test" };
  
  cacheManager.set(key, value);
  const retrieved = cacheManager.get(key);
  
  assertEquals(retrieved, value);
});
```

### Integration Tests

Test complete workflows with real GitLab API (or test instance).

**Location:** `tests/integration/`

**Example:**
```typescript
import { assertEquals, assertExists } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { listProjects } from "../../deno-backend/mod.ts";

Deno.test("integration - list projects", async () => {
  const projects = await listProjects();
  assertEquals(Array.isArray(projects), true);
  
  if (projects.length > 0) {
    assertExists(projects[0].id);
    assertExists(projects[0].name);
  }
});
```

### Contract Tests

Verify API responses match expected schema.

**Location:** `tests/contract/`

**Example:**
```typescript
import { assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";

Deno.test("contract - Project schema", async () => {
  const response = await fetch("https://gitlab.com/api/v4/projects");
  const projects = await response.json();
  
  // Verify schema
  for (const project of projects) {
    assertEquals(typeof project.id, "number");
    assertEquals(typeof project.name, "string");
    // ... more assertions
  }
});
```

## Writing Tests

### Test Naming Convention

Use descriptive test names that explain what is being tested:

```typescript
// Good
Deno.test("listProjects - should return array of projects", async () => {});
Deno.test("createIssue - should throw error when title is missing", async () => {});

// Bad
Deno.test("test1", async () => {});
Deno.test("projects", async () => {});
```

### Test Structure

Follow the Arrange-Act-Assert pattern:

```typescript
Deno.test("example test", async () => {
  // Arrange: Set up test data and preconditions
  const projectId = 123;
  const expectedTitle = "Test Issue";
  
  // Act: Execute the function being tested
  const issue = await createIssue(projectId, {
    title: expectedTitle,
    description: "Test description"
  });
  
  // Assert: Verify the results
  assertEquals(issue.title, expectedTitle);
  assertExists(issue.id);
});
```

### Mocking

Use Deno's testing utilities for mocking:

```typescript
import { stub } from "https://deno.land/std@0.208.0/testing/mock.ts";

Deno.test("with mock", async () => {
  // Mock fetch
  const fetchStub = stub(
    globalThis,
    "fetch",
    () => Promise.resolve(new Response(JSON.stringify({ id: 1 })))
  );
  
  try {
    // Test code using fetch
    const result = await someFunction();
    assertEquals(result.id, 1);
  } finally {
    fetchStub.restore();
  }
});
```

## Environment Setup

### Required Environment Variables

```bash
# GitLab token for testing (use a dedicated test token)
export GITLAB_TOKEN='glpat-test-token'

# Optional: Use test GitLab instance
export GITLAB_BASE_URL='https://gitlab-test.example.com/api/v4'
```

### Test Configuration

Create a `.env.test` file (not committed):

```bash
GITLAB_TOKEN=glpat-test-token
GITLAB_BASE_URL=https://gitlab-test.example.com/api/v4
GITXAB_DEBUG=0
```

Load in tests:

```typescript
import "https://deno.land/std@0.208.0/dotenv/load.ts";
```

## CI/CD Integration

### GitHub Actions

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: denoland/setup-deno@v1
        with:
          deno-version: v1.x
      
      - name: Run tests
        env:
          GITLAB_TOKEN: ${{ secrets.GITLAB_TOKEN }}
        run: deno test --allow-env --allow-read --allow-net
      
      - name: Generate coverage
        run: |
          deno test --allow-env --allow-read --allow-net --coverage=coverage/
          deno coverage coverage/ --lcov > coverage/lcov.info
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
```

## Test Data

### Using Test Projects

For integration tests, use dedicated test projects:

```typescript
// Test project IDs (public projects or dedicated test projects)
const TEST_PROJECT_ID = 278964; // GitLab's own project
const TEST_ISSUE_IID = 1;
```

### Cleaning Up Test Data

Always clean up test data after tests:

```typescript
Deno.test("cleanup example", async () => {
  let createdIssueId: number | null = null;
  
  try {
    // Create test issue
    const issue = await createIssue(TEST_PROJECT_ID, {
      title: "Test Issue"
    });
    createdIssueId = issue.id;
    
    // Test operations...
  } finally {
    // Clean up
    if (createdIssueId) {
      await deleteIssue(TEST_PROJECT_ID, createdIssueId);
    }
  }
});
```

## Performance Testing

### Benchmarking

```typescript
Deno.bench("listProjects performance", async () => {
  await listProjects();
});
```

Run benchmarks:

```bash
deno bench --allow-env --allow-read --allow-net
```

### Response Time Assertions

```typescript
Deno.test("listProjects - should respond within 500ms", async () => {
  const start = Date.now();
  await listProjects();
  const duration = Date.now() - start;
  
  assertEquals(duration < 500, true, `Too slow: ${duration}ms`);
});
```

## Debugging Tests

### Enable Debug Logging

```bash
GITXAB_DEBUG=1 deno test --allow-env --allow-read --allow-net
```

### Inspect Mode

```bash
deno test --inspect-brk --allow-env --allow-read --allow-net tests/backend_test.ts
```

Then open Chrome DevTools: `chrome://inspect`

### Print Debugging

```typescript
Deno.test("debug example", async () => {
  const result = await someFunction();
  console.log("Result:", result); // Will show in test output
  assertEquals(result.value, expected);
});
```

## Best Practices

### DO
- Write descriptive test names
- Test one thing per test
- Use proper assertions
- Clean up test data
- Mock external dependencies
- Test error cases
- Keep tests fast
- Use setup/teardown appropriately

### DON'T
- Use production tokens in tests
- Commit test credentials
- Create tests with side effects
- Test implementation details
- Skip cleanup
- Write flaky tests
- Test third-party code
- Ignore test failures

## Common Issues

### Token Not Found

**Error:** `Unauthorized: GitLab token is missing`

**Solution:** Set `GITLAB_TOKEN` environment variable

### Rate Limiting

**Error:** `Rate limited`

**Solution:**
- Use dedicated test instance
- Implement test throttling
- Use mocks for unit tests

### Flaky Tests

**Causes:**
- Network issues
- Race conditions
- Timing dependencies
- Shared test data

**Solutions:**
- Add retries for network tests
- Use proper async/await
- Avoid timing-dependent assertions
- Use unique test data

## Test Coverage Goals

- **Overall:** > 80%
- **Backend API Client:** > 90%
- **Cache Manager:** > 95%
- **Authentication:** > 90%
- **Denops Plugin:** > 70% (harder to test)

Check coverage:

```bash
deno test --allow-env --allow-read --allow-net --coverage=coverage/
deno coverage coverage/
```

## Resources

- [Deno Testing Documentation](https://deno.land/manual/testing)
- [Deno Standard Library Testing](https://deno.land/std/testing)
- [GitLab API Documentation](https://docs.gitlab.com/ee/api/)
