# Command Reference

This document describes all available commands in GitXab.vim.

## Project Commands

### `:GitXabProjects [search_query]`

List all accessible GitLab projects.

**Arguments:**
- `search_query` (optional): Filter projects by name or description

**Example:**
```vim
:GitXabProjects
:GitXabProjects myproject
```

**Keyboard Shortcuts in Project List:**
- `<CR>` (Enter) - Open project menu
- `i` - View project issues
- `m` - View project merge requests
- `r` - Reload project list
- `?` - Show keyboard shortcuts help
- `q` - Close buffer

**Project Menu Options:**
1. View Issues
2. Create New Issue
3. View Merge Requests
4. Create New Merge Request

## Issue Commands

### `:GitXabIssues <project_id>`

List all issues for a specific project.

**Arguments:**
- `project_id` (required): GitLab project ID

**Example:**
```vim
:GitXabIssues 123
```

**Keyboard Shortcuts in Issue List:**
- `<CR>` (Enter) - View issue details
- `n` - Create new issue
- `r` - Reload issue list
- `?` - Show keyboard shortcuts help
- `q` - Close buffer

### `:GitXabCreateIssue <project_id>`

Create a new issue for a project.

**Arguments:**
- `project_id` (required): GitLab project ID

**Example:**
```vim
:GitXabCreateIssue 123
```

**Form Fields:**
- Title (required)
- Description (markdown supported)
- Labels (comma-separated)

The form opens in a temporary buffer. Save with `:w` to create the issue.

### Issue Detail View

**Keyboard Shortcuts:**
- `e` - Edit issue (title, description, labels, state)
- `c` - Add comment
- `R` - Reply to discussion thread
- `r` - Reload issue
- `?` - Show keyboard shortcuts help
- `q` - Close buffer

**Replying to Comments:**
1. Position cursor on the discussion/comment you want to reply to
2. Press `R`
3. A temporary markdown file opens for your reply
4. Write your reply, save with `:w`, then close buffer
5. Issue view refreshes automatically

## Merge Request Commands

### `:GitXabMRs <project_id>`

List all merge requests for a specific project.

**Arguments:**
- `project_id` (required): GitLab project ID

**Example:**
```vim
:GitXabMRs 123
```

**Status Indicators:**
- 🟢 - Opened
- 🟣 - Merged
- 🔴 - Closed

**Keyboard Shortcuts in MR List:**
- `<CR>` (Enter) - View MR details
- `n` - Create new merge request
- `r` - Reload MR list
- `?` - Show keyboard shortcuts help
- `q` - Close buffer

### `:GitXabCreateMR <project_id>`

Create a new merge request.

**Arguments:**
- `project_id` (required): GitLab project ID

**Example:**
```vim
:GitXabCreateMR 123
```

**Form Fields:**
- Source Branch (required) - Select from remote branches list
- Target Branch (required) - Defaults to project's default branch
- Title (required)
- Description (markdown supported)
- Labels (comma-separated)
- Remove source branch after merge (yes/no)

The form opens in a temporary buffer. Save with `:w` to create the MR.

### MR Detail View

**Keyboard Shortcuts:**
- `d` - View diffs/file changes
- `c` - Add comment
- `R` - Reply to discussion thread
- `r` - Reload MR details
- `?` - Show keyboard shortcuts help
- `q` - Close buffer

### MR Diff View

Displays all file changes in the merge request with unified diff format.

**File Status Indicators:**
- `NEW` - New file added
- `DELETED` - File removed
- `RENAMED` - File renamed (shows old → new path)
- `MODIFIED` - File modified

**Diff Markers:**
- `@@` - Hunk header (shows line numbers)
- `+` - Added lines (green)
- `-` - Removed lines (red)
- ` ` (space) - Context lines (unchanged)

**Keyboard Shortcuts:**
- `r` - Reload diffs
- `?` - Show keyboard shortcuts help
- `q` - Close buffer

## Global Shortcuts

These shortcuts work across all GitXab buffers:

- `?` - Show context-specific keyboard shortcuts
- `q` - Close current buffer
- `r` - Reload current view

## Tips

### Working with Long Text

When editing descriptions or comments:
1. The plugin opens a temporary markdown file
2. Write your content (supports full markdown syntax)
3. Save with `:w` to submit
4. Close the buffer (`:q` or `ZZ`)
5. The parent view refreshes automatically

### Navigation

- Use standard Vim navigation (`j`, `k`, `gg`, `G`, etc.)
- Search within buffers with `/` and `?`
- Jump between sections with `{` and `}`

### Buffer Management

GitXab.vim implements smart buffer reuse:
- Reloading a view updates the existing buffer
- No duplicate windows are created
- Buffers are properly cleaned up when closed

## Future Commands

These commands are planned for future releases:

- `:GitXabPipelines <project_id>` - View CI/CD pipelines
- `:GitXabBranches <project_id>` - Manage branches
- `:GitXabTags <project_id>` - Manage tags
- `:GitXabWiki <project_id>` - Access project wiki
