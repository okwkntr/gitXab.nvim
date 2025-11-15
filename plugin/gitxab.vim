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
"   let $GITLAB_TOKEN = 'your-token'
"   let $GITLAB_BASE_URL = 'https://gitlab.com/api/v4'
"
" Or in init.lua:
"   vim.env.GITLAB_TOKEN = 'your-token'
"   vim.env.GITLAB_BASE_URL = 'https://gitlab.com/api/v4'
