# Tasks: GitHub Provider Support (002-github-provider-support)

**Input**: Design documents from `/specs/002-github-provider-support/`
**Prerequisites**: `spec.md`, `plan.md` **Target Version**: v0.3.0

## Phase 1: 基盤整備 (Infrastructure)

**Purpose**: プロバイダー抽象化層とデータモデルの統一

- [ ] T101 [P] Define Provider interface in
      `deno-backend/src/providers/provider.ts`
  - Repository, Issue, PullRequest, Comment, Branch, Diff operations
  - Generic type signatures for GitLab and GitHub compatibility

- [ ] T102 [P] Create unified data models in `deno-backend/src/models/common.ts`
  - Repository, Issue, PullRequest, Comment, User, Branch types
  - Converters from provider-specific to unified models

- [ ] T103 [P] Create GitHub-specific types in
      `deno-backend/src/models/github.ts`
  - GitHub API response types
  - Type definitions matching GitHub REST API v3

- [ ] T104 Implement provider detection logic in
      `deno-backend/src/config/provider_config.ts`
  - Auto-detect from git remote URL
  - Auto-detect from environment tokens
  - Manual provider selection

- [ ] T105 Implement provider configuration in
      `deno-backend/src/config/provider_config.ts`
  - Config file support (`~/.config/gitxab/config.json`)
  - Environment variable support
  - Default provider selection

- [ ] T106 Create provider authentication in
      `deno-backend/src/auth/provider_auth.ts`
  - Support GITHUB_TOKEN environment variable
  - Support GITLAB_TOKEN environment variable
  - Fallback to config file

---

## Phase 2: GitHub API実装 (GitHub Client)

**Purpose**: GitHub REST API v3クライアントの完全実装

- [ ] T107 [P] Implement GitHub API client skeleton in
      `deno-backend/src/services/github_client.ts`
  - Base URL configuration (https://api.github.com)
  - Authentication header (Bearer token)
  - Error handling and response parsing
  - Rate limit header monitoring (X-RateLimit-*)

- [ ] T108 [P] Implement GitHub repository operations
  - `listRepositories()` - GET /user/repos
  - `getRepository()` - GET /repos/{owner}/{repo}
  - Support for organization repositories
  - Search functionality

- [ ] T109 [P] Implement GitHub issue operations
  - `listIssues()` - GET /repos/{owner}/{repo}/issues
  - `getIssue()` - GET /repos/{owner}/{repo}/issues/{number}
  - `createIssue()` - POST /repos/{owner}/{repo}/issues
  - `updateIssue()` - PATCH /repos/{owner}/{repo}/issues/{number}
  - State filter (open, closed, all)

- [ ] T110 [P] Implement GitHub pull request operations
  - `listPullRequests()` - GET /repos/{owner}/{repo}/pulls
  - `getPullRequest()` - GET /repos/{owner}/{repo}/pulls/{number}
  - `createPullRequest()` - POST /repos/{owner}/{repo}/pulls
  - State filter and draft support

- [ ] T111 [P] Implement GitHub comment operations
  - `getIssueComments()` - GET /repos/{owner}/{repo}/issues/{number}/comments
  - `createIssueComment()` - POST /repos/{owner}/{repo}/issues/{number}/comments
  - Support for both issues and pull requests

- [ ] T112 [P] Implement GitHub diff and branch operations
  - `listBranches()` - GET /repos/{owner}/{repo}/branches
  - `getPullRequestFiles()` - GET /repos/{owner}/{repo}/pulls/{number}/files
  - `getPullRequestDiff()` - GET with Accept: application/vnd.github.v3.diff
  - Parse unified diff format

---

## Phase 3: Provider統合 (Provider Integration)

**Purpose**: GitLabとGitHubをProviderインターフェースで統合

- [ ] T113 [P] Implement GitLabProvider in
      `deno-backend/src/providers/gitlab_provider.ts`
  - Wrap existing gitlab_client.ts functions
  - Convert GitLab-specific types to unified models
  - Implement Provider interface
  - Handle Project ID (number) to unified Repository ID

- [ ] T114 [P] Implement GitHubProvider in
      `deno-backend/src/providers/github_provider.ts`
  - Wrap github_client.ts functions
  - Convert GitHub-specific types to unified models
  - Implement Provider interface
  - Handle owner/repo format to unified Repository ID

- [ ] T115 Implement ProviderFactory in
      `deno-backend/src/providers/provider_factory.ts`
  - Create provider based on configuration
  - Auto-detection logic integration
  - Provider switching capability
  - Singleton pattern for provider instances

- [ ] T116 Extend cache manager for multi-provider support in
      `deno-backend/src/cache/cache_manager.ts`
  - Provider-aware cache keys (`${provider}:${endpoint}`)
  - Separate cache namespaces per provider
  - ETag support for both GitLab and GitHub

- [ ] T117 Update main export in `deno-backend/mod.ts`
  - Export Provider types and interfaces
  - Export unified data models
  - Export provider factory
  - Maintain backward compatibility with existing exports

---

## Phase 4: UI統合 (UI Integration)

**Purpose**: Denopsプラグインでのプロバイダー切り替えとUX統一

- [ ] T118 Update denops main entry in `denops/gitxab/main.ts`
  - Integrate ProviderFactory
  - Add provider detection on plugin load
  - Store current provider in plugin state

- [ ] T119 Implement provider switching commands
  - `:GitXabProvider github` - Switch to GitHub
  - `:GitXabProvider gitlab` - Switch to GitLab
  - `:GitXabProvider auto` - Auto-detect from git remote
  - Display current provider in status

- [ ] T120 [P] Update UI buffers to show provider information
  - Add provider badge to repository list ([GitHub] / [GitLab])
  - Show provider in buffer title (e.g., "GitXab: Repositories (GitHub)")
  - Update help text with provider-specific shortcuts
  - Maintain consistent UI across providers

---

## Phase 5: テストと文書化 (Testing & Documentation)

**Purpose**: 完全なテストカバレッジとドキュメント更新

- [ ] T121 [P] Write unit tests for GitHub API client
  - Test all github_client.ts functions
  - Mock GitHub API responses
  - Test error handling and rate limits
  - Location: `tests/unit/github_client_test.ts`

- [ ] T122 [P] Write integration tests for provider abstraction
  - Test GitLabProvider implementation
  - Test GitHubProvider implementation
  - Test provider switching
  - Test data model conversion
  - Location: `tests/integration/provider_test.ts`

- [ ] T123 Write contract tests for GitHub API
  - Validate GitHub API response schemas
  - Test against real GitHub API (with test token)
  - Verify pagination and rate limits
  - Location: `tests/contract/github_api_test.ts`

- [ ] T124 Write E2E tests for GitHub workflows
  - Complete workflow: list repos → view issues → create issue
  - Complete workflow: list PRs → view diff → add comment
  - Test provider switching in real usage
  - Location: `specs/002-github-provider-support/tests/e2e_github.md`

- [ ] T125 [P] Update documentation
  - Update `docs/installation.md` with GITHUB_TOKEN setup
  - Update `docs/configuration.md` with provider configuration
  - Update `docs/commands.md` with new provider commands
  - Update `docs/architecture.md` with provider layer
  - Add `docs/providers.md` with provider-specific details

- [ ] T126 Update CHANGELOG and prepare release
  - Add v0.3.0 section with GitHub support
  - Document breaking changes (if any)
  - Create RELEASE_NOTES for v0.3.0

---

## Dependencies & Execution Order

### Phase Dependencies

- Phase 1 → Phase 2, Phase 3 (基盤が必要)
- Phase 2 → Phase 3 (GitHub APIが必要)
- Phase 3 → Phase 4 (Provider実装が必要)
- Phase 4 → Phase 5 (UI完成が必要)

### Task Dependencies

- T102 (統一モデル) → T103 (GitHub型)
- T107 (GitHub client基盤) → T108-T112 (各API)
- T108-T112 (GitHub API) → T114 (GitHubProvider)
- T113, T114 (両Provider) → T115 (Factory)
- T115 (Factory) → T118 (UI統合)

## Parallel Opportunities

### Phase 1

- T101, T102, T103 並列実行可能（型定義）
- T104, T105, T106 並列実行可能（設定・検出）

### Phase 2

- T108-T112 並列実行可能（各API独立）

### Phase 3

- T113, T114 並列実行可能（Provider実装）

### Phase 5

- T121-T124 並列実行可能（テスト）

## Implementation Strategy (MVP first)

1. **Phase 1完了** - 基盤整備（既存コードに影響なし）
2. **Phase 2完了** - GitHub API単体で動作確認
3. **Phase 3完了** - Provider抽象化でGitLab動作確認（回帰テストクリア）
4. **Phase 4完了** - UI統合でGitHub/GitLab切り替え動作
5. **Phase 5完了** - テストとドキュメント、v0.3.0リリース

## Task counts & mapping (summary)

- Total tasks: 26
- Tasks per phase:
  - Phase 1 (基盤整備): 6 (T101-T106)
  - Phase 2 (GitHub API): 6 (T107-T112)
  - Phase 3 (Provider統合): 5 (T113-T117)
  - Phase 4 (UI統合): 3 (T118-T120)
  - Phase 5 (テスト・文書化): 6 (T121-T126)

## Suggested MVP scope

- Phase 1-3完了: Provider抽象化とGitHub API実装
- 最小限のUI統合（T118のみ）で動作確認
- フルUI統合は後回し可能

## Success Criteria

- [ ] GitHub APIで全コア機能動作（リポジトリ、Issue、PR）
- [ ] GitLab機能が既存通り動作（回帰テストクリア）
- [ ] プロバイダー切り替えが正常動作
- [ ] テストカバレッジ > 80%
- [ ] ドキュメント完全更新
- [ ] パフォーマンス目標達成（< 500ms）
