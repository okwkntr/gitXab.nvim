#!/bin/bash
# Test provider commands in Neovim

# Set required environment variables
export GITHUB_TOKEN="${GITHUB_TOKEN:-test_token}"
export GITLAB_TOKEN="${GITLAB_TOKEN:-test_token}"

# Get the plugin directory
PLUGIN_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "Plugin directory: $PLUGIN_DIR"
echo ""

# Try to find denops.vim in common locations
DENOPS_PATHS=(
  "$HOME/.local/share/nvim/site/pack/plugins/start/denops.vim"
  "$HOME/.local/share/nvim/lazy/denops.vim"
  "$HOME/.config/nvim/pack/plugins/start/denops.vim"
  "$HOME/.vim/pack/plugins/start/denops.vim"
)

DENOPS_FOUND=""
for path in "${DENOPS_PATHS[@]}"; do
  if [ -d "$path" ]; then
    DENOPS_FOUND="$path"
    echo "Found denops.vim at: $path"
    break
  fi
done

if [ -z "$DENOPS_FOUND" ]; then
  echo "Warning: denops.vim not found in standard locations."
  echo "The test will fail. Please install denops.vim first."
  echo ""
  exit 1
fi

# Create a test file with commands
cat > /tmp/gitxab_test.vim << 'EOF'
let g:denops#deno = "/home/kentarou/.deno/bin/deno"
let g:denops#debug = 1

echo "=== Runtime Path ==="
for path in split(&runtimepath, ',')
  echo "  " . path
endfor
echo ""

echo "=== Denops Availability ==="
if exists('*denops#request')
  echo "✓ denops#request available"
else
  echo "✗ denops#request NOT available - denops.vim not loaded!"
endif
if exists('*denops#plugin#load')
  echo "✓ denops#plugin#load available"
else
  echo "✗ denops#plugin#load NOT available"
endif
echo ""

echo "=== Plugin Files Check ==="
let s:found_plugin_vim = 0
let s:found_plugin_lua = 0
let s:found_autoload = 0

for path in split(&runtimepath, ',')
  if filereadable(path . '/plugin/gitxab.vim')
    echo "✓ Found: " . path . "/plugin/gitxab.vim"
    let s:found_plugin_vim = 1
  endif
  if filereadable(path . '/plugin/gitxab.lua')
    echo "✓ Found: " . path . "/plugin/gitxab.lua"
    let s:found_plugin_lua = 1
  endif
  if filereadable(path . '/autoload/gitxab.vim')
    echo "✓ Found: " . path . "/autoload/gitxab.vim"
    let s:found_autoload = 1
  endif
endfor

if !s:found_plugin_vim
  echo "✗ plugin/gitxab.vim not found in runtimepath"
endif
if !s:found_plugin_lua
  echo "✗ plugin/gitxab.lua not found in runtimepath"
endif
if !s:found_autoload
  echo "✗ autoload/gitxab.vim not found in runtimepath"
endif
echo ""

echo "Waiting for denops to initialize..."
sleep 2000m

echo "=== Testing GitXab Commands ==="
redir => s:commands
silent! command
redir END

if s:commands =~# 'GitXabSetProvider'
  echo "✓ GitXabSetProvider command exists"
else
  echo "✗ GitXabSetProvider command NOT found"
  echo "  Available commands:"
  for line in split(s:commands, "\n")
    if line =~# '^\s*\w'
      echo "    " . line
    endif
  endfor
endif

if s:commands =~# 'GitXabShowProvider'
  echo "✓ GitXabShowProvider command exists"
else
  echo "✗ GitXabShowProvider command NOT found"
endif

if s:commands =~# 'GitXabProjects'
  echo "✓ GitXabProjects command exists"
else
  echo "✗ GitXabProjects command NOT found"
endif
echo ""

echo "=== Testing Autoload Functions ==="
try
  call gitxab#set_provider('github')
  echo "✓ gitxab#set_provider() callable"
catch /E117/
  echo "✗ gitxab#set_provider() NOT found (E117)"
catch
  echo "✓ gitxab#set_provider() exists (error: " . v:exception . ")"
endtry

try
  call gitxab#show_provider()
  echo "✓ gitxab#show_provider() callable"
catch /E117/
  echo "✗ gitxab#show_provider() NOT found (E117)"
catch
  echo "✓ gitxab#show_provider() exists (error: " . v:exception . ")"
endtry
echo ""

echo "=== Testing Denops Plugin ==="
if exists('*denops#plugin#is_loaded')
  if denops#plugin#is_loaded('gitxab')
    echo "✓ gitxab denops plugin is loaded"
  else
    echo "✗ gitxab denops plugin NOT loaded"
  endif
else
  echo "✗ denops#plugin#is_loaded NOT available"
endif
echo ""

echo "Press ENTER to exit..."
call getchar()
quit
EOF

# Run nvim with both denops and gitxab in runtimepath
echo "Starting Neovim test..."
echo "Using denops.vim from: $DENOPS_FOUND"
echo ""

nvim -u NONE \
  -c "set runtimepath^=${DENOPS_FOUND}" \
  -c "set runtimepath+=${PLUGIN_DIR}" \
  -c "runtime! plugin/**/*.vim" \
  -c "runtime! plugin/**/*.lua" \
  -S /tmp/gitxab_test.vim

# Clean up
rm -f /tmp/gitxab_test.vim

echo ""
echo "Test finished."
