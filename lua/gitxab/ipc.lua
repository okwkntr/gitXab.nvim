local uv = vim.loop
local M = {}

local default_socket = vim.fn.getenv('GITXAB_SOCKET_PATH') or '/tmp/gitxab.sock'
local default_port = tonumber(vim.fn.getenv('GITXAB_PORT')) or 8765

-- Attempt UDS first, then TCP
function M.connect(opts)
  opts = opts or {}
  local socket_path = opts.socket_path or default_socket
  local host = opts.host or '127.0.0.1'
  local port = opts.port or default_port

  local pipe = uv.new_pipe(false)
  local connected = false
  local conn = { pipe = pipe }

  local function on_connect(err)
    if err then
      -- UDS connect failed; try TCP
      local tcp = uv.new_tcp()
      tcp:connect(host, port, function(err2)
        if err2 then
          conn.error = err2
        else
          conn.tcp = tcp
        end
      end)
    else
      conn.pipe = pipe
    end
  end

  -- Try UDS
  pcall(function() pipe:connect(socket_path, on_connect) end)

  return conn
end

-- send a single NDJSON request and wait for one-line response via TCP/UDS
function M.request(conn, obj, callback)
  local json = vim.fn.json_encode(obj) .. '\n'
  local writer
  if conn.tcp then
    writer = conn.tcp
    conn.tcp:write(json)
    conn.tcp:read_start(function(err, chunk)
      if err then
        callback(nil, err)
      elseif chunk then
        callback(vim.fn.json_decode(chunk), nil)
        conn.tcp:read_stop()
      end
    end)
  elseif conn.pipe then
    -- pipe uses uv.stdout-like API
    conn.pipe:write(json)
    conn.pipe:read_start(function(err, chunk)
      if err then
        callback(nil, err)
      elseif chunk then
        callback(vim.fn.json_decode(chunk), nil)
        conn.pipe:read_stop()
      end
    end)
  else
    callback(nil, conn.error or 'no connection')
  end
end

-- convenience
function M.list_projects(conn, q, cb)
  local id = math.floor(math.random() * 100000)
  M.request(conn, { id = id, method = 'list_projects', params = { q = q } }, cb)
end

return M
