# GitXab.vim

Neovim plugin for GitLab integration - Access GitLab features directly from your editor.

## Features

- 🔍 Project listing and search
- 📋 Issue management (list, view, comment)
- 🔀 Merge Request management (list, view, diff, comment)
- 💬 Inline diff comments
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

Example output:
```
gitxab - Neovim GitLab plugin
my-project - My awesome project
team-repo - Team collaboration repository
```

#### List Issues (Coming Soon)

```vim
:GitXabIssues
```

#### List Merge Requests (Coming Soon)

```vim
:GitXabMRs
```

#### Keyboard Shortcuts (Planned)

In project/issue/MR list buffers:
- `<CR>` (Enter) - Open details
- `i` - Show issues for selected project
- `m` - Show merge requests for selected project
- `q` - Close buffer

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
" Enable detailed API request/response logging
:let $GITXAB_DEBUG = "1"
:call denops#plugin#reload('gitxab')
:GitXabProjects

" Or set in init.lua before starting Neovim
vim.env.GITXAB_DEBUG = "1"
```

Debug logs will show:
- Request: URL, token status, headers
- Response: Status code, content type, body preview

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

### Run Backend Tests

```bash
cd deno-backend
deno test --allow-net --allow-read --allow-env
```

### Test with Mock Server

The mock server provides test data without hitting the real GitLab API:

```bash
# Start mock server (HTTP on :3000, IPC on :8765)
deno run --allow-net --allow-read --allow-env deno-backend/src/server.ts

# In another terminal, test CLI
deno run --allow-net --allow-read --allow-env deno-backend/cli.ts list-projects --q=gitxab
```

Expected output:
```json
[{"id":1,"name":"gitxab","path":"gitxab","description":"Neovim GitLab plugin"}]
```

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
