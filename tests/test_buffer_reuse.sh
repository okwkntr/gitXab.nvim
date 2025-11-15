#!/bin/bash
# Manual test for buffer reuse functionality

echo "=== Testing Buffer Reuse Functionality ==="
echo ""
echo "This test verifies that reloading reuses the same buffer"
echo "without creating new windows or buffers."
echo ""
echo "=== Test Procedure ==="
echo ""
echo "Test 1: Project List Buffer Reuse"
echo "  1. Run :GitXabProjects"
echo "  2. Note the window layout (should create ONE split)"
echo "  3. Run :GitXabProjects again"
echo "  4. Expected: Content updates, NO new window created"
echo "  5. Run :ls to verify only ONE gitxab-projects buffer exists"
echo ""
echo "Test 2: Issue List Buffer Reuse"
echo "  1. From project list, press <Enter> and select 'View Issues'"
echo "  2. Press 'r' to refresh"
echo "  3. Expected: Content updates, NO new window created"
echo "  4. Run :ls to verify only ONE gitxab-issues buffer exists"
echo ""
echo "Test 3: Issue Detail Buffer Reuse"
echo "  1. From issue list, press <Enter> on any issue"
echo "  2. Press 'r' to refresh the issue"
echo "  3. Expected: Content updates, NO new window created"
echo "  4. Run :ls to verify only ONE gitxab-issue buffer exists"
echo ""
echo "=== Expected Behavior ==="
echo "BEFORE FIX:"
echo "  - Each refresh creates a new split window"
echo "  - :ls shows multiple buffers of the same type"
echo "  - Windows accumulate and clutter the layout"
echo ""
echo "AFTER FIX:"
echo "  - Refresh updates existing buffer content"
echo "  - :ls shows only ONE buffer per type"
echo "  - Window layout stays clean"
echo ""
echo "Press Enter to start Neovim..."
read

# Set up environment
export GITLAB_BASE_URL="${GITLAB_BASE_URL:-https://gitlab.com}"
export GITLAB_TOKEN="${GITLAB_TOKEN}"
# Enable debug output
export GITXAB_DEBUG=1

# Create test vimrc
cat > /tmp/test_buffer_reuse.vim << 'EOF'
" Load denops
set runtimepath+=~/.cache/deno/deno_plugins/denops.vim

" Load GitXab plugin
let s:plugin_root = expand('<sfile>:p:h:h')
execute 'set runtimepath+=' . s:plugin_root

" Wait for denops to start
autocmd User DenopsReady echo "GitXab loaded! Start with :GitXabProjects"

" Helper commands
command! CheckBuffers echo "Current buffers:" | ls
command! CheckWindows echo "Current windows:" | echo winnr('$') . ' windows'
command! TestInfo echo "Run :GitXabProjects, then run it again. Use :CheckBuffers to verify."

" Instructions on startup
autocmd VimEnter * call timer_start(1000, {-> execute('TestInfo')})
EOF

nvim -u /tmp/test_buffer_reuse.vim
