# GitXab.vim

Neovim plugin for GitLab and GitHub integration - Access Git hosting platform features directly from your editor.

> **🎉 New: Multi-Provider Support!** GitXab now supports both GitLab and GitHub with a unified interface. The provider is automatically detected from your git remote URL.

## Features

- 🔍 **Project Management**
  - Project listing and search
  - Interactive project menu
  
- 📋 **Issue Management**
  - List, view, create, edit issues
  - Comment on issues with markdown support
  - Reply to discussion threads
  - Pre-filled edit forms with current values
  - Multi-line description editor
  
- 🔀 **Merge Request Management**
  - List and view merge requests
  - View file changes and diffs
  - Create new MRs with form-based editor
  - View remote branch list when creating MRs
  - Comment on MRs
  - Reply to MR discussion threads
  - Auto-detect default branch
  
- 🔄 **Smart UI/UX**
  - Smart buffer reuse - No duplicate windows on reload
  - Keyboard shortcuts with built-in help (`?` key)
  - Editor-based forms for long text input
  - Real-time save with `:w` command
  
- 🚀 **Architecture**
  - Powered by denops.vim - No separate server required
  - Direct in-process API calls
  - ETag caching support

## Supported Platforms

- ✅ **GitHub** - Full support with REST API v3
  - Repositories, Issues, Pull Requests
  - Comments, Branches, Diffs
  - Auto-detection from git remote
  - Rate limit handling and retries
  
- ✅ **GitLab** - Legacy API support
  - Projects, Issues, Merge Requests
  - Comments, Branches, Diffs
  - Will migrate to unified provider interface

## Architecture

- **Frontend**: Denops (TypeScript/Deno plugin for Neovim)
- **Backend**: Multi-provider API client (TypeScript/Deno)
  - Unified Provider interface for GitHub/GitLab
  - Auto-detection from git remote or environment
  - Extensible for future providers
- **Communication**: Direct in-process function calls via denops
- **CLI**: Command-line interface for automation and scripting

## Quick Start

### Prerequisites

- Neovim 0.7+ (with denops support)
- Deno 1.x
- Git
- GitHub or GitLab personal access token

### Installation

**Step 1: Install denops.vim**

GitXab.vim requires [denops.vim](https://github.com/vim-denops/denops.vim) to run.

**Using lazy.nvim** (recommended):

```lua
-- In your lazy.nvim config (~/.config/nvim/lua/plugins/gitxab.lua)
return {
  {
    'vim-denops/denops.vim',
    lazy = false,
  },
  {
    'your-org/gitxab.vim',
    dependencies = { 'vim-denops/denops.vim' },
    config = function()
      -- Provider is auto-detected from git remote
      -- Configure tokens as needed:
      
      -- For GitHub
      vim.env.GITHUB_TOKEN = 'ghp_your_github_token'
      
      -- For GitLab
      vim.env.GITLAB_TOKEN = 'glpat_your_gitlab_token'
      
      -- Optional: Custom base URLs for self-hosted instances
      -- vim.env.GITHUB_BASE_URL = 'https://github.example.com/api/v3'
      -- vim.env.GITLAB_BASE_URL = 'https://gitlab.example.com/api/v4'
    end,
    -- Load on command for faster startup
    cmd = { 'GitXabProjects', 'GitXabIssues', 'GitXabMRs', 'GitXabCreateIssue', 'GitXabCreateMR' },
  },
}
```

**Using packer.nvim**:

```lua
use {
  'vim-denops/denops.vim',
}

use {
  'your-org/gitxab.vim',
  requires = { 'vim-denops/denops.vim' },
  config = function()
    vim.env.GITLAB_TOKEN = 'your-gitlab-personal-access-token'
  end
}
```

**Manual installation**:

```bash
# Install denops.vim
mkdir -p ~/.local/share/nvim/site/pack/plugins/start
cd ~/.local/share/nvim/site/pack/plugins/start
git clone https://github.com/vim-denops/denops.vim.git

# Install gitxab.vim
git clone https://github.com/your-org/gitxab.vim.git
```

**Step 2: Install Deno**

Denops requires Deno runtime:

```bash
# Linux/macOS
curl -fsSL https://deno.land/install.sh | sh

# Add to your shell profile (~/.bashrc, ~/.zshrc, etc.)
export PATH="$HOME/.deno/bin:$PATH"
```

**Step 3: Configure Authentication**

GitXab automatically detects the provider from your git remote URL. Configure tokens as needed:

**Method 1: Environment variables** (recommended):

```bash
# For GitHub
export GITHUB_TOKEN="ghp_your_github_token"
# or
export GH_TOKEN="ghp_your_github_token"

# For GitLab
export GITLAB_TOKEN="glpat_your_gitlab_token"

# Optional: Custom base URLs for self-hosted instances
export GITHUB_BASE_URL="https://github.example.com/api/v3"
export GITLAB_BASE_URL="https://gitlab.example.com/api/v4"
```

**Method 2: Config file** (`~/.config/gitxab/config.json`):

```json
{
  "defaultProvider": "github",
  "providers": {
    "github": {
      "token": "ghp_your_github_token",
      "baseUrl": "https://api.github.com"
    },
    "gitlab": {
      "token": "glpat_your_gitlab_token",
      "baseUrl": "https://gitlab.com"
    }
  }
}
```

**Method 3: Neovim config** (in your `init.lua`):

```lua
-- Provider is auto-detected from git remote
vim.env.GITHUB_TOKEN = 'ghp_your_github_token'
vim.env.GITLAB_TOKEN = 'glpat_your_gitlab_token'
```

**Get personal access tokens:**

- **GitHub**: https://github.com/settings/tokens
  - Scopes: `repo`, `read:user`
  
- **GitLab**: https://gitlab.com/-/profile/personal_access_tokens
  - Scopes: `api`, `read_user`, `read_api`

### Usage

Once installed, you can use GitXab.vim commands directly in Neovim:

#### List Projects

```vim
:GitXabProjects
```

This will:
- Automatically start the Deno backend (via denops)
- Fetch projects from GitLab API
- Open a split window showing your projects

**Interactive Navigation:**
- Press `<Enter>` on any project to open a menu
- Select "View Issues" to see issues for that project
- Press `q` to close the buffer

Example output:
```
gitxab - Neovim GitLab plugin
my-project - My awesome project
team-repo - Team collaboration repository
```

#### List Issues

```vim
" List all issues for a project
:GitXabIssues <projectId>

" List only open issues
:GitXabIssues <projectId> opened

" List only closed issues
:GitXabIssues <projectId> closed

" List all issues (explicitly)
:GitXabIssues <projectId> all
```

Example output:
```
Project: #12345 (15 issues)
================================================================================

Open Issues:
--------------------------------------------------------------------------------
#42 Fix authentication bug [bug, priority:high] @username 2025/11/10
#38 Add dark mode support [enhancement] @designer 2025/11/08
#35 Update documentation [docs] unassigned 2025/11/05

Closed Issues:
--------------------------------------------------------------------------------
#40 Refactor database queries [refactor] @developer 2025/11/12
#37 Fix typo in README [docs] @contributor 2025/11/09
```

**Interactive Navigation:**
- Press `q` to close the buffer
- Press `r` to refresh the issue list
- Press `n` to create a new issue

To get the project ID:
1. Run `:GitXabProjects` and press `<Enter>` on any project
2. Or check the project's GitLab URL (the ID is visible in project settings)
3. Or use the GitLab API browser to find project IDs

#### Create Issue

```vim
" Create a new issue for a project
:GitXabCreateIssue <projectId>
```

This will interactively prompt you for:
- Issue title (required)
- Issue description (optional)
- Labels (comma-separated, optional)

You can also create an issue from:
- Project menu (`:GitXabProjects` → `<Enter>` → "Create New Issue")
- Issue list buffer (press `n`)

#### List Merge Requests

```vim
:GitXabMRs <projectId>
```

Example output:
```
GitLab Merge Requests - Project #12345
================================================================================

Total: 8 merge requests

🟢 !45 Add new authentication system [security, feature] @alice 2025/11/20
    feature/auth-v2 → main

🟢 !42 Fix database connection pool [bug, priority:high] @bob 2025/11/18
    hotfix/db-connection → main

🟣 !40 Update dependencies to latest versions [maintenance] @charlie 2025/11/15
    chore/update-deps → main

Keys: <Enter>=View  n=Create MR  r=Refresh  q=Close  ?=Help
```

**Interactive Navigation:**
- Press `<Enter>` on any MR to view details
- Press `n` to create a new merge request
- Press `r` to refresh the list
- Press `q` to close the buffer
- Press `?` to show help

**Status Icons:**
- 🟢 Opened
- 🟣 Merged
- 🔴 Closed

#### Create Merge Request

```vim
" Create a new merge request for a project
:GitXabCreateMR <projectId>
```

This opens an editor-based form with:
- **Remote branch list** - Shows available branches from GitLab
- **Default branch detection** - Automatically sets target branch
- **Form fields**:
  - `source_branch` (required) - Branch to merge FROM
  - `target_branch` (required) - Branch to merge INTO
  - `title` (required) - MR title
  - `description` (optional) - MR description (markdown supported)
  - `labels` (optional) - Comma-separated labels
  - `remove_source_branch` (optional) - Delete source branch after merge

Example form:
```markdown
" Available branches (15 total):
"   - main (default)
"   - develop
"   - feature/new-api
"   - feature/ui-improvements
"   - hotfix/critical-bug

## * Source Branch (your branch to merge FROM)
source_branch: feature/new-api

## * Target Branch (branch to merge INTO, usually 'main')
target_branch: main

## * Title
title: Add new API endpoints for user management

## Description (optional, markdown supported)
description: |
  This MR adds the following features:
  - User CRUD endpoints
  - Authentication middleware
  - Input validation

## Labels (optional, comma-separated)
labels: feature, api

## Remove Source Branch After Merge (optional, true/false)
remove_source_branch: true
```

**Usage:**
1. Fill in the form fields
2. Save with `:w` to create the MR
3. Close with `:q` after saving
4. Or cancel with `:q!` without saving

You can also create an MR from:
- Project menu (`:GitXabProjects` → `<Enter>` → "Create New Merge Request")
- MR list buffer (press `n`)

#### Keyboard Shortcuts

All keyboard shortcuts are displayed in the buffer header. Press `?` in any GitXab buffer to see context-sensitive help.

**Project List Buffer** (`:GitXabProjects`):
- `<Enter>` - Open project menu with options:
  - View Issues
  - Create New Issue
  - View Merge Requests
  - Create New Merge Request
- `q` - Close buffer
- `?` - Show help

**Issue List Buffer** (`:GitXabIssues`):
- `<Enter>` - View issue details and comments
- `q` - Close buffer
- `r` - Refresh issue list (reuses existing buffer)
- `n` - Create new issue
- `?` - Show help

**Issue Detail Buffer**:
- `c` - Add comment (opens markdown editor)
- `R` - Reply to a discussion thread (opens markdown editor)
- `e` - Edit issue (title/description/labels/state) with current values pre-filled
- `r` - Refresh issue view (reuses existing buffer)
- `q` - Close buffer
- `?` - Show help

**Merge Request List Buffer** (`:GitXabMRs`):
- `<Enter>` - View merge request details and discussions
- `n` - Create new merge request
- `r` - Refresh merge request list
- `q` - Close buffer
- `?` - Show help

**Merge Request Detail Buffer**:
- `d` - View diffs (changed files)
- `c` - Add comment to merge request (opens markdown editor)
- `R` - Reply to a discussion thread (opens markdown editor)
- `r` - Refresh merge request view
- `q` - Close buffer
- `?` - Show help

**Merge Request Diffs Buffer**:
- `q` - Close buffer
- `?` - Show help

**Adding Comments & Replies**:
Both commenting (`c`) and replying (`R`) use a markdown editor (temporary file):

1. **Add Comment (`c`)**:
   - Opens a markdown editor
   - Write your comment (multiple lines, markdown supported)
   - **Save with `:w`** to post the comment (immediately applied to GitLab)
   - You can save multiple times (each `:w` posts/updates)
   - Close with `:q` when done (temporary file is cleaned up automatically)
   - Or close with `:q!` without saving to keep the previous version

2. **Reply to Discussion (`R`)**:
   - Discussion threads are numbered `[1]`, `[2]`, `[3]`... in the issue detail view
   - Press `R` and enter the discussion number (e.g., `2`)
   - Opens a markdown editor with context (shows original discussion)
   - Write your reply (multiple lines, markdown supported)
   - **Save with `:w`** to post the reply (immediately applied to GitLab)
   - Close with `:q` when done (temporary file is cleaned up automatically)
   - Or close with `:q!` without saving to cancel
   - The reply will be added to the existing discussion thread

**Editing Issues**:
- **Title & Labels**: Current values are pre-filled in the input prompt
- **Description**: Opens in a markdown buffer editor (temporary file)
  1. Edit the description (supports multiple lines and markdown)
  2. Save with `:w` - changes are **immediately** applied to GitLab
  3. You can save multiple times (each `:w` updates GitLab)
  4. Close with `:q` when done (temporary file is cleaned up automatically)
  5. Or close with `:q!` without saving to keep the previous version

**Buffer Reuse**: When you press `r` (refresh) or re-run commands like `:GitXabIssues`, GitXab automatically reuses the existing buffer instead of creating a new window. This keeps your workspace clean and prevents window clutter.

#### Troubleshooting

**Plugin not loading:**
```vim
" Check if denops is running
:echo denops#server#status()

" Check if gitxab plugin is loaded
:echo denops#plugin#is_loaded('gitxab')
```

**No projects shown:**
```vim
" Check environment variables in Neovim
:lua print(vim.env.GITLAB_TOKEN)
:lua print(vim.env.GITLAB_BASE_URL)
```

**Denops startup issues:**
```vim
" Enable denops debug logging
:let g:denops#debug = 1

" Check denops log
:messages
```

**API connection errors:**
- Verify your GitLab token is valid
- Check network connectivity to GitLab
- For self-hosted GitLab, ensure `GITLAB_BASE_URL` is correct

**Enable debug logging:**
```vim
" Enable detailed debug logging
:let $GITXAB_DEBUG = "1"
:call denops#plugin#reload('gitxab')
:GitXabProjects

" Or set in init.lua before starting Neovim
vim.env.GITXAB_DEBUG = "1"
```

Debug logs will show:
- Buffer reuse logic: finding existing buffers, creating new ones
- Buffer operations: filetype checks, window switching
- Description editor: temp file paths, autocmd setup, save/update flow
- API requests: URL, token status, headers
- API responses: Status code, content type, body preview

**Buffer reuse issues:**
If windows keep splitting or buffers multiply:
1. Enable debug mode: `:let $GITXAB_DEBUG = "1"`
2. Run the command: `:GitXabProjects`
3. Check messages: `:messages`
4. Look for "findOrCreateBuffer" debug output
5. Verify buffer names: `:ls` (should show `GitXab://...` names)
6. Check filetype: `:set filetype?` (should be `gitxab-projects`, `gitxab-issues`, or `gitxab-issue`)

### Available Commands

**Provider Management:**
- `:GitXabSetProvider github|gitlab` - Switch provider
- `:GitXabShowProvider` - Show current provider and base URL

**Project/Repository Management:**
- `:GitXabProjects [search]` - List projects/repositories

**Issue/PR Management:**
- `:GitXabIssues <projectId> [state]` - List issues (state: opened/closed/all)
- `:GitXabCreateIssue <projectId>` - Create new issue
- `:GitXabMRs <projectId>` - List merge requests/pull requests
- `:GitXabCreateMR <projectId>` - Create new MR/PR

### CLI Usage

The backend provides a CLI for automation and scripting:

```bash
# Set GitLab credentials
export GITLAB_TOKEN="your-token"
export GITLAB_BASE_URL="https://gitlab.com/api/v4"

# List projects
deno run --allow-net --allow-read --allow-env deno-backend/cli.ts list-projects --q=search

# Get issue details
deno run --allow-net --allow-read --allow-env deno-backend/cli.ts get-issue --project 123 --iid 5

# List merge requests
deno run --allow-net --allow-read --allow-env deno-backend/cli.ts list-mrs --project 123

# Create merge request
deno run --allow-net --allow-read --allow-env deno-backend/cli.ts create-mr \
  --project 123 \
  --source feature/new-api \
  --target main \
  --title "Add new API endpoints"

# List branches
deno run --allow-net --allow-read --allow-env deno-backend/cli.ts list-branches --project 123
```

The CLI uses the same GitLab API client library as the Neovim plugin.

## Testing

### Run Automated Tests

**Backend API Tests**:
```bash
deno test --allow-net --allow-read --allow-env tests/backend_test.ts
```

**Integration Tests** (denops plugin functions):
```bash
deno test --allow-env --allow-read --allow-net --allow-write tests/integration_test.ts
```

Expected: All tests pass
- Backend tests: 4 tests (listProjects, listIssues with filters)
- Integration tests: 9 tests (dispatcher functions, buffer reuse, help system)

### Manual Testing

**Buffer Reuse Test** (verify windows don't multiply on reload):
```bash
./tests/test_buffer_reuse.sh
```

This interactive test helps verify that buffers are reused correctly and windows don't split on refresh. See `tests/TEST_BUFFER_REUSE.md` for detailed test procedures.

### Test with Real GitLab API

```bash
export GITLAB_BASE_URL="https://gitlab.com/api/v4"
export GITLAB_TOKEN="your-token"
deno run --allow-net --allow-read --allow-env deno-backend/cli.ts list-projects --q=test
```

## Configuration

### Provider Selection

GitXab automatically detects the provider from your git remote URL:
- `github.com` or `https://github.com/` → GitHub
- `gitlab.com` or `https://gitlab.com/` → GitLab
- Self-hosted URLs → Detected by domain

**Manual provider selection:**

```vim
" Set provider preference (before running commands)
:let g:gitxab_provider = 'github'  " or 'gitlab' or 'auto' (default)

" Switch provider at runtime
:GitXabSetProvider github
:GitXabSetProvider gitlab

" Check current provider
:GitXabShowProvider
```

**Example usage:**

```vim
" For a GitHub project
:let g:gitxab_provider = 'github'
:GitXabProjects  " Shows GitHub repositories

" Switch to GitLab
:GitXabSetProvider gitlab
:GitXabProjects  " Now shows GitLab projects
```

### Environment Variables

**GitHub:**
- `GITHUB_TOKEN` or `GH_TOKEN`: GitHub personal access token (required)
- `GITHUB_BASE_URL`: GitHub API base URL (default: `https://api.github.com`)

**GitLab:**
- `GITLAB_TOKEN`: GitLab personal access token (required)
- `GITLAB_BASE_URL`: GitLab API base URL (default: `https://gitlab.com/api/v4`)

### Token Storage

1. Environment variable: `GITHUB_TOKEN`, `GH_TOKEN`, or `GITLAB_TOKEN` (recommended)
2. Config file: `~/.config/gitxab/config.json`
3. OS keyring: (planned feature)

## Documentation

- [Specification](docs/spec.md) - Feature requirements and technical design
- [Quickstart Guide](specs/001-gitlab-vim-integration/quickstart.md) - Detailed setup instructions
- [Implementation Plan](specs/001-gitlab-vim-integration/plan.md) - Development roadmap

## Development

### Project Structure

```
gitxab.vim/
├── deno-backend/          # Backend library (Deno/TypeScript)
│   ├── mod.ts            # Library entry point
│   ├── cli.ts            # CLI wrapper
│   └── src/
│       ├── services/     # GitLab API client
│       ├── auth/         # Authentication
│       └── cache/        # ETag caching
├── denops/gitxab/        # Denops plugin (TypeScript)
│   └── main.ts           # Plugin entry point
├── plugin/               # Vim plugin loader
├── doc/                  # Vim help documentation
├── docs/                 # Markdown documentation
├── tests/                # Test files
└── specs/                # Feature specifications
```

### Running Tests

GitXab.vim includes comprehensive test coverage:

**Quick test run**:
```bash
# Run all tests
./run_tests.sh all

# Run only backend tests
./run_tests.sh backend

# Run only integration tests
./run_tests.sh integration
```

**Manual test execution**:
```bash
# Backend unit tests
deno test --allow-env --allow-read --allow-net --allow-write tests/backend_test.ts

# Integration tests
deno test --allow-env --allow-read --allow-net --allow-write tests/integration_test.ts
```

**Test coverage**:
- Backend API tests (Projects, Issues, MRs, Branches)
- Integration tests (Dispatcher functions, buffer management)
- E2E test scenarios (see `specs/001-gitlab-vim-integration/tests/e2e_mrs.md`)

**Running E2E tests**:
1. Set up environment:
   ```bash
   export GITLAB_TOKEN="your-token"
   export GITXAB_DEBUG="1"
   ```
2. Follow test scenarios in `specs/001-gitlab-vim-integration/tests/e2e_mrs.md`
3. Use a test project or GitLab's public project (ID: 278964)

### Contributing

See the [implementation plan](specs/001-gitlab-vim-integration/plan.md) for current development status and tasks.

**Before submitting a PR**:
1. Run all tests: `./run_tests.sh all`
2. Update documentation if adding features
3. Add tests for new functionality
4. Follow existing code style

## Documentation

- **[Quick Start Guide](docs/QUICKSTART.md)** - 最速で始めるためのガイド
- **[Provider Switching Guide](docs/PROVIDER_SWITCHING.md)** - プロバイダー切り替えの詳細
- **[Provider API Guide](deno-backend/PROVIDER_GUIDE.md)** - バックエンドAPI詳細
- **[Vim Help](doc/gitxab.txt)** - `:help gitxab` で表示
- **[Specification](docs/spec.md)** - 機能仕様と設計
- **[Implementation Plan](specs/001-gitlab-vim-integration/plan.md)** - 開発ロードマップ

## Commands Reference

| Command | Description |
|---------|-------------|
| `:GitXabProjects [search]` | List projects/repositories |
| `:GitXabIssues <id> [state]` | List issues |
| `:GitXabCreateIssue <id>` | Create new issue |
| `:GitXabMRs <id>` | List merge requests/pull requests |
| `:GitXabCreateMR <id>` | Create new MR/PR |
| `:GitXabSetProvider github\|gitlab` | Switch provider |
| `:GitXabShowProvider` | Show current provider |

## License

[To be determined]

## Credits

Built with ❤️ for Neovim, GitHub, and GitLab users.
