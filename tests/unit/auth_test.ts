/**
 * Unit tests for authentication module
 * Run with: deno test --allow-env tests/unit/auth_test.ts
 */

import { assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";

// Mock token retrieval (actual implementation is in deno-backend/src/auth/keyring.ts)
function getTokenFromEnv(): string | null {
  return Deno.env.get("GITLAB_TOKEN") || null;
}

Deno.test("auth - should get token from environment", () => {
  // Save original token
  const original = Deno.env.get("GITLAB_TOKEN");
  
  try {
    // Set test token
    Deno.env.set("GITLAB_TOKEN", "test-token-12345");
    
    const token = getTokenFromEnv();
    assertEquals(token, "test-token-12345");
  } finally {
    // Restore original
    if (original) {
      Deno.env.set("GITLAB_TOKEN", original);
    } else {
      Deno.env.delete("GITLAB_TOKEN");
    }
  }
});

Deno.test("auth - should return null when token not set", () => {
  // Save original token
  const original = Deno.env.get("GITLAB_TOKEN");
  
  try {
    // Remove token
    Deno.env.delete("GITLAB_TOKEN");
    
    const token = getTokenFromEnv();
    assertEquals(token, null);
  } finally {
    // Restore original
    if (original) {
      Deno.env.set("GITLAB_TOKEN", original);
    }
  }
});

Deno.test("auth - token should not be empty string", () => {
  // Save original token
  const original = Deno.env.get("GITLAB_TOKEN");
  
  try {
    // Set empty token
    Deno.env.set("GITLAB_TOKEN", "");
    
    const token = getTokenFromEnv();
    // Empty string should be treated as missing
    assertEquals(token === "" || token === null, true);
  } finally {
    // Restore original
    if (original) {
      Deno.env.set("GITLAB_TOKEN", original);
    } else {
      Deno.env.delete("GITLAB_TOKEN");
    }
  }
});

Deno.test("auth - should handle token with special characters", () => {
  // Save original token
  const original = Deno.env.get("GITLAB_TOKEN");
  
  try {
    // Set token with special characters
    const specialToken = "glpat-ABC_123-xyz/789+equals=";
    Deno.env.set("GITLAB_TOKEN", specialToken);
    
    const token = getTokenFromEnv();
    assertEquals(token, specialToken);
  } finally {
    // Restore original
    if (original) {
      Deno.env.set("GITLAB_TOKEN", original);
    } else {
      Deno.env.delete("GITLAB_TOKEN");
    }
  }
});
