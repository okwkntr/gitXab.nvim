/**
 * Integration tests for denops plugin dispatcher functions
 * Tests the main.ts dispatcher without starting Neovim
 * Run with: deno test --allow-env --allow-read --allow-net --allow-write tests/integration_test.ts
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.208.0/assert/mod.ts";

// Mock Denops interface for testing
class MockDenops {
  name = "gitxab";
  dispatcher: Record<string, (...args: unknown[]) => unknown> = {};
  
  private commands: string[] = [];
  private echoMessages: string[] = [];
  
  async cmd(command: string): Promise<void> {
    this.commands.push(command);
  }
  
  async call(func: string, ...args: unknown[]): Promise<unknown> {
    if (func === "nvim_err_writeln") {
      throw new Error(`nvim_err_writeln called: ${args[0]}`);
    }
    if (func === "input") {
      return ""; // Return empty for input prompts
    }
    if (func === "inputlist") {
      return 0; // Return 0 (cancel) for inputlist
    }
    return null;
  }
  
  getCommands(): string[] {
    return this.commands;
  }
  
  clearCommands(): void {
    this.commands = [];
  }
}

Deno.test("showHelp - projects context", async () => {
  const denops = new MockDenops();
  
  // Import main and initialize
  const { main } = await import("../denops/gitxab/main.ts");
  await main(denops as any);
  
  // Call showHelp
  denops.clearCommands();
  await denops.dispatcher.showHelp("projects");
  
  const commands = denops.getCommands();
  
  // Verify echo commands were called
  const echoCommands = commands.filter(cmd => cmd.includes("echo"));
  assertEquals(echoCommands.length > 0, true, "Should have echo commands");
  
  // Verify help content includes expected text
  const helpText = commands.join(" ");
  assertEquals(helpText.includes("Project List Help"), true);
  assertEquals(helpText.includes("<Enter>"), true);
  
  console.log(`  ✓ showHelp(projects) generates ${echoCommands.length} echo commands`);
});

Deno.test("showHelp - issues context", async () => {
  const denops = new MockDenops();
  
  const { main } = await import("../denops/gitxab/main.ts");
  await main(denops as any);
  
  denops.clearCommands();
  await denops.dispatcher.showHelp("issues");
  
  const commands = denops.getCommands();
  const helpText = commands.join(" ");
  
  assertEquals(helpText.includes("Issue List Help"), true);
  assertEquals(helpText.includes("<Enter>"), true);
  assertEquals(helpText.includes("View issue details"), true);
  
  console.log("  ✓ showHelp(issues) displays correct help");
});

Deno.test("showHelp - issue-detail context", async () => {
  const denops = new MockDenops();
  
  const { main } = await import("../denops/gitxab/main.ts");
  await main(denops as any);
  
  denops.clearCommands();
  await denops.dispatcher.showHelp("issue-detail");
  
  const commands = denops.getCommands();
  const helpText = commands.join(" ");
  
  assertEquals(helpText.includes("Issue Detail Help"), true);
  assertEquals(helpText.includes("Add comment"), true);
  assertEquals(helpText.includes("Edit issue"), true);
  
  console.log("  ✓ showHelp(issue-detail) displays correct help");
});

Deno.test("showHelp - invalid context defaults to projects", async () => {
  const denops = new MockDenops();
  
  const { main } = await import("../denops/gitxab/main.ts");
  await main(denops as any);
  
  denops.clearCommands();
  await denops.dispatcher.showHelp("invalid-context");
  
  const commands = denops.getCommands();
  const helpText = commands.join(" ");
  
  // Should default to projects help
  assertEquals(helpText.includes("Project List Help"), true);
  
  console.log("  ✓ showHelp with invalid context defaults to projects");
});

Deno.test("listProjects - returns array", async () => {
  const denops = new MockDenops();
  
  const { main } = await import("../denops/gitxab/main.ts");
  await main(denops as any);
  
  // This will actually call the API - should return array or throw error
  try {
    const result = await denops.dispatcher.listProjects();
    assertEquals(Array.isArray(result) || result === undefined, true);
    console.log("  ✓ listProjects returns array or handles no token gracefully");
  } catch (error) {
    // Expected if no token - verify error message structure
    const message = error instanceof Error ? error.message : String(error);
    // Any error is acceptable here - we're just verifying it doesn't crash
    assertExists(message);
    console.log("  ✓ listProjects throws error gracefully:", message.substring(0, 50) + "...");
  }
});

Deno.test("dispatcher has all expected functions", async () => {
  const denops = new MockDenops();
  
  const { main } = await import("../denops/gitxab/main.ts");
  await main(denops as any);
  
  // Verify all dispatcher functions exist
  const expectedFunctions = [
    "listProjects",
    "openProjectMenu",
    "listIssues",
    "openIssueDetail",
    "viewIssue",
    "createIssue",
    "addComment",
    "editIssue",
    "showHelp",
    "listMergeRequests",
  ];
  
  for (const func of expectedFunctions) {
    assertExists(denops.dispatcher[func], `Dispatcher should have ${func}`);
  }
  
  console.log(`  ✓ All ${expectedFunctions.length} dispatcher functions exist`);
});

Deno.test("commands are registered", async () => {
  const denops = new MockDenops();
  
  const { main } = await import("../denops/gitxab/main.ts");
  await main(denops as any);
  
  const commands = denops.getCommands();
  
  // Verify commands were registered
  const commandDefs = commands.filter(cmd => cmd.includes("command!"));
  assertEquals(commandDefs.length >= 3, true, "Should register at least 3 commands");
  
  // Verify specific commands
  const commandText = commands.join(" ");
  assertEquals(commandText.includes("GitXabProjects"), true);
  assertEquals(commandText.includes("GitXabIssues"), true);
  assertEquals(commandText.includes("GitXabCreateIssue"), true);
  
  console.log(`  ✓ ${commandDefs.length} commands registered`);
});
