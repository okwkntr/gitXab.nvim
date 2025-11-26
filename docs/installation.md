# Installation Guide

## Prerequisites

Before installing GitXab.vim, ensure you have the following:

- **Neovim 0.7+** with denops support
- **Deno 1.x** or later
- **Git** version control system
- **GitLab Personal Access Token** with API access

## Step 1: Install Dependencies

### Install Deno

**Linux/macOS:**

```bash
curl -fsSL https://deno.land/install.sh | sh
```

**Windows (PowerShell):**

```powershell
irm https://deno.land/install.ps1 | iex
```

Verify installation:

```bash
deno --version
```

### Install denops.vim

GitXab.vim requires [denops.vim](https://github.com/vim-denops/denops.vim) as a
dependency.

## Step 2: Install GitXab.vim

### Using lazy.nvim (Recommended)

Add to your Neovim configuration (`~/.config/nvim/lua/plugins/gitxab.lua`):

```lua
return {
  {
    'vim-denops/denops.vim',
    lazy = false,
  },
  {
    'your-org/gitxab.nvim',
    dependencies = { 'vim-denops/denops.vim' },
    config = function()
      -- Required: Set your GitLab token
      vim.env.GITLAB_TOKEN = 'your-gitlab-personal-access-token'
      
      -- Optional: Custom GitLab instance
      -- vim.env.GITLAB_BASE_URL = 'https://gitlab.example.com/api/v4'
    end,
    -- Lazy load on command for faster startup
    cmd = { 
      'GitXabProjects', 
      'GitXabIssues', 
      'GitXabMRs', 
      'GitXabCreateIssue', 
      'GitXabCreateMR' 
    },
  },
}
```

### Using packer.nvim

Add to your Neovim configuration:

```lua
use {
  'vim-denops/denops.vim',
}

use {
  'your-org/gitxab.nvim',
  requires = { 'vim-denops/denops.vim' },
  config = function()
    vim.env.GITLAB_TOKEN = 'your-gitlab-personal-access-token'
  end
}
```

### Using vim-plug

Add to your `init.vim`:

```vim
Plug 'vim-denops/denops.vim'
Plug 'your-org/gitxab.nvim'
```

Then set your token in `init.vim`:

```vim
let $GITLAB_TOKEN = 'your-gitlab-personal-access-token'
```

### Manual Installation

1. Clone the repository:

```bash
git clone https://github.com/your-org/gitxab.nvim ~/.config/nvim/pack/plugins/start/gitxab.nvim
```

2. Install denops.vim:

```bash
git clone https://github.com/vim-denops/denops.vim ~/.config/nvim/pack/plugins/start/denops.vim
```

3. Set your token in your Neovim config.

## Step 3: Configure GitLab Token

### Create a GitLab Personal Access Token

1. Log in to your GitLab instance
2. Navigate to **Settings > Access Tokens**
3. Create a new token with the following scopes:
   - `api` - Full API access
   - `read_user` - Read user information
   - `read_repository` - Read repository information

### Set the Token

**Method 1: Environment Variable (Recommended)**

Add to your shell configuration (`~/.bashrc`, `~/.zshrc`, etc.):

```bash
export GITLAB_TOKEN='your-gitlab-personal-access-token'
```

**Method 2: Neovim Configuration**

Add to your Neovim configuration:

```lua
vim.env.GITLAB_TOKEN = 'your-gitlab-personal-access-token'
```

**Method 3: Configuration File (Future)**

Create `~/.config/gitxab/config.json`:

```json
{
  "gitlab": {
    "token": "your-gitlab-personal-access-token",
    "baseUrl": "https://gitlab.com/api/v4"
  }
}
```

## Step 4: Verify Installation

1. Restart Neovim
2. Run the following command:

```vim
:GitXabProjects
```

If successful, you should see a list of your GitLab projects.

## Troubleshooting

### Denops not loading

If you see errors about denops not being available:

1. Ensure Deno is installed and in your PATH
2. Restart Neovim completely
3. Check denops status: `:checkhealth denops`

### Token not recognized

If you get authentication errors:

1. Verify your token is set: `:lua print(vim.env.GITLAB_TOKEN)`
2. Check token permissions in GitLab
3. Ensure token hasn't expired

### Custom GitLab Instance

For self-hosted GitLab instances, set the base URL:

```lua
vim.env.GITLAB_BASE_URL = 'https://gitlab.example.com/api/v4'
```

### Performance Issues

If the plugin is slow:

1. Check your network connection to GitLab
2. Ensure caching is working (ETag support)
3. Consider increasing timeout values (future configuration option)

## Next Steps

- Read the [Command Reference](commands.md) to learn available commands
- Check out the [Configuration Guide](configuration.md) for customization
  options
- Review [Keyboard Shortcuts](shortcuts.md) for efficient navigation
