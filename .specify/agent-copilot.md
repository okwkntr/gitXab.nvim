# GitXab.vim Development Guidelines

Auto-generated from feature plans. Last updated: 2025-11-03

## Active Technologies

- Neovim (Lua) frontend
- Deno (TypeScript) backend

## Project Structure

```text
lua/gitxab/
deno-backend/
  src/
  tests/
```

## Commands

- Start backend locally:
  `deno run --allow-net --allow-read --allow-env --unstable src/server.ts`
- Build backend docker image: `docker build -t gitxab-backend:dev deno-backend/`

## Code Style

- Lua: follow Neovim community conventions and use luacheck where applicable
- TypeScript (Deno): use deno fmt and deno lint; tests via deno test

## Recent Changes

- 001-gitlab-vim-integration: Add initial plan and technical decisions (Lua
  frontend, Deno backend)

<!-- MANUAL ADDITIONS START -->

<!-- MANUAL ADDITIONS END -->
