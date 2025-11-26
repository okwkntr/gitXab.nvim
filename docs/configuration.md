# Configuration Guide

This guide covers all configuration options for GitXab.vim.

## Required Configuration

### GitLab Token

GitXab.vim requires a GitLab Personal Access Token for API access.

**Environment Variable (Recommended):**
```bash
export GITLAB_TOKEN='your-gitlab-personal-access-token'
```

**Neovim Configuration:**
```lua
vim.env.GITLAB_TOKEN = 'your-gitlab-personal-access-token'
```

## Optional Configuration

### Custom GitLab Instance

For self-hosted GitLab installations:

```lua
vim.env.GITLAB_BASE_URL = 'https://gitlab.example.com/api/v4'
```

**Default:** `https://gitlab.com/api/v4`

### Configuration File (Future)

GitXab.vim will support configuration files in future versions:

**Location:** `~/.config/gitxab/config.json`

```json
{
  "gitlab": {
    "token": "your-gitlab-personal-access-token",
    "baseUrl": "https://gitlab.com/api/v4",
    "timeout": 30000,
    "cacheEnabled": true,
    "cacheTTL": 300
  },
  "ui": {
    "theme": "default",
    "dateFormat": "relative",
    "showIcons": true
  }
}
```

## Plugin Configuration

### Lazy Loading

Configure lazy loading with lazy.nvim to improve startup time:

```lua
{
  'your-org/gitxab.nvim',
  dependencies = { 'vim-denops/denops.vim' },
  cmd = { 
    'GitXabProjects', 
    'GitXabIssues', 
    'GitXabMRs', 
    'GitXabCreateIssue', 
    'GitXabCreateMR' 
  },
  config = function()
    vim.env.GITLAB_TOKEN = os.getenv('GITLAB_TOKEN')
  end
}
```

### Key Mappings

Create custom key mappings for quick access:

```lua
-- In your Neovim configuration
vim.keymap.set('n', '<leader>gp', ':GitXabProjects<CR>', { desc = 'GitLab Projects' })
vim.keymap.set('n', '<leader>gi', ':GitXabIssues ', { desc = 'GitLab Issues' })
vim.keymap.set('n', '<leader>gm', ':GitXabMRs ', { desc = 'GitLab MRs' })
```

### Autocommands

Set up autocommands for GitXab buffers:

```lua
vim.api.nvim_create_augroup('GitXab', { clear = true })

-- Auto-refresh on buffer focus
vim.api.nvim_create_autocmd('BufEnter', {
  group = 'GitXab',
  pattern = 'gitxab://*',
  callback = function()
    -- Custom behavior when entering GitXab buffers
  end
})

-- Clean up on buffer leave
vim.api.nvim_create_autocmd('BufLeave', {
  group = 'GitXab',
  pattern = 'gitxab://*',
  callback = function()
    -- Custom cleanup
  end
})
```

## Security Best Practices

### Token Storage

**DO:**
- Store tokens in environment variables
- Use OS keyring integration (future feature)
- Restrict token permissions to minimum required scopes
- Rotate tokens regularly

**DON'T:**
- Commit tokens to version control
- Share tokens with others
- Use tokens with excessive permissions
- Store tokens in plain text configuration files

### Token Scopes

Required GitLab token scopes:
- `api` - Full API access (required for all operations)
- `read_user` - Read user information (optional but recommended)
- `read_repository` - Read repository information (optional but recommended)

### Network Security

GitXab.vim always uses HTTPS for API communication. Ensure your GitLab instance has valid SSL/TLS certificates.

## Performance Tuning

### Caching

GitXab.vim implements ETag-based caching for improved performance:

- API responses are cached automatically
- Cache is validated on each request using ETags
- Stale cache entries are refreshed automatically

**Future Configuration Options:**
```json
{
  "cacheEnabled": true,
  "cacheTTL": 300,
  "cacheMaxSize": 100
}
```

### Network Timeouts

**Future Configuration Options:**
```json
{
  "timeout": 30000,
  "retries": 3,
  "retryDelay": 1000
}
```

### Pagination

Large result sets are automatically paginated:

- Default page size: 20 items
- Maximum page size: 100 items (GitLab API limit)

**Future Configuration Options:**
```json
{
  "pageSize": 20,
  "maxPages": 10
}
```

## UI Customization

### Buffer Settings

GitXab buffers use the following settings:

```vim
setlocal buftype=nofile
setlocal bufhidden=hide
setlocal noswapfile
setlocal nowrap
setlocal cursorline
```

### Syntax Highlighting

GitXab.vim uses standard Vim/Neovim syntax highlighting:

- Markdown buffers: `markdown` filetype
- Diff buffers: `diff` filetype
- List buffers: Custom syntax groups

### Color Scheme Integration

GitXab.vim respects your current color scheme. Status indicators use standard highlight groups:

- 🟢 Opened - Uses default green/success color
- 🟣 Merged - Uses default purple/info color
- 🔴 Closed - Uses default red/error color

## Troubleshooting

### Enable Debug Logging

**Future Feature:**
```lua
vim.g.gitxab_debug = true
vim.g.gitxab_log_file = '~/.cache/gitxab/debug.log'
```

### Check Health

Verify GitXab.vim installation:

```vim
:checkhealth denops
```

### Common Issues

**Slow Performance:**
- Check network latency to GitLab
- Verify caching is working
- Reduce page size for large result sets

**Authentication Errors:**
- Verify token is set correctly
- Check token hasn't expired
- Ensure token has required scopes

**Display Issues:**
- Check terminal supports Unicode (for status icons)
- Verify color scheme is loaded
- Try reloading the buffer with `r`

## Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `GITLAB_TOKEN` | Yes | - | Personal Access Token |
| `GITLAB_BASE_URL` | No | `https://gitlab.com/api/v4` | API base URL |

## Future Configuration Options

These options are planned for future releases:

```lua
vim.g.gitxab = {
  -- API Configuration
  api = {
    timeout = 30000,
    retries = 3,
    pageSize = 20,
  },
  
  -- Cache Configuration
  cache = {
    enabled = true,
    ttl = 300,
    maxSize = 100,
  },
  
  -- UI Configuration
  ui = {
    showIcons = true,
    dateFormat = 'relative', -- 'relative', 'absolute', 'iso'
    theme = 'default',
    splitDirection = 'vertical', -- 'horizontal', 'vertical', 'tab'
  },
  
  -- Keymaps
  keymaps = {
    enabled = true,
    prefix = '<leader>g',
  },
}
```
