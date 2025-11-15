" Test script for GitXab Issues feature
" Usage: nvim -u test_issues.vim

" Set up minimal runtime
set nocompatible
filetype plugin indent on
syntax on

" Add plugin to runtimepath
set runtimepath+=.
set runtimepath+=~/.local/share/nvim/lazy/denops.vim

" Load the plugin
runtime plugin/gitxab.vim

" Wait for denops to initialize
echo "Waiting for denops to initialize..."
sleep 2

" Test commands - uncomment one at a time:

" Test 1: List projects (should work from previous testing)
" :GitXabProjects

" Test 2: List issues for a project
" Replace <PROJECT_ID> with an actual GitLab project ID
" Example: :GitXabIssues 12345
" Example with state filter: :GitXabIssues 12345 opened

echo "Plugin loaded. Available commands:"
echo "  :GitXabProjects [query]"
echo "  :GitXabIssues <projectId> [state]"
echo ""
echo "Set GITLAB_TOKEN environment variable before testing"
