local M = {}
local ipc = require("gitxab.ipc")

-- プロジェクト一覧バッファを作成
local function create_projects_buffer()
  -- 新しいバッファを作成
  local buf = vim.api.nvim_create_buf(false, true)
  vim.api.nvim_buf_set_option(buf, "buftype", "nofile")
  vim.api.nvim_buf_set_option(buf, "swapfile", false)
  vim.api.nvim_buf_set_option(buf, "bufhidden", "wipe")
  vim.api.nvim_buf_set_option(buf, "filetype", "gitxab-projects")

  -- バッファを開く
  vim.api.nvim_command("vsplit")
  vim.api.nvim_win_set_buf(0, buf)

  return buf
end

-- プロジェクト一覧の取得と表示
function M.list_projects()
  local buf = create_projects_buffer()

  -- IPCクライアントを作成
  local client = ipc.connect()
  if not client then
    vim.api.nvim_err_writeln("GitXab: Failed to connect to backend")
    return
  end

  -- プロジェクト一覧をリクエスト
  local ok = client:send({
    id = 1,
    method = "list_projects",
    params = { q = "" },
  })

  if not ok then
    vim.api.nvim_err_writeln("GitXab: Failed to send request")
    return
  end

  -- レスポンスを受信して表示
  local resp = client:receive()
  if not resp then
    vim.api.nvim_err_writeln("GitXab: No response from backend")
    return
  end

  -- JSONをLuaテーブルに変換
  local ok, result = pcall(vim.json.decode, resp)
  if not ok or not result.result then
    vim.api.nvim_err_writeln("GitXab: Invalid response format")
    return
  end

  -- プロジェクト一覧を表示用に整形
  local lines = {}
  for _, project in ipairs(result.result) do
    table.insert(lines, string.format("%s - %s", project.name, project.description or ""))
  end

  -- バッファに表示
  vim.api.nvim_buf_set_lines(buf, 0, -1, false, lines)
end

function M.setup(opts)
  opts = opts or {}
  M.config = opts

  -- GitXabProjects コマンドを登録
  vim.api.nvim_create_user_command("GitXabProjects", function()
    M.list_projects()
  end, {})
end

return M
