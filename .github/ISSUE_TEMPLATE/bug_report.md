---
name: Bug Report
about: Report a bug to help us improve
title: '[BUG] '
labels: bug
assignees: ''
---

## Bug Description

A clear and concise description of what the bug is.

## Steps to Reproduce

1. Go to '...'
2. Run command '...'
3. See error

## Expected Behavior

A clear description of what you expected to happen.

## Actual Behavior

What actually happened instead.

## Environment

- **OS**: [e.g., Ubuntu 22.04, macOS 13.0, Windows 11]
- **Neovim version**: [e.g., 0.9.0] (run `:version`)
- **Deno version**: [e.g., 1.38.0] (run `deno --version`)
- **GitXab.vim version**: [e.g., v0.2.0] (git commit hash)
- **Provider**: [GitHub / GitLab]
- **Plugin Manager**: [e.g., lazy.nvim, packer.nvim, manual]

## Configuration

```lua
-- Your GitXab configuration (remove sensitive tokens)
vim.env.GITHUB_TOKEN = "***"
-- ... other config
```

## Error Messages

```
Paste any error messages, stack traces, or relevant log output here.
Use :messages to see Neovim messages.
```

## Debug Output

```bash
# Run with debug enabled
GITXAB_DEBUG=1 nvim

# Paste relevant debug output from :messages
```

## Screenshots

If applicable, add screenshots to help explain your problem.

## Additional Context

Add any other context about the problem here.

## Possible Solution

(Optional) If you have an idea of what might be causing the issue or how to fix
it.
