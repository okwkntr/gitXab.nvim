-- plugin entrypoint for Neovim
local ok, gitxab = pcall(require, 'gitxab')
if not ok then
  return
end

-- Default setup (can be overridden in user's init.lua)
gitxab.setup()
