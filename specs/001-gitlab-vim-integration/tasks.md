# Tasks: GitLab Vim Integration (gitlab-vim-integration)

**Input**: Design documents from
`/home/kentarou/work/vim/gitXab.vim/specs/001-gitlab-vim-integration/`
**Prerequisites**: `plan.md`, `docs/spec.md` (feature stories inferred),
`data-model.md`, `contracts/`, `research.md`

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 [P] Create repository layout and directories (see plan) —
      `lua/gitxab/`, `deno-backend/`, `specs/001-gitlab-vim-integration/`
- [ ] T002 Initialize Deno project in `deno-backend/` (tsconfig, import_map,
      deps) — `deno-backend/`
- [ ] T003 Initialize Lua/Neovim plugin layout in `lua/gitxab/` and `plugin/`
      dev loader — `lua/gitxab/`, `plugin/`
- [ ] T004 [P] Add initial CI workflow skeleton (GitHub Actions) to run
      `deno test` and Lua unit tests — `.github/workflows/ci.yml`
- [ ] T005 [P] Add lint/format config: `deno fmt` and `deno lint` for backend;
      `stylua`/`luacheck` config for Lua — `deno-backend/`, `.stylua.toml`
- [ ] T006 Create initial Dockerfile for backend and development Docker Compose
      (optional) — `deno-backend/Dockerfile`, `docker-compose.yml`
- [x] T001 [P] Create repository layout and directories (see plan) —
      `lua/gitxab/`, `deno-backend/`, `specs/001-gitlab-vim-integration/`
- [x] T002 Initialize Deno project in `deno-backend/` (tsconfig, import_map,
      deps) — `deno-backend/`
- [x] T003 Initialize Lua/Neovim plugin layout in `lua/gitxab/` and `plugin/`
      dev loader — `lua/gitxab/`, `plugin/`
- [x] T004 [P] Add initial CI workflow skeleton (GitHub Actions) to run
      `deno test` and Lua unit tests — `.github/workflows/ci.yml`
- [x] T005 [P] Add lint/format config: `deno fmt` and `deno lint` for backend;
      `stylua`/`luacheck` config for Lua — `deno-backend/`, `.stylua.toml`
- [x] T006 Create initial Dockerfile for backend and development Docker Compose
      (optional) — `deno-backend/Dockerfile`, `docker-compose.yml`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infra that MUST be complete before user stories

- [x] T007 [P] Define IPC protocol document (NDJSON framing, commands, events) —
      `specs/001-gitlab-vim-integration/contracts/ipc-protocol.md`
- [x] T008 Implement minimal Deno backend server skeleton (IPC server, health
      endpoint) — `deno-backend/src/server.ts`
- [x] T009 Implement Lua IPC client skeleton (connect to UDS/TCP, NDJSON helper)
      — `lua/gitxab/ipc.lua`
- [x] T010 Implement authentication storage in backend (env + config file
      fallback) — `deno-backend/src/auth/keyring.ts`
- [x] T011 Implement cache manager in backend with ETag support —
      `deno-backend/src/cache/cache_manager.ts`
- [ ] T010 Implement authentication storage in backend (keyring integration +
      file fallback) — `deno-backend/src/auth/keyring.ts`
- [ ] T011 Implement cache manager in backend with ETag support —
      `deno-backend/src/cache/cache_manager.ts`
- [ ] T012 [P] Add test scaffolding: `deno test` setup and Lua unit test harness
      (headless nvim or busted-like) — `deno-backend/tests/`, `tests/lua/`
- [ ] T013 Create contract tests stub using
      `specs/001-gitlab-vim-integration/contracts/openapi.yaml` —
      `deno-backend/tests/contract/test_contracts.ts`

---

## Phase 3: User Story 1 - Project listing & search (Priority: P1) 🎯 MVP ✅

**Goal**:
ユーザーがNeovimからプロジェクトの一覧を検索・表示できる。MVPは一覧取得と検索（名前/説明）と簡易表示。

**Independent Test**: `deno-backend` が `/projects?q=...` を返し、Neovim の
`:GitXabProjects` コマンドが結果をバッファに表示すること（手順を
quickstart.mdに記載）。

**Status**: COMPLETED - Using Denops direct integration instead of IPC

- [x] T014 [P] [US1] Create `Project` entity/types in backend —
      `deno-backend/mod.ts`
- [x] T015 [P] [US1] Implement backend API `listProjects()` (connect to GitLab
      API, support `q` param) — `deno-backend/src/services/gitlab_client.ts`
- [x] T016 [US1] Implement backend tests for projects API —
      `tests/backend_test.ts`
- [x] T017 [US1] Implement Denops renderer for projects list buffer —
      `denops/gitxab/main.ts`
- [x] T018 [US1] Implement Neovim user command `:GitXabProjects` via Denops —
      `denops/gitxab/main.ts`
- [x] T019 [US1] Add integration tests for projects listing —
      `tests/integration_test.ts`
- [x] T020 [US1] Update `README.md` with example usage and token setup —
      `README.md`

---

## Phase 4: User Story 2 - Issue listing & detail (Priority: P1) ✅

**Goal**:
プロジェクトのIssue一覧を表示・検索、Issue詳細の表示とコメント投稿ができる。

**Independent Test**: Backend API functions work; Denops commands
`:GitXabIssues {project}` and issue detail buffer can display and post
comments/replies.

**Status**: COMPLETED - Includes creation, editing, commenting, and threaded
replies

- [x] T021 [P] [US2] Create `Issue` entity/types in backend —
      `deno-backend/mod.ts`
- [x] T022 [P] [US2] Implement backend API `listIssues()` (filter params: state)
      — `deno-backend/src/services/gitlab_client.ts`
- [x] T023 [US2] Implement backend API `getIssue()` —
      `deno-backend/src/services/gitlab_client.ts`
- [x] T024 [US2] Implement backend API `createIssueNote()` and `getIssueNotes()`
      — `deno-backend/src/services/gitlab_client.ts`
- [x] T024b [US2] Implement backend API `getIssueDiscussions()` and
      `addNoteToDiscussion()` for threaded replies —
      `deno-backend/src/services/gitlab_client.ts`
- [x] T024c [US2] Implement backend API `createIssue()` and `updateIssue()` for
      issue management — `deno-backend/src/services/gitlab_client.ts`
- [x] T025 [US2] Implement Denops issue list UI and navigation to issue detail
      buffer — `denops/gitxab/main.ts`
- [x] T026 [US2] Implement Denops UI for posting comments with editor
      integration — `denops/gitxab/main.ts`
- [x] T026b [US2] Implement Denops UI for replying to discussion threads —
      `denops/gitxab/main.ts`
- [x] T026c [US2] Implement Denops UI for creating and editing issues —
      `denops/gitxab/main.ts`
- [x] T027 [US2] Add backend and integration tests for issue APIs —
      `tests/backend_test.ts`, `tests/integration_test.ts`
- [x] T028 [US2] Document usage in README — `README.md`

---

## Phase 5: User Story 3 - Merge Requests & diffs (Priority: P2) ✅

**Goal**: MRの一覧表示、詳細表示、差分表示、差分へのコメントができる。

**Independent Test**: Backend exposes `/projects/{id}/merge_requests` and
`/projects/{id}/merge_requests/{iid}/diffs`; Lua can request diffs and render
hunks.

- [x] T029 [P] [US3] Implement MR list, detail, create via Denops API —
      `denops/gitxab/main.ts`, `deno-backend/src/services/gitlab_client.ts`
- [x] T029b [US3] Add MR status icons and interactive navigation —
      `denops/gitxab/main.ts:listMergeRequests()`
- [x] T030 [US3] Implement MR detail view with discussions —
      `denops/gitxab/main.ts:viewMergeRequest()`
- [x] T030b [US3] Add MR commenting and threaded replies —
      `denops/gitxab/main.ts:commentOnMR()`, `replyToMRComment()`
- [x] T030c [US3] Implement MR creation with form-based editor —
      `denops/gitxab/main.ts:createMergeRequest()`
- [x] T030d [US3] Add branch list display in MR creation form —
      `deno-backend/src/services/gitlab_client.ts:listBranches()`
- [x] T031 [US3] Implement MR diff viewing via GitLab API —
      `deno-backend/src/services/gitlab_client.ts:getMergeRequestChanges()`,
      `getMergeRequestDiffs()`
- [x] T032 [US3] Implement Denops diff renderer with unified diff format —
      `denops/gitxab/main.ts:viewMRDiffs()`
- [x] T033 [US3] Add file status indicators and syntax highlighting —
      Implemented with diff filetype and markers (NEW/DELETED/RENAMED/MODIFIED)
- [ ] T034 [US3] Implement inline diff comments via Denops UI — Future work
      (requires line-specific comment API integration)
- [x] T035 [US3] Add tests for MR endpoints — `tests/backend_test.ts` (Backend
      unit tests, integration tests)
- [x] T036 [US3] Add E2E recipe for MR diff viewing and commenting —
      `specs/001-gitlab-vim-integration/tests/e2e_mrs.md`

**STATUS**: COMPLETED - MR list/detail/create/comment/reply/diffs/tests
implemented. Only inline diff commenting remains as future work.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Documentation, CI, security, performance, and release prep

- [ ] T037 [P] Documentation: update `docs/` with installation, configuration,
      command reference — `docs/`
- [ ] T038 Code cleanup and refactor across `lua/gitxab/` and `deno-backend/`
- [ ] T039 [P] Add CI job to build Docker image and run integration tests —
      `.github/workflows/ci.yml`
- [ ] T040 Security: add secrets handling docs and ensure keyring fallback is
      secure — `docs/security.md`
- [ ] T041 Performance: add caching TTL tuning and measure latency for key flows
      — `deno-backend/src/cache/`
- [ ] T042 Release: prepare release notes and CHANGELOG entry — `CHANGELOG.md`

---

## Dependencies & Execution Order

- Setup (Phase 1) tasks T001..T006 can run immediately; many marked [P] and
  parallel.
- Foundational (Phase 2) tasks T007..T013 MUST complete before any User Story
  phases.
- User Story phases (Phase 3..5) depend on Foundational completion; each story
  is independently testable after that.

## Parallel Opportunities

- Setup tasks (T001, T002, T003, T004, T005, T006) are parallelizable.
- Foundational tasks T008 (Deno server) and T009 (Lua IPC client) can be worked
  on in parallel by different developers.
- Within each User Story, model and service tasks marked [P] can be implemented
  in parallel.

## Implementation Strategy (MVP first)

1. Complete Phase 1 (Setup) and Phase 2 (Foundational).
2. Implement User Story 1 (Projects) to produce MVP.
3. Validate MVP with the quickstart and E2E recipe.
4. Implement User Story 2 (Issues) and then User Story 3 (MRs) in that order.

---

## Task counts & mapping (summary)

- Total tasks: 42
- Tasks per story:
  - Setup/Foundational: 13 (T001..T013)
  - US1 (Projects): 7 (T014..T020)
  - US2 (Issues): 8 (T021..T028)
  - US3 (MRs/Diffs): 8 (T029..T036)
  - Polish/Cross-cutting: 6 (T037..T042)

## Suggested MVP scope

- Deliverables: Setup + Foundational + User Story 1 (T001..T020)
- Rationale: Projects listing/search delivers immediate visible value and
  enables iteration on other stories.

**File generated**:
`/home/kentarou/work/vim/gitXab.vim/specs/001-gitlab-vim-integration/tasks.md`
