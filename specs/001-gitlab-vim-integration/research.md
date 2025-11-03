# research.md

**Feature**: GitLab Vim Integration  
**Path**: /home/kentarou/work/vim/gitXab.vim/specs/001-gitlab-vim-integration/research.md  
**Date**: 2025-11-03

## Unknowns / NEEDS_CLARIFICATION

1. Message Protocol wire format and framing for JSON over sockets (newline-delimited JSON vs length-prefixed).
2. Authentication token storage strategy (system keyring vs file encrypted vs user-managed env var).
3. Preferred IPC transport on target platforms (Unix Domain Socket vs TCP) and Windows support plan.
4. Cache invalidation strategy for API resources (staleness windows, ETag usage).
5. Diff rendering approach for MR diffs (use backend to produce line-based hunks vs raw diff delivered).

## Research Tasks

- Research 1: "JSON-over-IPC framing: newline-delimited vs length-prefixed"  
- Research 2: "Token storage best practices for CLI tools and editor plugins"  
- Research 3: "IPC choices for Neovim plugins cross-platform (UDS vs TCP)"  
- Research 4: "Caching strategies for GitLab API (ETag, If-Modified-Since)"  
- Research 5: "Diff rendering techniques for terminal editors (syntax-aware, hunk-based)"

## Decisions (provisional)

- Decision: Use newline-delimited JSON (NDJSON) with optional length-prefixed variant for binary safety.  
  - Rationale: Simpler to implement in Lua and Deno; easy to stream. If binary payloads required, switch to length-prefix.
  - Alternatives considered: length-prefixed framing (more robust but more complex in Lua).

- Decision: Store PAT (Personal Access Token) in OS keyring where available (libsecret on Linux, Keychain on macOS) with fallback to `$XDG_CONFIG_HOME/gitxab/token` encrypted by user-provided passphrase.
  - Rationale: Balances security and UX; avoids plaintext config by default.

- Decision: Primary transport Unix Domain Socket; fallback to localhost TCP when UDS unavailable (Windows WSL/Native Windows will use TCP).  
  - Rationale: UDS provides lower latency and avoids network exposure; TCP fallback ensures cross-platform operability.

- Decision: Backend will support ETag and If-Modified-Since to minimize data transfer; client honors 304 responses and updates cache accordingly.
  - Rationale: Standard HTTP caching semantics supported by GitLab.

- Decision: Backend will produce structured diff hunks (JSON) and frontend will render them with syntax-aware highlighting when possible.
  - Rationale: Offloading parsing to backend avoids complex Lua parsing and keeps frontend lightweight.

## Actionable outcomes

- Implement NDJSON message parsing helpers in both Lua and Deno.
- Implement keyring integration library usage in Deno (or small helper binary) and fallback file storage with clear UX.
- Define protocol doc `/specs/.../contracts/ipc-protocol.md` (Phase 1).


**End of research.md**
