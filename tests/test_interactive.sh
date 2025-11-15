#!/bin/bash
# Quick test for interactive navigation

echo "Testing GitXab interactive navigation..."
echo ""
echo "This test will:"
echo "1. Check if denops is installed"
echo "2. Verify the plugin files"
echo "3. Provide instructions for manual testing"
echo ""

# Check denops
if [ -d ~/.local/share/nvim/lazy/denops.vim ]; then
  echo "✓ denops.vim found"
else
  echo "✗ denops.vim not found"
  exit 1
fi

# Check plugin files
if [ -f denops/gitxab/main.ts ]; then
  echo "✓ Plugin main.ts exists"
else
  echo "✗ Plugin main.ts not found"
  exit 1
fi

# Check for syntax errors
echo ""
echo "Checking TypeScript syntax..."
deno check denops/gitxab/main.ts 2>&1 | grep -i error || echo "✓ No critical errors"

echo ""
echo "=== Manual Test Instructions ==="
echo ""
echo "1. Start Neovim:"
echo "   nvim"
echo ""
echo "2. Wait for denops to load, then run:"
echo "   :GitXabProjects"
echo ""
echo "3. You should see a project list. Try these keys:"
echo "   <Enter> - Open project menu (select Issues or MRs)"
echo "   q       - Close buffer"
echo ""
echo "4. When you select 'View Issues', it should open the issue list"
echo ""
echo "5. In the issue list, try these keys:"
echo "   q - Close buffer"
echo "   r - Refresh issue list"
echo ""
echo "=== Testing with public GitLab project ==="
echo ""
echo "You can also test directly with a project ID:"
echo "   :GitXabIssues 278964"
echo ""
echo "(Project 278964 is GitLab itself - public, no token needed)"
