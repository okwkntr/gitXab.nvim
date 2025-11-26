# Architecture

This document describes the technical architecture of GitXab.vim.

## Overview

GitXab.vim uses a modern, efficient architecture that leverages denops.vim for seamless TypeScript integration with Neovim.

```
┌─────────────────────────────────────────────────────────┐
│                        Neovim                           │
│  ┌──────────────────────────────────────────────────┐  │
│  │         User Commands & Key Mappings             │  │
│  └────────────────┬─────────────────────────────────┘  │
│                   │                                     │
│  ┌────────────────▼─────────────────────────────────┐  │
│  │           denops.vim (msgpack-rpc)               │  │
│  └────────────────┬─────────────────────────────────┘  │
└───────────────────┼─────────────────────────────────────┘
                    │
                    │ In-process function calls
                    │
┌───────────────────▼─────────────────────────────────────┐
│              Deno Process (denops plugin)               │
│  ┌──────────────────────────────────────────────────┐  │
│  │      denops/gitxab/main.ts (Frontend)            │  │
│  │  - Command registration                          │  │
│  │  - Buffer management                             │  │
│  │  - UI rendering                                  │  │
│  │  - User interaction handling                     │  │
│  └────────────────┬─────────────────────────────────┘  │
│                   │                                     │
│                   │ Direct function import              │
│                   │                                     │
│  ┌────────────────▼─────────────────────────────────┐  │
│  │     deno-backend/mod.ts (Backend Library)        │  │
│  │  - GitLab API client                             │  │
│  │  - Authentication management                     │  │
│  │  - ETag-based caching                            │  │
│  │  - Response parsing & error handling             │  │
│  └────────────────┬─────────────────────────────────┘  │
└───────────────────┼─────────────────────────────────────┘
                    │
                    │ HTTPS
                    │
┌───────────────────▼─────────────────────────────────────┐
│                   GitLab API v4                         │
└─────────────────────────────────────────────────────────┘
```

## Components

### 1. Frontend Layer (Denops Plugin)

**Location:** `denops/gitxab/main.ts`

**Responsibilities:**
- Register Neovim commands (`:GitXabProjects`, `:GitXabIssues`, etc.)
- Manage buffer lifecycle and content
- Render UI elements (lists, forms, diffs)
- Handle user interactions and keyboard shortcuts
- Coordinate with backend library

**Key Features:**
- Smart buffer reuse (no duplicate windows)
- Context-aware keyboard shortcuts
- Editor-based forms for long text input
- Real-time save with `:w` command
- Markdown syntax support

**Technology:**
- TypeScript/Deno
- denops.vim API for Neovim integration
- Direct import of backend library functions

### 2. Backend Layer (API Client Library)

**Location:** `deno-backend/mod.ts`

**Responsibilities:**
- GitLab REST API communication
- Authentication token management
- HTTP request/response handling
- ETag-based caching
- Error handling and retry logic
- Type definitions and interfaces

**Key Modules:**

#### `src/services/gitlab_client.ts`
Core API client implementing:
- `listProjects()` - Fetch and search projects
- `listIssues()` - Fetch project issues
- `getIssue()` - Fetch issue details
- `createIssue()` - Create new issues
- `updateIssue()` - Edit existing issues
- `getIssueDiscussions()` - Fetch issue discussions
- `addNoteToDiscussion()` - Reply to discussions
- `listMergeRequests()` - Fetch merge requests
- `getMergeRequest()` - Fetch MR details
- `createMergeRequest()` - Create new MRs
- `getMergeRequestDiscussions()` - Fetch MR discussions
- `getMergeRequestChanges()` - Fetch MR file changes
- `getMergeRequestDiffs()` - Fetch detailed diffs
- `listBranches()` - Fetch repository branches

#### `src/auth/keyring.ts`
Authentication management:
- Environment variable token storage
- Configuration file fallback (future)
- OS keyring integration (future)

#### `src/cache/cache_manager.ts`
ETag-based HTTP caching:
- Stores response ETags
- Validates cache on requests
- Refreshes stale entries
- Reduces API rate limit usage

**Technology:**
- TypeScript/Deno
- Native Deno HTTP client
- JSON serialization/deserialization

### 3. Communication Layer

**denops.vim** automatically manages:
- Neovim ↔ Deno process communication via msgpack-rpc
- Process lifecycle (auto-start/stop)
- Message serialization
- Error propagation

**Benefits:**
- Zero configuration required from users
- No separate server to manage
- Efficient binary protocol
- Automatic error handling

### 4. CLI Tool (Optional)

**Location:** `deno-backend/cli.ts`

Provides command-line interface for automation and debugging:

```bash
deno run -A deno-backend/cli.ts list-projects
deno run -A deno-backend/cli.ts get-issue <project_id> <issue_id>
deno run -A deno-backend/cli.ts list-mrs <project_id>
```

**Features:**
- JSON output to stdout
- Uses same backend library as plugin
- Suitable for CI/CD pipelines
- Debugging and testing

## Data Flow

### Example: Viewing an Issue

```
1. User runs :GitXabIssues 123
   │
   ▼
2. Neovim calls denops function via msgpack-rpc
   │
   ▼
3. denops/gitxab/main.ts:listIssues()
   │
   ▼
4. Imports and calls deno-backend/mod.ts:listIssues()
   │
   ▼
5. gitlab_client.ts makes HTTPS GET request
   │
   ▼
6. Check cache_manager for ETag
   │
   ▼
7. GitLab API returns response (200 or 304)
   │
   ▼
8. Parse response, update cache
   │
   ▼
9. Return typed Issue[] to frontend
   │
   ▼
10. Frontend renders issues in Neovim buffer
   │
   ▼
11. User sees issue list with keyboard shortcuts
```

### Example: Creating an Issue

```
1. User runs :GitXabCreateIssue 123
   │
   ▼
2. Frontend creates temporary markdown buffer
   │
   ▼
3. User fills form (title, description, labels)
   │
   ▼
4. User saves with :w
   │
   ▼
5. Frontend reads buffer content
   │
   ▼
6. Parses form fields
   │
   ▼
7. Calls deno-backend/mod.ts:createIssue()
   │
   ▼
8. Backend makes POST request to GitLab API
   │
   ▼
9. GitLab returns created issue
   │
   ▼
10. Frontend shows success message
   │
   ▼
11. Invalidates cache for issue list
```

## Technology Stack

### Frontend
- **Language:** TypeScript 5.x
- **Runtime:** Deno 1.x
- **Framework:** denops.vim 5.x+
- **Editor:** Neovim 0.7+

### Backend
- **Language:** TypeScript 5.x
- **Runtime:** Deno 1.x
- **HTTP Client:** Native Deno fetch API
- **Caching:** In-memory with ETag support

### Communication
- **Protocol:** msgpack-rpc (automatic via denops.vim)
- **Transport:** stdio (denops manages process)

## Design Principles

### 1. Simplicity
- No separate server process to manage
- Single Deno process managed by denops
- Direct function imports (no IPC overhead)
- Minimal configuration required

### 2. Performance
- ETag-based caching reduces API calls
- Smart buffer reuse eliminates duplicates
- Async/await for non-blocking operations
- Efficient msgpack protocol

### 3. Type Safety
- Full TypeScript throughout stack
- Strongly typed API responses
- Compile-time error checking
- IntelliSense support for development

### 4. Maintainability
- Shared backend library (plugin + CLI)
- Clear separation of concerns
- Modular architecture
- Comprehensive type definitions

### 5. User Experience
- Vim-native keyboard shortcuts
- Context-aware help (`?` key)
- Editor-based forms for long text
- Real-time feedback and validation

## Comparison with Alternative Architectures

### Phase 1: Direct Integration (Current)

**Pros:**
- Simple deployment (no separate server)
- Automatic lifecycle management
- Zero configuration overhead
- Best performance (no IPC)

**Cons:**
- Requires denops.vim
- Requires Neovim 0.7+

### Phase 2: IPC Server (Legacy/Optional)

**Pros:**
- Can work with older Vim versions
- Separate process lifecycle control
- Shared server for multiple clients

**Cons:**
- More complex deployment
- Requires manual server management
- IPC overhead
- More configuration required

**Implementation:** `deno-backend/src/server.ts` + `lua/gitxab/ipc.lua`

## Security Considerations

### Authentication
- Tokens stored in environment variables (recommended)
- Configuration file support (future)
- OS keyring integration (future)
- Never log or expose tokens

### Network Security
- All API calls use HTTPS
- SSL/TLS certificate verification
- Support for custom CA certificates

### Data Privacy
- No telemetry or analytics
- No data sent to third parties
- Cache stored in memory only
- Tokens never written to disk (current)

## Performance Characteristics

### Latency
- Command execution: < 100ms (cached)
- API request: 200-500ms (network dependent)
- Buffer rendering: < 50ms
- Target: < 500ms total for any operation

### Memory Usage
- Base: ~50MB (Deno process)
- Per buffer: ~1-5MB
- Cache: ~10MB (typical)
- Target: < 512MB total

### Rate Limiting
- GitLab.com: 2000 requests/minute
- Self-hosted: Configurable
- Caching significantly reduces requests
- ETag validation doesn't count as new request

## Future Enhancements

### Planned Features
1. **OS Keyring Integration**
   - Secure token storage
   - Cross-platform support
   - Automatic token refresh

2. **Configuration File**
   - JSON-based configuration
   - Per-project overrides
   - Theme customization

3. **Enhanced Caching**
   - Persistent cache (disk)
   - Configurable TTL
   - Cache statistics

4. **Offline Mode**
   - Work with cached data
   - Queue operations
   - Sync when online

5. **GitHub Support**
   - Unified interface
   - Provider abstraction
   - Shared UI components

## Testing Strategy

### Unit Tests
- Backend API client functions
- Cache manager logic
- Authentication handling
- Response parsing

### Integration Tests
- Denops command execution
- Buffer management
- UI rendering
- Error handling

### End-to-End Tests
- Complete user workflows
- GitLab API integration
- Performance benchmarks
- Error scenarios

**Test Runner:** `deno test`
**Location:** `tests/` directory
