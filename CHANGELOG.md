# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

#### Multi-Provider Support (GitHub + GitLab)

- **Unified Provider Interface** - Abstract provider interface for multiple Git
  hosting platforms
  - Common data models for repositories, issues, pull requests, comments,
    branches
  - Automatic provider detection from git remote URL
  - Provider-specific type converters
  - Provider factory with auto-configuration

- **GitHub Provider** - Full GitHub REST API v3 support
  - GitHub API client with retry logic and rate limit handling
  - All core operations: repositories, issues, PRs, comments, branches, diffs
  - Automatic authentication via GITHUB_TOKEN or GH_TOKEN environment variables
  - Custom base URL support for GitHub Enterprise

- **Configuration System** - Flexible provider configuration
  - Auto-detection from git remote URL (github.com, gitlab.com)
  - Auto-detection from environment tokens
  - Config file support (~/.config/gitxab/config.json)
  - Manual provider selection
  - Multi-provider token management

- **Provider Authentication** - Unified authentication system
  - Token resolution from environment variables
  - Token resolution from config file
  - Legacy GitLab token file support (backward compatibility)
  - Token format validation
  - Per-provider authentication headers

- **Vim/Neovim Integration** - Provider switching in editor
  - `:GitXabSetProvider github|gitlab` - Switch provider at runtime
  - `:GitXabShowProvider` - Display current provider and base URL
  - `g:gitxab_provider` - Set preferred provider in config
  - Auto-detection from git remote when in repository
  - Seamless provider switching without restart

- **Documentation** - Comprehensive multi-provider guides
  - Provider Guide (deno-backend/PROVIDER_GUIDE.md)
  - Provider Switching Guide (docs/PROVIDER_SWITCHING.md)
  - Updated README with GitHub/GitLab examples
  - Updated Vim help documentation (doc/gitxab.txt)
  - API examples for GitHub and GitLab
  - Configuration examples
  - Example scripts (deno-backend/examples/provider_example.ts)

#### Testing

- **Provider Tests** - 47 new unit tests for provider infrastructure
  - Provider configuration tests (29 tests)
  - GitHub API client tests (18 tests)
  - Auto-detection tests
  - Authentication tests
- **Test Results** - 93 tests passing (1 mock test skipped)
  - 7 mock tests for backend
  - 8 backend integration tests
  - 8 GitLab API contract tests
  - 14 denops integration tests
  - 4 authentication tests
  - 6 cache tests
  - 18 GitHub client tests
  - 29 provider configuration tests
  - All 78 tests passing (31 without external dependencies)

#### Architecture

- **New Modules** - 10 new TypeScript modules (2,337+ lines)
  - `deno-backend/src/providers/provider.ts` - Provider interface (296 lines)
  - `deno-backend/src/providers/github_provider.ts` - GitHub implementation (258
    lines)
  - `deno-backend/src/providers/github_converter.ts` - Type converter (244
    lines)
  - `deno-backend/src/providers/provider_factory.ts` - Factory pattern (188
    lines)
  - `deno-backend/src/services/github_client.ts` - GitHub API client (461 lines)
  - `deno-backend/src/models/github.ts` - GitHub types (356 lines)
  - `deno-backend/src/models/common.ts` - Unified models (185 lines)
  - `deno-backend/src/config/provider_config.ts` - Configuration (302 lines)
  - `deno-backend/src/auth/provider_auth.ts` - Authentication (218 lines)

### Changed

- **Backend Export** - Updated mod.ts to export multi-provider functionality
- **README** - Updated with GitHub support information
- **deno.json** - Added Deno namespace types for better TypeScript support

## [0.2.0] - 2025-11-24

### Added

#### Documentation

- **Comprehensive Documentation Suite** - Added detailed guides in `docs/`
  directory
  - Installation Guide - Step-by-step setup instructions for all package
    managers
  - Command Reference - Complete command documentation with examples
  - Configuration Guide - All configuration options and best practices
  - Architecture Guide - Technical architecture and design decisions
  - Security Guide - Token management, network security, and compliance
  - Performance Guide - Optimization techniques and benchmarking
  - Testing Guide - How to run and write tests

#### Testing Infrastructure

- **Test Organization** - Structured test suite with clear separation
  - Unit tests in `tests/unit/` (cache, authentication)
  - Integration tests in `tests/integration/`
  - Contract tests in `tests/contract/` (API schema validation)
  - Performance benchmarks in `tests/performance/`
  - Test documentation in `tests/README.md`
- **Contract Tests** - Verify GitLab API responses match expected schema
  - Project schema validation
  - Issue schema validation
  - MergeRequest schema validation
  - Error response validation
  - Pagination verification
  - Date format verification

#### CI/CD Enhancements

- **Comprehensive CI Pipeline** - Enhanced GitHub Actions workflow
  - Separate jobs for linting, unit tests, backend tests, integration tests
  - Test coverage reporting with Codecov integration
  - Docker image build and validation
  - Lua formatting checks with StyLua
  - Branch protection for development branch
  - Parallel test execution for faster feedback

#### Merge Request Management

- **MR List View** - Display all merge requests for a project with status icons
  (🟢 Opened, 🟣 Merged, 🔴 Closed)
- **MR Detail View** - View merge request details including title, description,
  branches, discussions
- **MR Diff View** - View file changes and diffs for merge requests
  - Display all changed files with status indicators
    (NEW/DELETED/RENAMED/MODIFIED)
  - Unified diff format with syntax highlighting
  - Line-by-line diff markers (+/-/@)
- **MR Creation** - Create new merge requests with editor-based form
  - Remote branch list display
  - Auto-detect default branch
  - Support for source/target branches, title, description, labels
  - Option to remove source branch after merge
- **MR Comments** - Add comments to merge requests using markdown editor
- **MR Discussion Replies** - Reply to existing discussion threads on merge
  requests
- Commands: `:GitXabMRs <project_id>`, `:GitXabCreateMR <project_id>`
- Keyboard shortcuts: `n` to create MR, `d` to view diffs, `c` to comment, `R`
  to reply to discussion

#### Issue Management Enhancements

- **Discussion Thread Replies** - Reply to specific discussion threads on issues
  (not just top-level comments)
- **Editor-based Comment Input** - Use temporary markdown file for composing
  long comments and replies
- **Issue Editing** - Edit issue title, description, labels, and state
  - Pre-filled forms with current values
  - Markdown editor for multi-line descriptions
- Command: `:GitXabCreateIssue <project_id>`

#### Project Management

- **Enhanced Project Menu** - Added options for MR viewing and creation
- Menu now includes:
  1. View Issues
  2. Create New Issue
  3. View Merge Requests
  4. Create New Merge Request

#### API & Backend

- Added `listBranches()` - Fetch repository branches from GitLab API
- Added `createMergeRequest()` - Create new merge requests
- Added `getMergeRequest()` - Fetch merge request details
- Added `getMergeRequestDiscussions()` - Fetch MR discussions
- Added `getMergeRequestChanges()` - Fetch MR changes and diffs
- Added `getMergeRequestDiffs()` - Fetch MR diff data
- Added `addNoteToMRDiscussion()` - Reply to MR discussion threads
- Added `createMRNote()` - Add comments to merge requests
- Added `createIssue()` - Create new issues
- Added `updateIssue()` - Update existing issues
- Added `getIssueDiscussions()` - Fetch issue discussions (replacing notes API)
- Added `addNoteToDiscussion()` - Reply to issue discussion threads

#### UI/UX Improvements

- **Context-sensitive Help** - Different help text for projects, issues, issue
  details, MRs, and MR details
- **Buffer Reuse** - Prevent duplicate windows when refreshing views
- **Form-based Editors** - Use temporary markdown files for complex input
  (descriptions, comments, replies)
- **Real-time Save** - Changes apply immediately when saving with `:w`
- **Status Icons** - Visual indicators for MR states (opened/merged/closed)
- **Branch Information** - Display source and target branches for each MR

### Changed

- Issue comment/reply workflow now uses editor-based temporary files instead of
  simple prompts
- Project menu expanded from 3 to 4 options
- Issue discussions now use GitLab Discussions API instead of Notes API for
  better threading support

### Fixed

- **MR List Navigation** - Fixed regex pattern for MR line matching to handle
  Unicode emoji properly
  - Changed from emoji character class pattern to simple `!<number>` pattern
  - Now correctly opens MR details when pressing Enter on any MR line

### Technical Improvements

- **Code Quality** - Clean codebase with no TODO/FIXME markers
- **Type Safety** - Full TypeScript coverage across frontend and backend
- **Performance** - ETag-based caching reduces API calls and improves response
  times
- **Security** - Token storage with file fallback (600 permissions)
- **Architecture** - Clear separation between denops plugin and backend library

### Project Status

- ✅ **Phase 1** (Setup) - Complete
- ✅ **Phase 2** (Foundational) - Complete
- ✅ **Phase 3** (Projects - MVP) - Complete
- ✅ **Phase 4** (Issues) - Complete
- ✅ **Phase 5** (Merge Requests) - Complete (except inline diff comments -
  future work)
- ✅ **Phase 6** (Polish) - Complete
  - Documentation complete
  - Testing infrastructure complete
  - CI/CD enhanced
  - Performance benchmarking added
  - Code cleanup complete
  - Release preparation complete

## [0.1.0] - Initial Release

### Added

- Project listing and search (`:GitXabProjects`)
- Issue listing with state filters (`:GitXabIssues <project_id> [state]`)
- Issue detail view with comments
- Basic comment posting on issues
- GitLab API client with ETag caching
- Denops.vim integration for direct in-process calls
- Keyboard shortcuts with built-in help (`?` key)
- Smart buffer reuse to prevent window clutter
- Configuration via environment variables or config file
- CLI tool for automation

[Unreleased]: https://github.com/your-org/gitxab.vim/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/your-org/gitxab.vim/releases/tag/v0.1.0
