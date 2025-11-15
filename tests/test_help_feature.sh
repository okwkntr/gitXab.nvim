#!/bin/bash
# Test for keyboard shortcut help feature

echo "Testing Keyboard Shortcut Help Feature"
echo "======================================"
echo ""

# Check syntax
echo "Checking TypeScript syntax..."
deno check denops/gitxab/main.ts 2>&1 | grep -i error || echo "✓ No syntax errors"

echo ""
echo "=== Manual Test Instructions ==="
echo ""
echo "Test 1: Project List Help"
echo "  1. Run: :GitXabProjects"
echo "  2. Check header shows: Keys: <Enter>=Menu  q=Close  ?=Help"
echo "  3. Press ? key"
echo "  4. Expected: Help message displays keyboard shortcuts"
echo ""

echo "Test 2: Issue List Help"
echo "  1. Run: :GitXabIssues 278964"
echo "  2. Check header shows: Keys: <Enter>=Detail  n=New  r=Refresh  q=Close  ?=Help"
echo "  3. Press ? key"
echo "  4. Expected: Help message displays issue list shortcuts"
echo ""

echo "Test 3: Issue Detail Help"
echo "  1. From issue list, press <Enter> on any issue"
echo "  2. Check header shows: Keys: c=Comment  e=Edit  r=Refresh  q=Close  ?=Help"
echo "  3. Press ? key"
echo "  4. Expected: Help message displays issue detail shortcuts"
echo ""

echo "=== Verification Checklist ==="
echo "  [ ] All buffers show keyboard shortcuts in header"
echo "  [ ] ? key works in project list"
echo "  [ ] ? key works in issue list"
echo "  [ ] ? key works in issue detail"
echo "  [ ] Help messages are clear and complete"
