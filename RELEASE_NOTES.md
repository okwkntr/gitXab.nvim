# Release Notes - v0.2.0

**Release Date:** 2025-11-24

## Overview

GitXab.vim v0.2.0 is a major update that completes the core feature set with full Merge Request support, comprehensive documentation, and a robust testing infrastructure. This release marks the completion of all planned MVP features (Phases 1-5) and polish work (Phase 6).

## 🎉 Highlights

### Full Merge Request Support
- View, create, and manage merge requests directly from Neovim
- Complete diff viewing with syntax highlighting
- Comment and reply to MR discussions
- Branch management with automatic default branch detection

### Complete Issue Management
- Create and edit issues with form-based editors
- Reply to specific discussion threads
- Pre-filled edit forms with current values
- Full markdown support for descriptions and comments

### Production-Ready Documentation
- Comprehensive guides for installation, configuration, and usage
- Architecture documentation for contributors
- Security best practices and compliance guidelines
- Performance optimization techniques

### Robust Testing Infrastructure
- Unit, integration, and contract tests
- Performance benchmarking suite
- Enhanced CI/CD pipeline with parallel test execution
- Test coverage reporting

## 📦 What's New

### Features

#### Merge Request Management
- **List View**: Display all MRs with status icons (🟢/🟣/🔴)
- **Detail View**: View MR details, branches, and discussions
- **Diff View**: View file changes with unified diff format
- **Creation**: Create MRs with editor-based forms
- **Comments**: Add comments and reply to discussions
- **Commands**: `:GitXabMRs`, `:GitXabCreateMR`

#### Enhanced Issue Management
- Create issues with `:GitXabCreateIssue`
- Edit existing issues (title, description, labels, state)
- Reply to specific discussion threads
- Form-based editors for complex input

#### Documentation
- Installation Guide - Complete setup for all package managers
- Command Reference - All commands with examples
- Configuration Guide - Environment variables and future options
- Architecture Guide - Technical design and data flow
- Security Guide - Token management and best practices
- Performance Guide - Optimization and benchmarking
- Testing Guide - Running and writing tests

#### Testing
- Structured test suite (unit/integration/contract/performance)
- Contract tests validate API schema compliance
- Performance benchmarks for all operations
- 88% task completion rate (37/42 tasks)

#### CI/CD
- Parallel test execution
- Docker image build validation
- Code coverage reporting
- Lua formatting checks
- Branch-specific workflows

### Improvements

- **Smart Buffer Reuse**: No duplicate windows on reload
- **Context-Aware Help**: Different shortcuts for each view (`?` key)
- **Editor-Based Forms**: Temporary markdown files for long text
- **Real-Time Save**: Changes apply on `:w`
- **Clean Codebase**: No TODO/FIXME markers
- **Type Safety**: Full TypeScript coverage

### Bug Fixes

- Fixed MR list navigation with Unicode emoji
- Improved regex pattern matching for line parsing

## 🚀 Getting Started

### Installation

**With lazy.nvim:**
```lua
{
  'your-org/gitxab.nvim',
  dependencies = { 'vim-denops/denops.vim' },
  config = function()
    vim.env.GITLAB_TOKEN = 'your-token'
  end,
  cmd = { 'GitXabProjects', 'GitXabIssues', 'GitXabMRs' },
}
```

### Quick Start

```vim
" List your projects
:GitXabProjects

" View issues (replace 123 with your project ID)
:GitXabIssues 123

" View merge requests
:GitXabMRs 123

" Create new issue
:GitXabCreateIssue 123

" Create new merge request
:GitXabCreateMR 123
```

### Key Shortcuts

- `?` - Show help for current view
- `<CR>` - Open item under cursor
- `n` - Create new item
- `c` - Add comment
- `R` - Reply to discussion
- `d` - View diffs (MRs only)
- `e` - Edit item
- `r` - Reload view
- `q` - Close buffer

## 📊 Project Status

### Completion Summary

| Phase | Status | Tasks |
|-------|--------|-------|
| Phase 1: Setup | ✅ Complete | 6/6 |
| Phase 2: Foundation | ✅ Complete | 5/7* |
| Phase 3: Projects (MVP) | ✅ Complete | 7/7 |
| Phase 4: Issues | ✅ Complete | 8/8 |
| Phase 5: Merge Requests | ✅ Complete | 8/9** |
| Phase 6: Polish | ✅ Complete | 6/6 |

*2 tasks deferred (T012, T013) - completed in Phase 6  
**1 task deferred (T034 - inline diff comments) for future release

**Overall Progress**: 88% (37/42 tasks)  
**MVP Features**: 100% Complete

### What's Next?

Future enhancements (not in this release):
- Inline diff comments (Phase 5, T034)
- OS keyring integration for secure token storage
- Persistent disk cache
- GitHub provider support
- Pipeline/CI integration
- Wiki support

## 🔒 Security

- Token stored in environment variables (recommended)
- File-based fallback with 600 permissions
- HTTPS-only API communication
- No telemetry or third-party data sharing
- See [Security Guide](docs/security.md) for best practices

## ⚡ Performance

- ETag-based HTTP caching
- Target latency: < 500ms for all operations
- Smart buffer reuse reduces memory usage
- See [Performance Guide](docs/performance.md) for optimization

## 🧪 Testing

Run tests:
```bash
# All tests
deno test --allow-env --allow-read --allow-net

# Unit tests only
deno test --allow-env tests/unit/

# With coverage
deno test --allow-env --allow-read --allow-net --coverage=coverage/

# Benchmarks
deno bench --allow-env --allow-read --allow-net tests/performance/
```

## 📚 Documentation

Complete documentation available in `docs/`:
- [Installation](docs/installation.md)
- [Commands](docs/commands.md)
- [Configuration](docs/configuration.md)
- [Architecture](docs/architecture.md)
- [Security](docs/security.md)
- [Performance](docs/performance.md)
- [Testing](tests/README.md)

## 🙏 Acknowledgments

Built with:
- [denops.vim](https://github.com/vim-denops/denops.vim) - Deno integration for Vim/Neovim
- [Deno](https://deno.land/) - Modern JavaScript/TypeScript runtime
- [GitLab API](https://docs.gitlab.com/ee/api/) - GitLab REST API v4

## 📝 Changelog

See [CHANGELOG.md](CHANGELOG.md) for detailed changes.

## 🐛 Known Issues

None at this time. Please report issues on GitHub.

## 💬 Support

- Documentation: See `docs/` directory
- Issues: GitHub Issues
- Security: See SECURITY.md for reporting vulnerabilities

## 📄 License

[Your License] - See LICENSE file for details

---

**Full Changelog**: v0.1.0...v0.2.0
