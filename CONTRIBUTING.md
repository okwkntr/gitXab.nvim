# Contributing to GitXab.vim

Thank you for your interest in contributing to GitXab.vim! This document
provides guidelines and instructions for contributing.

## Code of Conduct

By participating in this project, you agree to maintain a respectful and
inclusive environment for all contributors.

## Getting Started

### Prerequisites

- Neovim 0.7+
- Deno 1.x
- Git
- GitHub or GitLab personal access token for testing

### Development Setup

1. **Fork and clone the repository**:
   ```bash
   git clone https://github.com/YOUR_USERNAME/gitXab.nvim.git
   cd gitXab.nvim
   ```

2. **Install Deno** (if not already installed):
   ```bash
   curl -fsSL https://deno.land/install.sh | sh
   ```

3. **Set up test environment**:
   ```bash
   export GITHUB_TOKEN="your-test-token"
   export GITLAB_TOKEN="your-test-token"
   export GITXAB_DEBUG="1"
   ```

4. **Run tests to verify setup**:
   ```bash
   ./run_tests.sh all
   ```

## Development Workflow

### 1. Create a Feature Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/bug-description
```

### 2. Make Your Changes

Follow the project structure:

- **Backend code**: `deno-backend/src/`
- **Denops plugin**: `denops/gitxab/`
- **Vim scripts**: `autoload/`, `plugin/`
- **Documentation**: `doc/`, `docs/`
- **Tests**: `tests/`

### 3. Write Tests

All new features and bug fixes should include tests:

```bash
# Unit tests for backend
deno test --allow-env --allow-read --allow-net tests/unit/

# Integration tests
deno test --allow-env --allow-read --allow-net --allow-write tests/integration_test.ts

# Run all tests
./run_tests.sh all
```

### 4. Code Style

#### TypeScript/Deno

- Run formatter: `deno fmt`
- Run linter: `deno lint`
- Fix common issues:
  - Use `_variable` for intentionally unused variables
  - Avoid `any` type - use `unknown` with type guards
  - Add comments to empty catch blocks

#### Vim Script

- Use 2 spaces for indentation
- Follow existing naming conventions
- Add comments for complex logic

### 5. Test Your Changes

```bash
# Lint check
deno lint

# Format check
deno fmt --check

# Type check
deno check deno-backend/mod.ts
deno check denops/gitxab/main.ts

# Run all tests
./run_tests.sh all

# Manual testing in Neovim
nvim +":GitXabProjects"
```

### 6. Commit Your Changes

Use clear, descriptive commit messages:

```bash
git commit -m "feat: add GitHub Actions support"
git commit -m "fix: resolve buffer reuse issue"
git commit -m "docs: update README with new features"
git commit -m "test: add unit tests for provider factory"
```

**Commit message format**:

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `test:` - Test additions or changes
- `refactor:` - Code refactoring
- `perf:` - Performance improvements
- `chore:` - Build process or auxiliary tool changes

### 7. Push and Create Pull Request

```bash
git push origin feature/your-feature-name
```

Then open a Pull Request on GitHub with:

- Clear description of changes
- Reference to related issues (if any)
- Screenshots or GIFs for UI changes
- Test results

## Pull Request Guidelines

### Before Submitting

- [ ] All tests pass (`./run_tests.sh all`)
- [ ] Code is formatted (`deno fmt`)
- [ ] No lint errors (`deno lint`)
- [ ] Type checks pass (`deno check`)
- [ ] Documentation is updated
- [ ] Commit messages are clear and descriptive

### PR Description Template

```markdown
## Description

Brief description of changes

## Type of Change

- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing

- [ ] Unit tests added/updated
- [ ] Integration tests pass
- [ ] Manual testing completed

## Screenshots (if applicable)

Add screenshots or GIFs for UI changes

## Related Issues

Closes #123
```

## Project Structure

```
gitxab.vim/
├── deno-backend/              # Backend library (Deno/TypeScript)
│   ├── mod.ts                # Library entry point
│   ├── cli.ts                # CLI wrapper
│   └── src/
│       ├── providers/        # Multi-provider support
│       │   ├── provider.ts   # Provider interface
│       │   ├── github_provider.ts
│       │   └── gitlab_provider.ts (planned)
│       ├── services/         # API clients
│       │   ├── github_client.ts
│       │   └── gitlab_client.ts
│       ├── auth/             # Authentication
│       ├── cache/            # ETag caching
│       ├── config/           # Configuration
│       └── models/           # Type definitions
├── denops/gitxab/            # Denops plugin (TypeScript)
│   └── main.ts               # Plugin entry point
├── autoload/                 # Vim autoload scripts
├── plugin/                   # Vim plugin loader
├── doc/                      # Vim help documentation
├── docs/                     # Markdown documentation
├── tests/                    # Test files
│   ├── unit/                 # Unit tests
│   ├── contract/             # API contract tests
│   ├── integration_test.ts   # Integration tests
│   └── backend_test.ts       # Backend tests
└── specs/                    # Feature specifications
```

## Testing Guidelines

### Unit Tests

Test individual functions and modules:

```typescript
// tests/unit/example_test.ts
import { assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { myFunction } from "../../deno-backend/src/example.ts";

Deno.test("myFunction should return expected value", () => {
  const result = myFunction("input");
  assertEquals(result, "expected output");
});
```

### Integration Tests

Test denops plugin functionality:

```typescript
// tests/integration_test.ts
Deno.test("command should work correctly", async () => {
  const denops = new MockDenops();
  await main(denops);

  const result = await denops.dispatcher["commandName"]();
  assertEquals(result, expected);
});
```

### Manual Testing

Test in actual Neovim:

```bash
# Start Neovim with debug logging
GITXAB_DEBUG=1 nvim

# Test commands
:GitXabProjects
:GitXabIssues 123
:GitXabMRs 123
```

## Documentation

### Code Comments

- Add JSDoc comments for public functions:
  ```typescript
  /**
   * Fetch projects from GitHub/GitLab
   * @param provider - The provider instance
   * @param search - Optional search query
   * @returns Array of projects
   */
  export async function listProjects(
    provider: Provider,
    search?: string,
  ): Promise<Project[]> {
    // implementation
  }
  ```

### User Documentation

Update relevant documentation:

- `README.md` - User-facing features
- `doc/gitxab.txt` - Vim help documentation
- `docs/` - Detailed guides

### Developer Documentation

- `specs/` - Feature specifications
- `docs/ARCHITECTURE.md` - System design (if applicable)
- Inline comments for complex logic

## Common Tasks

### Adding a New Command

1. Add dispatcher in `denops/gitxab/main.ts`
2. Register command in `main()` function
3. Add Vim command in `plugin/gitxab.vim`
4. Add autoload function in `autoload/gitxab.vim` (if needed)
5. Add help documentation in `doc/gitxab.txt`
6. Add tests in `tests/integration_test.ts`

### Adding Provider Support

1. Implement provider interface in `deno-backend/src/providers/`
2. Add API client in `deno-backend/src/services/`
3. Add converter in `deno-backend/src/providers/`
4. Update provider factory
5. Add tests
6. Update documentation

### Fixing a Bug

1. Write a failing test that reproduces the bug
2. Fix the bug
3. Verify the test passes
4. Add regression test if needed

## Getting Help

- 📚 **Documentation**: Check [docs/](docs/) for guides
- 💬 **Discussions**: Use
  [GitHub Discussions](https://github.com/okwkntr/gitXab.nvim/discussions)
- 🐛 **Issues**: Search
  [existing issues](https://github.com/okwkntr/gitXab.nvim/issues) first
- 💡 **Questions**: Ask in discussions or open an issue

## Release Process

(For maintainers)

1. Update version in `deno.json`
2. Update `CHANGELOG.md`
3. Create a git tag: `git tag v0.x.0`
4. Push tag: `git push origin v0.x.0`
5. Create GitHub Release with release notes

## License

By contributing to GitXab.vim, you agree that your contributions will be
licensed under the MIT License.

## Thank You!

Your contributions make GitXab.vim better for everyone. Thank you for taking the
time to contribute! 🎉
