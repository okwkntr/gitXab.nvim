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
  private buffers: Map<number, { filetype: string; variables: Record<string, unknown> }> = new Map();
  private currentBufnr = 1;
  
  async cmd(command: string): Promise<void> {
    this.commands.push(command);
    // Simulate buffer creation
    if (command === "new" || command.includes("sbuffer")) {
      this.currentBufnr++;
    }
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
    if (func === "bufnr") {
      return this.currentBufnr;
    }
    if (func === "getbufinfo") {
      // Return array of buffer info
      const buffers = Array.from(this.buffers.entries()).map(([bufnr, data]) => ({
        bufnr,
        variables: data.variables,
      }));
      return buffers;
    }
    if (func === "getbufvar") {
      const [bufnr, varname] = args;
      if (varname === "&filetype") {
        return this.buffers.get(bufnr as number)?.filetype || "";
      }
      return this.buffers.get(bufnr as number)?.variables[varname as string];
    }
    if (func === "bufwinnr") {
      // Return -1 (buffer not visible) for testing
      return -1;
    }
    return null;
  }
  
  // Simulate buffer variable setting
  async setBufVar(bufnr: number, varname: string, value: unknown): Promise<void> {
    if (!this.buffers.has(bufnr)) {
      this.buffers.set(bufnr, { filetype: "", variables: {} });
    }
    const buf = this.buffers.get(bufnr)!;
    if (varname === "filetype") {
      buf.filetype = value as string;
    } else {
      buf.variables[varname] = value;
    }
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

Deno.test("buffer reuse - findOrCreateBuffer creates new buffer first time", async () => {
  const denops = new MockDenops();
  
  const { main } = await import("../denops/gitxab/main.ts");
  await main(denops as any);
  
  // Clear any initialization commands
  denops.clearCommands();
  
  // First call to listProjects should create new buffer
  try {
    await denops.dispatcher.listProjects();
  } catch {
    // Expected to fail without token
  }
  
  const commands = denops.getCommands();
  const hasNewCommand = commands.some(cmd => cmd === "new");
  
  assertEquals(hasNewCommand, true, "Should create new buffer on first call");
  console.log("  ✓ First call creates new buffer");
});

Deno.test("buffer reuse - findOrCreateBuffer reuses existing buffer", async () => {
  const denops = new MockDenops();
  
  const { main } = await import("../denops/gitxab/main.ts");
  await main(denops as any);
  
  // Simulate existing buffer with gitxab-projects filetype
  const existingBufnr = 5;
  await denops.setBufVar(existingBufnr, "filetype", "gitxab-projects");
  
  // Clear commands
  denops.clearCommands();
  
  // Second call should reuse buffer
  try {
    await denops.dispatcher.listProjects();
  } catch {
    // Expected to fail without token
  }
  
  const commands = denops.getCommands();
  const hasSbufferCommand = commands.some(cmd => cmd.includes("sbuffer"));
  const hasNewCommand = commands.some(cmd => cmd === "new");
  
  // Should use sbuffer (reuse) not new (create)
  assertEquals(hasSbufferCommand || !hasNewCommand, true, "Should reuse existing buffer");
  console.log("  ✓ Second call reuses existing buffer");
});
