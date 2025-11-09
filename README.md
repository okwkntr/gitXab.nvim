# GitXab.vim

Neovim plugin for GitLab integration - Access GitLab features directly from your editor.

## Features

- 🔍 Project listing and search
- 📋 Issue management (list, view, comment)
- 🔀 Merge Request management (list, view, diff, comment)
- 💬 Inline diff comments
- 🚀 Fast IPC communication between Neovim and backend

## Architecture

- **Frontend**: Lua (Neovim plugin)
- **Backend**: Deno/TypeScript (HTTP + IPC server)
- **Communication**: NDJSON over Unix Domain Socket (TCP fallback)
- **CLI**: Command-line interface for automation and debugging

## Quick Start

### Prerequisites

- Neovim 0.5+
- Deno 1.x
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/gitxab.vim.git
cd gitxab.vim
```

### Development Setup

1. **Start the backend server**:

```bash
cd deno-backend
deno run --allow-net --allow-read --allow-env src/server.ts
```

2. **Load the plugin in Neovim**:

```vim
" Add to your init.lua or init.vim
set runtimepath+=/path/to/gitxab.vim
lua require('gitxab').setup()
```

3. **Configure GitLab token** (optional, for real API access):

```bash
export GITLAB_TOKEN="your-gitlab-token"
# or store in ~/.config/gitxab/token
```

### Usage

```vim
" List projects
:GitXabProjects

" More commands coming soon...
```

### CLI Usage

The backend provides a CLI for automation and debugging:

```bash
# List projects (uses mock server by default)
deno run --allow-net --allow-read --allow-env deno-backend/cli.ts list-projects --q=search

# Get issue details
deno run --allow-net --allow-read --allow-env deno-backend/cli.ts get-issue --project 123 --iid 5

# List merge requests
deno run --allow-net --allow-read --allow-env deno-backend/cli.ts list-mrs --project 123
```

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

- `GITLAB_BASE_URL`: GitLab API base URL (default: `http://localhost:3000` for mock server)
- `GITLAB_TOKEN`: GitLab personal access token
- `GITXAB_SOCKET_PATH`: Unix domain socket path (default: `/tmp/gitxab.sock`)
- `GITXAB_PORT`: TCP fallback port (default: `8765`)
- `PORT`: HTTP server port (default: `3000`)

### Token Storage

1. Environment variable: `GITLAB_TOKEN`
2. Config file: `~/.config/gitxab/token` (fallback)
3. OS keyring: (planned feature)

## Documentation

- [Specification](docs/spec.md) - Feature requirements and technical design
- [Quickstart Guide](specs/001-gitlab-vim-integration/quickstart.md) - Detailed setup instructions
- [Implementation Plan](specs/001-gitlab-vim-integration/plan.md) - Development roadmap
- [IPC Protocol](specs/001-gitlab-vim-integration/contracts/ipc-protocol.md) - Communication protocol details

## Development

### Project Structure

```
gitxab.vim/
├── deno-backend/          # Backend server (Deno/TypeScript)
│   ├── cli.ts            # CLI wrapper
│   ├── src/
│   │   ├── server.ts     # HTTP + IPC server
│   │   ├── auth/         # Authentication
│   │   ├── cache/        # ETag caching
│   │   └── services/     # GitLab API client
├── lua/gitxab/           # Neovim plugin (Lua)
│   ├── init.lua          # Plugin entry point
│   └── ipc.lua           # IPC client
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
