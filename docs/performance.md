# Performance Guide

This document provides guidelines for performance optimization and monitoring in GitXab.vim.

## Performance Goals

### Latency Targets

| Operation | Target | Acceptable | Notes |
|-----------|--------|------------|-------|
| List projects | < 200ms | < 500ms | Cached after first load |
| List issues | < 300ms | < 500ms | Cached per project |
| Get issue detail | < 250ms | < 500ms | Includes comments |
| List MRs | < 300ms | < 500ms | Cached per project |
| Create issue/MR | < 1000ms | < 2000ms | Network write operation |
| View diff | < 500ms | < 1000ms | Large diffs may be slower |

### Memory Usage

- Base plugin: < 100MB
- Per buffer: < 5MB
- Cache: < 50MB (typical)
- Total target: < 512MB

## Running Benchmarks

### Basic Benchmarking

```bash
deno bench --allow-env --allow-read --allow-net tests/performance/
```

### With Profiling

```bash
deno bench --allow-env --allow-read --allow-net --v8-flags=--prof tests/performance/
```

### Compare Branches

```bash
# Benchmark current branch
deno bench --allow-env --allow-read --allow-net tests/performance/ > current.txt

# Switch to comparison branch
git checkout main
deno bench --allow-env --allow-read --allow-net tests/performance/ > main.txt

# Compare results
diff current.txt main.txt
```

## Performance Optimization Techniques

### 1. Caching Strategy

GitXab.vim uses ETag-based HTTP caching:

**How it works:**
1. First request stores response and ETag
2. Subsequent requests include If-None-Match header
3. Server returns 304 (Not Modified) if unchanged
4. Full response (200) only when data changed

**Implementation:**
```typescript
// deno-backend/src/cache/cache_manager.ts
const cache = new Map<string, CacheEntry>();

export async function fetchWithCache(url: string, options: RequestInit) {
  const cached = cache.get(url);
  
  if (cached?.etag) {
    options.headers = {
      ...options.headers,
      'If-None-Match': cached.etag,
    };
  }
  
  const response = await fetch(url, options);
  
  if (response.status === 304 && cached) {
    return new Response(JSON.stringify(cached.data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  // Store new response with ETag
  const etag = response.headers.get('ETag');
  if (etag) {
    const data = await response.json();
    cache.set(url, { data, etag });
  }
  
  return response;
}
```

**Benefits:**
- Reduced bandwidth usage
- Lower API rate limit consumption
- Faster response times (304 responses are quick)
- Automatic invalidation when data changes

### 2. Smart Buffer Management

**Buffer Reuse:**
```typescript
// denops/gitxab/main.ts
async function findOrCreateBuffer(denops: Denops, filetype: string) {
  // Check for existing buffer with same filetype
  const buffers = await fn.getbufinfo(denops) as BufferInfo[];
  
  for (const buf of buffers) {
    const ft = await fn.getbufvar(denops, buf.bufnr, "&filetype");
    if (ft === filetype && buf.listed) {
      return buf.bufnr;
    }
  }
  
  // Create new buffer if not found
  return await createNewBuffer(denops, filetype);
}
```

**Benefits:**
- No duplicate windows
- Reduced memory usage
- Better user experience
- Faster navigation

### 3. Lazy Loading

**Commands are lazy-loaded in plugin config:**
```lua
-- lazy.nvim config
{
  'gitxab.nvim',
  cmd = { 'GitXabProjects', 'GitXabIssues', 'GitXabMRs' },
  -- Plugin loads only when command is used
}
```

**Benefits:**
- Faster Neovim startup
- Reduced memory footprint when not in use
- denops starts on first command

### 4. Pagination

GitLab API uses pagination (default: 20 items/page):

```typescript
// Fetch with pagination
const params = {
  per_page: 20,
  page: 1,
};

// For large result sets, consider fetching multiple pages
async function* paginateResults(endpoint: string) {
  let page = 1;
  while (true) {
    const results = await fetch(endpoint + `?page=${page}&per_page=100`);
    if (results.length === 0) break;
    yield results;
    page++;
  }
}
```

**Current Implementation:**
- Fetches first page only (20 items)
- Good for most use cases
- Future: Add "Load More" functionality

### 5. Async Operations

All API calls use async/await:

```typescript
// Multiple independent requests in parallel
const [projects, issues, mrs] = await Promise.all([
  listProjects(),
  listIssues(projectId),
  listMergeRequests(projectId),
]);
```

**Benefits:**
- Non-blocking operations
- Parallel requests when possible
- Better responsiveness

## Monitoring Performance

### Enable Debug Logging

```bash
export GITXAB_DEBUG=1
nvim
```

Logs show:
- Request URLs
- Response times
- Cache hits/misses
- Token presence (not value)

### Measure Command Execution

```vim
" In Neovim
:let start = reltime()
:GitXabProjects
:echo reltimestr(reltime(start))
```

### Memory Profiling

```bash
# Start Neovim with memory logging
deno run --v8-flags=--prof --allow-env --allow-read --allow-net ...

# Analyze results
deno run --v8-flags=--prof-process isolate-*-v8.log
```

## Performance Issues and Solutions

### Issue: Slow Project Listing

**Symptoms:**
- First `:GitXabProjects` takes > 500ms
- Subsequent calls still slow

**Diagnosis:**
```bash
GITXAB_DEBUG=1 nvim
:GitXabProjects
# Check logs for response time
```

**Solutions:**
1. Check network latency to GitLab
2. Verify ETag caching is working
3. Reduce per_page if many projects
4. Use search to filter results

### Issue: High Memory Usage

**Symptoms:**
- Neovim becomes sluggish
- System memory exhausted

**Diagnosis:**
```vim
:echo luaeval('collectgarbage("count")')
```

**Solutions:**
1. Close unused buffers
2. Clear cache (restart denops)
3. Reduce number of open GitXab buffers
4. Check for memory leaks

### Issue: Rate Limiting

**Symptoms:**
- 429 errors from GitLab API
- "Rate limited" messages

**Diagnosis:**
Check GitLab rate limit status:
```bash
curl -H "Authorization: Bearer $GITLAB_TOKEN" \
  https://gitlab.com/api/v4/projects \
  -I | grep RateLimit
```

**Solutions:**
1. Wait for rate limit reset
2. Ensure caching is working
3. Reduce frequency of operations
4. Use dedicated token for plugin

### Issue: Slow Diff Rendering

**Symptoms:**
- `:GitXabMRs` diff view takes > 2s
- Large diffs hang Neovim

**Diagnosis:**
```vim
:profile start profile.log
:profile func *
:GitXabMRs 123
" View diff
:profile stop
:e profile.log
```

**Solutions:**
1. Limit diff size (future config option)
2. Use streaming for large diffs
3. Add pagination for files
4. Optimize rendering algorithm

## Optimization Checklist

### Before Release
- [ ] Run benchmarks on all major operations
- [ ] Verify cache is working correctly
- [ ] Test with slow network (throttling)
- [ ] Test with rate limiting
- [ ] Profile memory usage
- [ ] Check for memory leaks
- [ ] Test with large projects (1000+ issues)
- [ ] Test with large diffs (100+ files)
- [ ] Verify async operations don't block
- [ ] Check startup time impact

### Regular Monitoring
- [ ] Track API response times
- [ ] Monitor cache hit rate
- [ ] Check memory growth over time
- [ ] Review error logs
- [ ] User feedback on performance

## Future Optimizations

### Planned Improvements

1. **Persistent Cache**
   - Store cache on disk
   - Survive Neovim restarts
   - Configurable TTL

2. **Virtual Scrolling**
   - Render only visible items
   - Load more on scroll
   - Handle 1000+ items efficiently

3. **Request Batching**
   - Combine multiple API calls
   - Reduce round trips
   - Better use of rate limits

4. **Background Refresh**
   - Auto-refresh stale data
   - Notify on updates
   - Configurable intervals

5. **Compression**
   - Request gzip encoding
   - Reduce bandwidth
   - Faster transfers

6. **Connection Pooling**
   - Reuse HTTP connections
   - Reduce connection overhead
   - Better performance

## Performance Testing in CI

GitHub Actions includes performance regression detection:

```yaml
# .github/workflows/ci.yml
- name: Run benchmarks
  run: |
    deno bench --allow-env --allow-read --allow-net tests/performance/ \
      > bench-results.txt

- name: Compare with baseline
  run: |
    # Compare against main branch benchmarks
    # Fail if performance regression > 20%
```

## Resources

- [Deno Performance](https://deno.land/manual/runtime/performance)
- [V8 Profiling](https://v8.dev/docs/profile)
- [GitLab API Rate Limits](https://docs.gitlab.com/ee/user/gitlab_com/#gitlabcom-specific-rate-limits)
- [HTTP Caching with ETags](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/ETag)
