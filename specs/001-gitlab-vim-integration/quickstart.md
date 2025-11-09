# quickstart.md

**Feature**: GitLab Vim Integration  
**Date**: 2025-11-03

## Quickstart (development)

Prereqs:
- Neovim 0.5+
- Deno 1.x or Docker
- Git

1. Start backend (local Deno):

```bash
cd deno-backend
deno run --allow-net --allow-read --allow-env --unstable src/server.ts
```

2. Start Neovim and install plugin in development mode (from repo root):

```bash
# from repo root
# add lua path to runtimepath in init.lua/init.vim for development
nvim -c "set rtp+=$(pwd)" 
```

3. Configure GitLab token (prefer keyring):

- Export `GITLAB_TOKEN` or configure via plugin command which stores token in OS keyring.

### CLI usage

The backend also exposes a small CLI that reuses the same internal client functions. Example:

```bash
# list projects via CLI
deno run --allow-net --allow-read --allow-env deno-backend/cli.ts list-projects --q=gitxab

# get issue
deno run --allow-net --allow-read --allow-env deno-backend/cli.ts get-issue --project 123 --iid 5
```

4. Open Neovim and run the command to list projects:

:GitXabProjects

## Docker (recommended for CI/development parity)

A Dockerfile is provided under `deno-backend/` to run the backend in a container. Example:

```bash
cd deno-backend
docker build -t gitxab-backend:dev .
docker run -p 127.0.0.1:PORT:PORT -e GITLAB_TOKEN=... gitxab-backend:dev
```

## Testing

### Unit Tests (Backend)

Run Deno tests:

```bash
cd deno-backend
deno test --allow-net --allow-read --allow-env
```

### Integration Tests (with Mock Server)

1. Start the mock server (provides HTTP API on port 3000 and IPC on port 8765):

```bash
cd deno-backend
deno run --allow-net --allow-read --allow-env src/server.ts
```

2. In another terminal, test the CLI against the mock server:

```bash
# CLI will use http://localhost:3000 by default (mock server)
deno run --allow-net --allow-read --allow-env deno-backend/cli.ts list-projects --q=gitxab
# Expected output: [{"id":1,"name":"gitxab","path":"gitxab","description":"Neovim GitLab plugin"}]
```

3. Or test with curl:

```bash
curl -s "http://localhost:3000/projects?q=gitxab"
```

### Testing against Real GitLab API

To test against the real GitLab API instead of the mock server:

```bash
export GITLAB_BASE_URL="https://gitlab.com/api/v4"
export GITLAB_TOKEN="your-token-here"
deno run --allow-net --allow-read --allow-env deno-backend/cli.ts list-projects --q=gitxab
```

### E2E Tests (Neovim + Backend)

1. Start the backend server
2. Open Neovim with the plugin loaded
3. Run `:GitXabProjects` to test IPC communication

## Notes
- For production-like setup, run backend in Docker and configure Neovim to connect to the socket exposed by the container.
- For CI: run tests via `deno test` and use headless Neovim for Lua unit tests where possible.
- Default configuration uses mock server (localhost:3000) to avoid hitting real GitLab API during development/testing.
