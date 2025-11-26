" plugin/gitxab.vim
" GitXab.vim - GitLab integration plugin using denops.vim

if exists('g:loaded_gitxab')
  finish
endif
let g:loaded_gitxab = 1

" Check if denops.vim is available
if !exists('*denops#plugin#load')
  echohl WarningMsg
  echomsg 'GitXab: denops.vim is required. Please install vim-denops/denops.vim'
  echohl None
  finish
endif

" Load the denops plugin immediately
" The plugin will register commands when loaded
call gitxab#load()

" Configuration help
" Set these environment variables in your init.vim/init.lua:
"
" For GitLab:
"   let $GITLAB_TOKEN = 'your-token'
"   let $GITLAB_BASE_URL = 'https://gitlab.com/api/v4'
"
" For GitHub:
"   let $GITHUB_TOKEN = 'your-token'
"   let $GITHUB_BASE_URL = 'https://api.github.com' " (optional)
"
" Provider Selection:
"   let g:gitxab_provider = 'github'  " or 'gitlab' or 'auto' (default)
"
" Or in init.lua:
"   vim.env.GITHUB_TOKEN = 'your-token'
"   vim.g.gitxab_provider = 'github'

" Note: Commands are registered by the denops plugin when it loads
" Available commands:
"   :GitXabProjects [search]
"   :GitXabIssues <project_id> [state]
"   :GitXabCreateIssue <project_id>
"   :GitXabMRs <project_id>
"   :GitXabCreateMR <project_id>
"   :GitXabSetProvider github|gitlab
"   :GitXabShowProvider
