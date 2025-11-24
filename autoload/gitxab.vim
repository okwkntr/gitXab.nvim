" autoload/gitxab.vim
" GitXab.vim autoload functions

function! gitxab#load() abort
  " Load the denops plugin if not already loaded
  if denops#plugin#is_loaded('gitxab')
    return
  endif
  
  if !exists('*denops#plugin#load')
    echohl WarningMsg
    echomsg 'GitXab: denops.vim is required but not found'
    echohl None
    return
  endif

  " Get the plugin root directory and load the denops plugin
  let l:plugin_root = expand('<sfile>:p:h:h')
  let l:denops_path = l:plugin_root . '/denops/gitxab/main.ts'
  
  " Load the denops plugin
  call denops#plugin#load('gitxab', l:denops_path)
  
  " Wait for plugin to be loaded
  call denops#plugin#wait('gitxab')
endfunction

function! gitxab#projects(...) abort
  " Call denops to list projects
  let query = get(a:, 1, '')
  call denops#request('gitxab', 'listProjects', [query])
endfunction

function! gitxab#issues(...) abort
  " Call denops to list/show issues
  if a:0 >= 2
    let project_id = a:1
    let issue_iid = a:2
    call denops#request('gitxab', 'getIssue', [project_id, issue_iid])
  else
    echohl ErrorMsg
    echomsg 'GitXab: Usage: GitXabIssues <project_id> <issue_iid>'
    echohl None
  endif
endfunction

function! gitxab#merge_requests(...) abort
  " Call denops to list merge requests
  if a:0 >= 1
    let project_id = a:1
    call denops#request('gitxab', 'listMergeRequests', [project_id])
  else
    echohl ErrorMsg
    echomsg 'GitXab: Usage: GitXabMRs <project_id>'
    echohl None
  endif
endfunction
