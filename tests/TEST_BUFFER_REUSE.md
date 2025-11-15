# Buffer Reuse Test Manual

## Overview
This document describes how to manually test the buffer reuse functionality.

## Problem Being Solved
**Before fix**: Every time you refresh (press `r`) or re-run a command like `:GitXabIssues`, a new window is created, causing window clutter.

**After fix**: Existing buffers are reused, keeping the workspace clean.

## Test Cases

### Test 1: Project List Buffer Reuse

1. Open Neovim with GitXab plugin loaded
2. Run `:GitXabProjects`
   - **Expected**: New split window opens with project list
3. Run `:ls` and note the buffer number
4. Run `:GitXabProjects` again
   - **Expected**: Same buffer is updated, NO new window
5. Run `:ls` again
   - **Expected**: Still only ONE buffer with `gitxab-projects` filetype
6. Check window count with `:echo winnr('$')`
   - **Expected**: Window count unchanged

### Test 2: Issue List Buffer Reuse

1. From project list, press `<Enter>` and select "View Issues"
2. Run `:ls` and note buffer count
3. Press `r` to refresh the issue list
   - **Expected**: Content updates, NO new window
4. Run `:ls` again
   - **Expected**: Still only ONE buffer with `gitxab-issues` filetype
5. Press `r` multiple times (3-5 times)
6. Run `:ls`
   - **Expected**: Still only ONE issue list buffer

### Test 3: Issue Detail Buffer Reuse

1. From issue list, press `<Enter>` on any issue
2. Run `:ls` and note buffer count
3. Press `r` to refresh the issue detail
   - **Expected**: Content updates, NO new window
4. Run `:ls` again
   - **Expected**: Still only ONE buffer with `gitxab-issue` filetype
5. Press `r` multiple times (3-5 times)
6. Run `:ls`
   - **Expected**: Still only ONE issue detail buffer

### Test 4: Cross-Buffer Navigation

1. Run `:GitXabProjects`
2. Run `:GitXabIssues <projectId>`
3. Run `:ls`
   - **Expected**: One `gitxab-projects` and one `gitxab-issues` buffer
4. Run `:GitXabProjects` again
5. Run `:ls`
   - **Expected**: Still only TWO buffers total (no duplicates)

## Implementation Details

### Key Changes Made

1. **`findOrCreateBuffer()` function**:
   - Searches for existing buffer by **filetype AND buffer name**
   - If found and visible: switches to that window
   - If found but not visible: uses `buffer` command to switch (not `sbuffer`)
   - If not found: creates new buffer with `new` command
   - Sets buffer name only for NEW buffers (avoids E95 error)

2. **Buffer naming scheme**:
   - Projects: `GitXab://projects`
   - Issues: `GitXab://project/{projectId}/issues`
   - Issue Detail: `GitXab://project/{projectId}/issue/{issueIid}`

3. **Buffer reuse logic**:
   - Uses `buffer <bufnr>` instead of `sbuffer` to avoid creating new splits
   - Temporarily sets `modifiable=true` for content updates
   - Returns `{ bufnr, isNew }` to indicate if setup is needed

4. **Key mapping optimization**:
   - Only sets up key mappings for NEW buffers
   - Existing buffers keep their original mappings
   - Prevents duplicate mapping warnings

5. **Debug logging** (enable with `GITXAB_DEBUG=1`):
   - Shows buffer search process
   - Displays filetype and name matching
   - Logs window switching decisions

## Automated Tests

Run integration tests to verify:
```bash
deno test --allow-env --allow-read --allow-net --allow-write tests/integration_test.ts
```

Expected: All tests pass, including:
- `buffer reuse - findOrCreateBuffer creates new buffer first time`
- `buffer reuse - findOrCreateBuffer reuses existing buffer`

## Debug Mode

Enable detailed logging to troubleshoot buffer reuse:

```vim
" In Neovim
:let $GITXAB_DEBUG = "1"
:call denops#plugin#reload('gitxab')
:GitXabProjects
:messages
```

Debug output shows:
- Buffer search process ("Checking buffer X: filetype='...', name='...'")
- Buffer reuse decisions ("Found existing buffer" vs "Creating new one")
- Window switching operations ("Buffer visible in window X" or "switching with :buffer")

## Quick Test Script

Run the interactive test with debug mode enabled:
```bash
./tests/test_buffer_reuse.sh
```

This script automatically sets `GITXAB_DEBUG=1` and provides step-by-step instructions.

## Known Issues Fixed

### Issue 1: E95 Buffer Name Already Exists
**Problem**: When reloading buffers, `:file` command was called on existing buffers, causing "E95: Buffer with this name already exists" error.

**Solution**: 
- Search for existing buffers by both filetype AND name
- Only set buffer name for NEW buffers (`isNew=true`)
- Added try-catch around `:file` command for safety

### Issue 2: Windows Keep Splitting
**Problem**: Each reload created a new split window instead of reusing the existing one.

**Solution**:
- Changed from `sbuffer` to `buffer` command (doesn't create splits)
- Check if buffer is visible with `bufwinnr()` before switching
- If visible: switch to that window with `wincmd w`
- If not visible: use `buffer` to show in current window
