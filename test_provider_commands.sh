#!/bin/bash
# Test provider commands in Neovim

# Set required environment variables
export GITHUB_TOKEN="${GITHUB_TOKEN:-test_token}"
export GITLAB_TOKEN="${GITLAB_TOKEN:-test_token}"

# Create a test file with commands
cat > /tmp/gitxab_test.vim << 'EOF'
" Wait for denops to be ready
sleep 100m

" Test 1: Check if commands exist
echo "=== Testing GitXab Commands ==="
try
  command GitXabSetProvider
  echo "✓ GitXabSetProvider command exists"
catch
  echo "✗ GitXabSetProvider command NOT found"
endtry

try
  command GitXabShowProvider
  echo "✓ GitXabShowProvider command exists"
catch
  echo "✗ GitXabShowProvider command NOT found"
endtry

" Test 2: Check if autoload functions exist
echo ""
echo "=== Testing Autoload Functions ==="
if exists('*gitxab#set_provider')
  echo "✓ gitxab#set_provider() exists"
else
  echo "✗ gitxab#set_provider() NOT found"
endif

if exists('*gitxab#show_provider')
  echo "✓ gitxab#show_provider() exists"
else
  echo "✗ gitxab#show_provider() NOT found"
endif

" Test 3: Check denops plugin
echo ""
echo "=== Testing Denops Plugin ==="
if denops#plugin#is_loaded('gitxab')
  echo "✓ gitxab denops plugin is loaded"
else
  echo "✗ gitxab denops plugin NOT loaded"
  echo "Attempting to load..."
  call gitxab#load()
  sleep 500m
  if denops#plugin#is_loaded('gitxab')
    echo "✓ Successfully loaded gitxab"
  else
    echo "✗ Failed to load gitxab"
  endif
endif

" Test 4: Try to use the commands (with error handling)
echo ""
echo "=== Testing Command Execution ==="
try
  GitXabSetProvider github
  echo "✓ GitXabSetProvider github succeeded"
catch /^Vim\%((\a\+)\)\=:E/
  echo "✗ GitXabSetProvider failed: " . v:exception
endtry

try
  GitXabShowProvider
  echo "✓ GitXabShowProvider succeeded"
catch /^Vim\%((\a\+)\)\=:E/
  echo "✗ GitXabShowProvider failed: " . v:exception
endtry

echo ""
echo "=== Test Complete ==="
echo "Press any key to exit..."
call getchar()
qall!
EOF

# Run Neovim with the test script
echo "Running Neovim test..."
echo "This will test if GitXab commands are available."
echo ""

nvim -u NONE \
  -c "set runtimepath+=$HOME/.local/share/nvim/site/pack/plugins/start/denops.vim" \
  -c "set runtimepath+=." \
  -S /tmp/gitxab_test.vim

# Clean up
rm -f /tmp/gitxab_test.vim
