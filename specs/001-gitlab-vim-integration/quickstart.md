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

4. Open Neovim and run the command to list projects:

:GitXabProjects

## Docker (recommended for CI/development parity)

A Dockerfile is provided under `deno-backend/` to run the backend in a container. Example:

```bash
cd deno-backend
docker build -t gitxab-backend:dev .
docker run -p 127.0.0.1:PORT:PORT -e GITLAB_TOKEN=... gitxab-backend:dev
```

## Notes
- For production-like setup, run backend in Docker and configure Neovim to connect to the socket exposed by the container.
- For CI: run tests via `deno test` and use headless Neovim for Lua unit tests where possible.
