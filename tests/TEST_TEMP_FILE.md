# Test: Temporary File for Description Editing

## Purpose
Verify that the description editor now uses temporary files instead of virtual buffers,
fixing the buffer name collision issue that prevented second edits.

## Root Cause of Previous Bug
- Virtual buffer names (e.g., `GitXab://edit-description-1`) cannot be reused in Vim
- First edit: Buffer created successfully with name
- Second edit: `file` command fails silently, creates unnamed buffer
- Unnamed buffer breaks autocmd mechanism (relies on buffer variables)

## New Implementation
Uses actual temporary files:
- Path format: `$TMPDIR/.gitxab_{projectId}_{issueIid}_desc.md`
- File is created with instructions + current description
- Opened in split window with `:split`
- Auto-saves on buffer close (if modified)
- Temp file cleaned up after successful save

## Manual Test Procedure

### Setup
1. Start Neovim with GitXab plugin loaded
2. Set GITLAB_TOKEN and GITLAB_URL environment variables
3. Open GitXab projects view with `:GitXabProjects`

### Test Case 1: First Edit Works
1. Navigate to a project and press `i` to show issues
2. Navigate to an issue and press `Enter` to view details
3. Press `e` to edit the issue
4. Select option `2` (Edit description)
5. **Expected:** Split window opens with temp file
6. **Verify:** 
   - Buffer name is a file path (e.g., `/tmp/.gitxab_123_1_desc.md`)
   - Instructions are shown at the top
   - Current description is pre-filled below instructions
   - Cursor is positioned at first content line (after instructions)

### Test Case 2: Save and Update
1. Edit the description content
2. Save with `:w`
3. **Expected:** 
   - Message "Updating issue..."
   - Message "✓ Description updated in GitLab"
   - Issue view automatically refreshes with new description
   - Can continue editing and save again with `:w`
4. Close buffer with `:q`
5. **Expected:** 
   - Temp file is deleted (cleanup)

### Test Case 3: Multiple Saves
1. Edit the description and save with `:w`
2. **Expected:** GitLab updated with first version
3. Edit again and save with `:w`
4. **Expected:** GitLab updated with second version
5. Verify each save creates a new update in GitLab
6. Close with `:q`
7. **Expected:** Temp file cleaned up

### Test Case 4: Second Edit Works (Bug Fix Verification)
1. Close the description buffer with `:q`
2. Press `e` again and select option `2`
3. **Expected:** Split window opens successfully (not unnamed buffer)
4. **Verify:**
   - Buffer name is a file path (e.g., `/tmp/.../.gitxab_2_1_desc.md`)
   - Instructions and current description are shown
   - No E216 or buffer name collision errors
5. Make a change and save with `:w`
6. **Expected:** Update succeeds immediately

### Test Case 5: Multiple Issues Concurrent Editing
1. Open issue #1, press `e`, select description edit (don't close buffer)
2. Switch to another window, open issue #2
3. Press `e`, select description edit
4. **Expected:** Both buffers open successfully with different temp files
5. **Verify:**
   - File names are different: `.gitxab_123_1_desc.md` vs `.gitxab_123_2_desc.md`
   - Both can be edited independently
   - Both can be saved successfully

### Test Case 6: Temp File Cleanup
1. Edit a description and save with `:w`
2. Check temp directory (e.g., `/tmp` or `/tmp/nvim.user/...`)
3. **Expected:** Temp file `.gitxab_*_desc.md` still exists (buffer still open)
4. Close buffer with `:q`
5. **Expected:** Temp file is deleted (cleanup on BufUnload)
6. Edit again and check temp directory
7. **Expected:** New temp file created with same pattern

## Success Criteria
- ✅ First edit opens temp file successfully
- ✅ `:w` updates the issue immediately to GitLab
- ✅ Multiple `:w` saves work (each updates GitLab)
- ✅ Second edit works without buffer name collision
- ✅ Multiple issues can be edited concurrently
- ✅ Temp files are cleaned up on buffer close
- ✅ No error messages (E216, buffer collision, etc.)
- ✅ Debug logs show autocmd setup and update flow

## Edge Cases to Test
1. **Empty description:** Edit issue with no description
   - Should show only instructions, no content
   - Should save empty description correctly

2. **Large description:** Edit issue with very long description
   - Should load completely
   - Should save completely

3. **Markdown formatting:** Description with code blocks, lists, etc.
   - Should preserve formatting exactly
   - No extra newlines or whitespace changes

4. **Concurrent edits of same issue:** Edit same issue in two splits
   - Both should use same temp file path
   - Last save wins (expected behavior)

## Known Limitations
- Concurrent edits of the same issue will share the same temp file
- If two users edit the same issue, last save wins (GitLab API behavior)
- Instructions are in English (not localized)

## Implementation Details

### Key Changes
1. **Temp file approach**: Uses actual files instead of virtual buffers
   - Path: `$TMPDIR/.gitxab_{projectId}_{issueIid}_desc.md`
   - Allows multiple edits without name collision
   
2. **Immediate update on save**: `BufWritePost` triggers update
   - Each `:w` immediately updates GitLab
   - No need to close buffer to apply changes
   
3. **Cleanup on unload**: `BufUnload` cleans up resources
   - Deletes temp file
   - Removes autocmds

### Autocmd Setup
```vim
augroup GitXabEditDesc
  autocmd BufWritePost /tmp/.gitxab_2_1_desc.md 
    \ call denops#request('gitxab', 'onDescriptionBufferClose', [bufnr])
  autocmd BufUnload /tmp/.gitxab_2_1_desc.md 
    \ call denops#request('gitxab', 'cleanupDescriptionEdit', ['/tmp/.gitxab_2_1_desc.md'])
augroup END
```

## Related Files
- `denops/gitxab/main.ts` - Lines ~720-780: editIssue description editor
- `denops/gitxab/main.ts` - Lines ~830-905: onDescriptionBufferClose handler
- `denops/gitxab/main.ts` - Lines ~915-960: cleanupDescriptionEdit handler
