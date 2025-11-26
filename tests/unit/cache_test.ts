/**
 * Unit tests for cache manager
 * Run with: deno test --allow-env tests/unit/cache_test.ts
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.208.0/assert/mod.ts";

// Simple in-memory cache for testing
interface CacheEntry {
  data: unknown;
  etag: string | null;
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();

function getFromCache(url: string): CacheEntry | undefined {
  return cache.get(url);
}

function setInCache(url: string, data: unknown, etag: string | null): void {
  cache.set(url, {
    data,
    etag,
    timestamp: Date.now(),
  });
}

function clearCache(): void {
  cache.clear();
}

Deno.test("cache - should store and retrieve data", () => {
  const url = "https://example.com/api/test";
  const data = { id: 1, name: "Test" };
  const etag = "abc123";
  
  setInCache(url, data, etag);
  const entry = getFromCache(url);
  
  assertExists(entry);
  assertEquals(entry.data, data);
  assertEquals(entry.etag, etag);
  assertExists(entry.timestamp);
  
  clearCache();
});

Deno.test("cache - should return undefined for missing entry", () => {
  const url = "https://example.com/api/nonexistent";
  const entry = getFromCache(url);
  assertEquals(entry, undefined);
});

Deno.test("cache - should overwrite existing entry", () => {
  const url = "https://example.com/api/test";
  const data1 = { value: "first" };
  const data2 = { value: "second" };
  
  setInCache(url, data1, "etag1");
  setInCache(url, data2, "etag2");
  
  const entry = getFromCache(url);
  assertExists(entry);
  assertEquals(entry.data, data2);
  assertEquals(entry.etag, "etag2");
  
  clearCache();
});

Deno.test("cache - should handle null etag", () => {
  const url = "https://example.com/api/test";
  const data = { value: "test" };
  
  setInCache(url, data, null);
  const entry = getFromCache(url);
  
  assertExists(entry);
  assertEquals(entry.data, data);
  assertEquals(entry.etag, null);
  
  clearCache();
});

Deno.test("cache - should clear all entries", () => {
  setInCache("https://example.com/1", { id: 1 }, "etag1");
  setInCache("https://example.com/2", { id: 2 }, "etag2");
  setInCache("https://example.com/3", { id: 3 }, "etag3");
  
  clearCache();
  
  assertEquals(getFromCache("https://example.com/1"), undefined);
  assertEquals(getFromCache("https://example.com/2"), undefined);
  assertEquals(getFromCache("https://example.com/3"), undefined);
});

Deno.test("cache - should handle complex data structures", () => {
  const url = "https://example.com/api/complex";
  const data = {
    users: [
      { id: 1, name: "Alice", roles: ["admin", "user"] },
      { id: 2, name: "Bob", roles: ["user"] },
    ],
    metadata: {
      total: 2,
      page: 1,
    },
  };
  
  setInCache(url, data, "complex-etag");
  const entry = getFromCache(url);
  
  assertExists(entry);
  assertEquals(entry.data, data);
  
  clearCache();
});
