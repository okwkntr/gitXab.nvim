# GitXab.vim Issue Feature - Manual Test Guide

## Prerequisites

1. **Deno installed**: `deno --version`
2. **Denops.vim installed**: Check `~/.local/share/nvim/lazy/denops.vim` exists
3. **GitXab.vim loaded**: Plugin should be in current directory

## Test 1: Basic Function Test (Deno)

Test the listIssues function directly:

```bash
cd /home/kentarou/work/vim/gitXab.vim
deno run --allow-env --allow-read --allow-net /tmp/test_list_issues.ts
```

**Expected output**: Should show "✓ Success! Found X open issues"

## Test 2: Neovim Plugin Test

### Option A: Interactive Test (Recommended)

1. Start Neovim from the project directory:
   ```bash
   cd /home/kentarou/work/vim/gitXab.vim
   nvim
   ```

2. Wait for denops to initialize (check bottom of screen)

3. Test the GitXabIssues command:
   ```vim
   :GitXabIssues 278964 opened
   ```
   
   This uses GitLab's own project (ID: 278964) which is public.

4. **Expected result**: 
   - A new buffer opens
   - Shows "Project: #278964 (X issues)"
   - Lists open issues with format: `#IID Title [labels] @assignee date`

### Option B: Test with Environment Variable

If you have a GitLab token for private projects:

```bash
cd /home/kentarou/work/vim/gitXab.vim
GITLAB_TOKEN=your_token_here nvim
```

Then in Neovim:
```vim
:GitXabIssues <your_project_id>
:GitXabIssues <your_project_id> opened
:GitXabIssues <your_project_id> closed
```

## Test 3: Debug Mode

Enable debug logging to see API requests:

```bash
cd /home/kentarou/work/vim/gitXab.vim
GITXAB_DEBUG=1 nvim
```

Then run `:GitXabIssues 278964` and check `:messages` for debug output.

## Troubleshooting

### "No token configured" error
- For public projects, no token is needed
- If testing private projects, set `GITLAB_TOKEN` environment variable

### "denops not found" error
- Verify denops.vim is installed: `ls ~/.local/share/nvim/lazy/denops.vim`
- Restart Neovim

### "Command not found" error
- Check plugin loaded: `:echo exists(':GitXabIssues')`
- Should return `2` if command exists

## Test Issue Creation (Optional)

If you have a GitLab token and want to test issue creation:

```bash
# Set your project ID
TEST_PROJECT_ID=<your_project_id> deno run --allow-env --allow-read --allow-net tests/test_create_issue.ts
```

Or in Neovim:
```vim
:GitXabCreateIssue <your_project_id>
```

Follow the prompts to enter:
- Issue title
- Description (optional)
- Labels (optional)

## Verification Checklist

**Basic Features:**
- [ ] Deno script test passes
- [ ] :GitXabProjects command works
- [ ] :GitXabIssues 278964 opens issue buffer
- [ ] Buffer shows project header with issue count
- [ ] Issues are grouped by state (Open/Closed)
- [ ] Issue format correct: #IID Title [labels] @assignee date
- [ ] Buffer is read-only (buftype=nofile, modifiable=false)
- [ ] Buffer filetype is 'gitxab-issues'

**Interactive Features:**
- [ ] Press `<Enter>` on project opens menu
- [ ] Select "View Issues" navigates to issue list
- [ ] Press `n` in issue list prompts for new issue
- [ ] Press `q` closes buffers
- [ ] Press `r` refreshes issue list

**Issue Creation:**
- [ ] :GitXabCreateIssue prompts for title
- [ ] Can enter description (optional)
- [ ] Can enter labels (optional)
- [ ] Success message shows issue IID
- [ ] Issue appears in GitLab
