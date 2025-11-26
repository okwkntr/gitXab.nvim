# E2E Test Recipe: Merge Requests

This document provides end-to-end test scenarios for GitXab.vim merge request
features.

## Prerequisites

- Neovim 0.7+ with denops.vim installed
- GitXab.vim plugin installed
- GitLab personal access token configured
- Access to a GitLab project (use project ID: 278964 for GitLab's own project)

## Test Environment Setup

```vim
" Set up test environment
:let $GITLAB_TOKEN = "your-token-here"
:let $GITLAB_BASE_URL = "https://gitlab.com/api/v4"
:let $GITXAB_DEBUG = "1"  " Enable debug logging

" Reload plugin
:call denops#plugin#reload('gitxab')
```

## Test Scenarios

### Scenario 1: List Merge Requests

**Objective**: Verify MR list display with status icons and navigation

**Steps**:

1. Open Neovim
2. Execute: `:GitXabMRs 278964`
3. Verify buffer opens with MR list
4. Check for status icons (🟢/🟣/🔴)
5. Verify branch information displayed (source → target)

**Expected Results**:

- Buffer with filetype `gitxab-mrs` is created
- MRs displayed with format: `🟢 !IID Title [labels] @assignee date`
- Branch info: `source_branch → target_branch`
- Key mappings shown: `<Enter>=View  n=Create MR  r=Refresh  q=Close  ?=Help`

**Validation**:

```vim
" Check buffer filetype
:set filetype?
" Should show: filetype=gitxab-mrs

" Check buffer content
:echo getline(1, 20)

" Test help
Press ? key
" Should display help text
```

---

### Scenario 2: View MR Detail

**Objective**: Verify MR detail view with discussions

**Steps**:

1. Execute: `:GitXabMRs 278964`
2. Move cursor to any MR line
3. Press `<Enter>` key
4. Verify MR detail buffer opens

**Expected Results**:

- New buffer with filetype `gitxab-mr-detail`
- Display shows:
  - MR title and IID
  - State, author, created date
  - Source and target branches
  - Assignees and labels (if any)
  - Description
  - Discussion threads (numbered [1], [2], etc.)
- Key mappings: `d=Diffs  c=Comment  R=Reply  r=Refresh  q=Close  ?=Help`

**Validation**:

```vim
" Check filetype
:set filetype?

" Check buffer name
:echo bufname('%')
" Should match: GitXab://project/278964/mr/*

" Test refresh
Press r key
" Should reload same buffer (no new window)
```

---

### Scenario 3: View MR Diffs

**Objective**: Verify diff display with file status indicators

**Steps**:

1. From MR detail view (Scenario 2)
2. Press `d` key
3. Verify diff buffer opens

**Expected Results**:

- Buffer with filetype `diff`
- Header shows:
  - MR title and IID
  - Source → Target branches
  - Files changed count
- Each file shows:
  - Status indicator: `[NEW]`, `[DELETED]`, `[RENAMED]`, or `[MODIFIED]`
  - File path
  - Unified diff content with syntax highlighting
  - Diff markers (+/- for additions/deletions, @@ for hunks)

**Validation**:

```vim
" Check filetype and syntax
:set filetype?
" Should show: filetype=diff

:set syntax?
" Should show: syntax=diff

" Check for file status markers
:g/\[NEW\]\|\[DELETED\]\|\[RENAMED\]\|\[MODIFIED\]/p

" Check for diff markers
:g/^+\|^-\|^@@/p
```

---

### Scenario 4: Create Merge Request

**Objective**: Verify MR creation with form-based editor

**Steps**:

1. Execute: `:GitXabCreateMR 278964`
2. Verify editor opens with form template
3. Check branch list in comments
4. Fill in required fields:
   - `source_branch: test-branch`
   - `target_branch: main`
   - `title: Test MR from GitXab`
   - `description: Testing MR creation`
5. Save with `:w`
6. Close with `:q`

**Expected Results**:

- Temporary markdown file opens with:
  - Available branches listed in comments
  - Default branch indicated
  - Form fields for all MR parameters
- After save:
  - Success message: "✓ Merge request created: !<IID>"
  - MR list view refreshes (if open)

**Validation**:

```vim
" Check if file is temporary
:echo expand('%')
" Should match: /tmp/.gitxab_*_create_mr.md

" Check autocmds are set
:autocmd GitXabMRCreate

" After saving, check messages
:messages
" Should show creation success message
```

**Note**: This test requires write permissions to the project. For read-only
testing, verify the form loads correctly and cancel with `:q!`.

---

### Scenario 5: Comment on MR

**Objective**: Verify MR commenting workflow

**Steps**:

1. View an MR detail (Scenario 2)
2. Press `c` key
3. Verify markdown editor opens
4. Write a comment
5. Save with `:w`
6. Close with `:q`

**Expected Results**:

- Markdown editor opens with instructions
- After save:
  - Success message: "✓ Comment posted to MR !<IID>"
  - MR detail view refreshes automatically
  - New comment appears at bottom of discussion list

**Validation**:

```vim
" Check temporary file
:echo expand('%')
" Should match: /tmp/.gitxab_*_mr_comment.md

" Check buffer variable
:echo b:gitxab_action
" Should show: mr_comment

" After saving
:messages
" Should show success message
```

---

### Scenario 6: Reply to MR Discussion

**Objective**: Verify threaded replies to MR discussions

**Steps**:

1. View an MR with discussions (Scenario 2)
2. Note a discussion number (e.g., [2])
3. Press `R` key
4. Enter discussion number when prompted
5. Write a reply in the editor
6. Save with `:w`
7. Close with `:q`

**Expected Results**:

- Prompt appears: "Enter discussion number:"
- Editor opens showing original discussion context
- After save:
  - Success message: "✓ Reply to discussion <N> posted"
  - MR detail view refreshes
  - Reply appears indented under original discussion

**Validation**:

```vim
" Check buffer variables
:echo b:gitxab_action
" Should show: mr_reply

:echo b:gitxab_discussion_id
" Should exist

:echo b:gitxab_discussion_num
" Should match entered number

" Check messages after save
:messages
```

---

### Scenario 7: Buffer Reuse

**Objective**: Verify smart buffer reuse prevents window clutter

**Steps**:

1. Execute: `:GitXabMRs 278964`
2. Note current window count: `:echo winnr('$')`
3. Press `r` to refresh
4. Check window count again
5. Navigate to an MR (press `<Enter>`)
6. Press `r` to refresh MR detail
7. Check window count

**Expected Results**:

- Window count remains same after refresh
- No duplicate windows created
- Same buffer number reused

**Validation**:

```vim
" Before refresh
:let before_winnr = winnr('$')
:let before_bufnr = bufnr('%')

" Refresh
Press r

" After refresh
:echo winnr('$') == before_winnr
" Should be 1 (true)

:echo bufnr('%') == before_bufnr
" Should be 1 (true)

" Check buffer list
:ls
" Should not show duplicate GitXab:// buffers
```

---

### Scenario 8: Keyboard Shortcuts

**Objective**: Verify all keyboard shortcuts work correctly

**Test Matrix**:

| Buffer Type | Key       | Expected Action     |
| ----------- | --------- | ------------------- |
| MR List     | `<Enter>` | Open MR detail      |
| MR List     | `n`       | Create new MR       |
| MR List     | `r`       | Refresh list        |
| MR List     | `q`       | Close buffer        |
| MR List     | `?`       | Show help           |
| MR Detail   | `d`       | View diffs          |
| MR Detail   | `c`       | Add comment         |
| MR Detail   | `R`       | Reply to discussion |
| MR Detail   | `r`       | Refresh view        |
| MR Detail   | `q`       | Close buffer        |
| MR Detail   | `?`       | Show help           |
| MR Diffs    | `q`       | Close buffer        |
| MR Diffs    | `?`       | Show help           |

**Steps**: Test each key mapping in the corresponding buffer type

**Validation**: Each key should trigger the expected action without errors

---

### Scenario 9: Error Handling

**Objective**: Verify graceful error handling

**Test Cases**:

1. **Invalid Project ID**:

```vim
:GitXabMRs 999999999
" Should show error message, not crash
```

2. **Invalid MR IID**:

```vim
:call denops#request('gitxab', 'viewMergeRequest', [278964, 999999])
" Should show "Merge request not found" error
```

3. **Network Error** (disconnect network):

```vim
:GitXabMRs 278964
" Should show connection error message
```

4. **Invalid Token**:

```vim
:let $GITLAB_TOKEN = "invalid-token"
:call denops#plugin#reload('gitxab')
:GitXabMRs 278964
" Should show "Unauthorized" error
```

**Expected Results**:

- All errors display user-friendly messages
- Plugin doesn't crash
- Can recover by fixing issue and retrying

---

### Scenario 10: Performance

**Objective**: Verify acceptable performance with large datasets

**Steps**:

1. Find a project with many MRs (100+)
2. Execute: `:GitXabMRs <project_id>`
3. Measure load time
4. View an MR with many discussions
5. View diffs for an MR with many files

**Expected Results**:

- MR list loads in < 5 seconds
- MR detail loads in < 3 seconds
- Diffs load in < 5 seconds
- UI remains responsive

**Validation**:

```vim
" Enable timing
:profile start profile.log
:profile func *
:profile file *

" Run commands
:GitXabMRs 278964

" Stop profiling
:profile pause

" Check results
:!cat profile.log
```

---

## Regression Tests

### Test: Navigation Regex Fix

**Objective**: Verify MR list navigation works with emoji icons

**Background**: Fixed regex pattern from `/^[🟢🟣🔴]\s+!(\d+)/` to `/!\s*(\d+)/`

**Steps**:

1. Execute: `:GitXabMRs 278964`
2. Move cursor to any MR line
3. Press `<Enter>`

**Expected**: Should open MR detail without error

**Validation**: No error about "Could not extract MR IID"

---

### Test: Branch List Display

**Objective**: Verify branch list shows in MR creation form

**Steps**:

1. Execute: `:GitXabCreateMR 278964`
2. Check comment section for branch list

**Expected**:

- Comment lines with available branches
- Default branch indicated
- Top 20 branches shown

**Validation**:

```vim
" Search for branch list comments
:/Available branches
```

---

## Automation Script

For automated testing, use this script:

```bash
#!/bin/bash
# e2e_test_mrs.sh

export GITLAB_TOKEN="your-token"
export GITLAB_BASE_URL="https://gitlab.com/api/v4"

# Run backend tests
echo "Running backend tests..."
deno test --allow-env --allow-read --allow-net tests/backend_test.ts

# Run integration tests
echo "Running integration tests..."
deno test --allow-env --allow-read --allow-net --allow-write tests/integration_test.ts

# Manual E2E tests (requires interactive Neovim)
echo "Manual E2E tests - follow e2e_mrs.md scenarios"
```

---

## Test Results Template

```markdown
# Test Results - [Date]

## Environment

- Neovim version:
- Deno version:
- GitLab instance:
- Token scopes:

## Results Summary

- Total scenarios: 10
- Passed:
- Failed:
- Skipped:

## Scenario Results

### Scenario 1: List Merge Requests

- Status: ✅ PASS / ❌ FAIL
- Notes:

### Scenario 2: View MR Detail

- Status: ✅ PASS / ❌ FAIL
- Notes:

[Continue for all scenarios...]

## Issues Found

1. [Description]
2. [Description]

## Performance Metrics

- MR list load: X seconds
- MR detail load: X seconds
- Diff load: X seconds
```

---

## Continuous Testing

Add to CI/CD pipeline:

```yaml
# .github/workflows/e2e-test.yml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Deno
        uses: denoland/setup-deno@v1

      - name: Setup Neovim
        uses: rhysd/action-setup-vim@v1
        with:
          neovim: true

      - name: Run Backend Tests
        env:
          GITLAB_TOKEN: ${{ secrets.GITLAB_TOKEN }}
        run: |
          deno test --allow-env --allow-read --allow-net tests/backend_test.ts

      - name: Run Integration Tests
        env:
          GITLAB_TOKEN: ${{ secrets.GITLAB_TOKEN }}
        run: |
          deno test --allow-env --allow-read --allow-net --allow-write tests/integration_test.ts
```

---

## Notes

- Some tests require write permissions to GitLab projects
- Use a test project or read-only mode for CI/CD
- Mock responses can be added for isolated testing
- Performance benchmarks depend on network conditions

---

**Document Version**: 1.0\
**Last Updated**: 2025-11-24\
**Maintainer**: GitXab Contributors
