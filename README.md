# GitXab.vim

Neovim plugin for GitLab integration - Access GitLab features directly from your editor.

## Features

- 🔍 Project listing and search
- 📋 Issue management (list, view, create, edit, comment)
  - ✨ Pre-filled edit forms with current values
  - 📝 Multi-line description editor with markdown support
- 🔀 Merge Request management (list, view, diff, comment)
- 💬 Inline diff comments
- 🔄 Smart buffer reuse - No duplicate windows on reload
- ⌨️ Keyboard shortcuts with built-in help (`?` key)
- 🚀 Powered by denops.vim - No separate server required!

## Architecture

- **Frontend**: Denops (TypeScript/Deno plugin for Neovim)
- **Backend**: GitLab API client library (TypeScript/Deno)
- **Communication**: Direct in-process function calls via denops
- **CLI**: Command-line interface for automation and scripting

## Quick Start

### Prerequisites

- Neovim 0.7+ (with denops support)
- Deno 1.x
- Git

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
      -- Configure GitLab token
      vim.env.GITLAB_TOKEN = 'your-gitlab-personal-access-token'
      -- Optional: Custom GitLab instance
      -- vim.env.GITLAB_BASE_URL = 'https://gitlab.example.com/api/v4'
    end,
    -- Load on command for faster startup
    cmd = { 'GitXabProjects', 'GitXabIssues', 'GitXabMRs' },
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

**Step 3: Configure GitLab Access**

Set your GitLab personal access token using one of these methods:

**Method 1: Environment variable** (in your shell profile):

```bash
export GITLAB_TOKEN="your-gitlab-personal-access-token"
export GITLAB_BASE_URL="https://gitlab.com/api/v4"  # Optional, defaults to gitlab.com
```

**Method 2: Config file**:

```bash
mkdir -p ~/.config/gitxab
echo "your-gitlab-personal-access-token" > ~/.config/gitxab/token
chmod 600 ~/.config/gitxab/token
```

**Method 3: Neovim config** (in your `init.lua`):

```lua
vim.env.GITLAB_TOKEN = 'your-gitlab-personal-access-token'
vim.env.GITLAB_BASE_URL = 'https://gitlab.com/api/v4'  -- Optional
```

**Get a GitLab personal access token:**
1. Go to https://gitlab.com/-/profile/personal_access_tokens
2. Create a token with `api`, `read_user`, `read_api` scopes
3. Copy the token and save it using one of the methods above

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

#### List Merge Requests (Coming Soon)

```vim
:GitXabMRs <projectId>
```

#### Keyboard Shortcuts

All keyboard shortcuts are displayed in the buffer header. Press `?` in any GitXab buffer to see context-sensitive help.

**Project List Buffer** (`:GitXabProjects`):
- `<Enter>` - Open project menu (View Issues / Create Issue / View MRs)
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

### Environment Variables

- `GITLAB_BASE_URL`: GitLab API base URL (default: `https://gitlab.com/api/v4`)
- `GITLAB_TOKEN`: GitLab personal access token

### Token Storage

1. Environment variable: `GITLAB_TOKEN`
2. Config file: `~/.config/gitxab/token` (fallback)
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
│       ├── client/       # GitLab API client
│       ├── auth/         # Authentication
│       └── cache/        # ETag caching
├── denops/gitxab/        # Denops plugin (TypeScript)
│   └── main.ts           # Plugin entry point
├── plugin/               # Vim plugin loader
├── docs/                 # Documentation
└── specs/                # Feature specifications
```

### Contributing

See the [implementation plan](specs/001-gitlab-vim-integration/plan.md) for current development status and tasks.

## License

[To be determined]

## Credits

Built with ❤️ for Neovim and GitLab users.
