# プロバイダー切り替えガイド

GitXabは複数のGitホスティングプラットフォーム(GitHubとGitLab)をサポートしています。このガイドでは、プロバイダーの切り替え方法を説明します。

## 自動検出

GitXabはデフォルトで、以下の順序でプロバイダーを自動検出します:

1. **Vim変数** `g:gitxab_provider` の値
2. **gitリモートURL** - リポジトリのリモートURLから検出
3. **環境変数** - トークンの存在から推測

### gitリモートURLからの検出

```bash
# GitHubリポジトリの場合
git remote -v
# origin  https://github.com/user/repo.git (fetch)
# → 自動的にGitHubプロバイダーを使用

# GitLabリポジトリの場合  
git remote -v
# origin  https://gitlab.com/user/repo.git (fetch)
# → 自動的にGitLabプロバイダーを使用
```

## 手動でプロバイダーを指定

### 方法1: Vim変数で設定

```vim
" init.vim または .vimrc
let g:gitxab_provider = 'github'  " または 'gitlab', 'auto'
```

```lua
-- init.lua
vim.g.gitxab_provider = 'github'  -- または 'gitlab', 'auto'
```

### 方法2: コマンドでランタイム切り替え

```vim
" GitHubに切り替え
:GitXabSetProvider github

" GitLabに切り替え
:GitXabSetProvider gitlab

" 現在のプロバイダーを確認
:GitXabShowProvider
```

## 認証設定

各プロバイダーに対応するトークンを設定してください。

### GitHub

```bash
# 環境変数
export GITHUB_TOKEN="ghp_your_github_token"
# または
export GH_TOKEN="ghp_your_github_token"

# オプション: カスタムベースURL(セルフホスト環境向け)
export GITHUB_BASE_URL="https://github.example.com/api/v3"
```

```vim
" Neovim設定 (init.vim)
let $GITHUB_TOKEN = 'ghp_your_github_token'
```

```lua
-- Neovim設定 (init.lua)
vim.env.GITHUB_TOKEN = 'ghp_your_github_token'
```

**トークンの取得:**
1. https://github.com/settings/tokens にアクセス
2. "Generate new token (classic)" をクリック
3. スコープを選択: `repo`, `read:user`
4. トークンを生成してコピー

### GitLab

```bash
# 環境変数
export GITLAB_TOKEN="glpat_your_gitlab_token"

# オプション: カスタムベースURL(セルフホスト環境向け)
export GITLAB_BASE_URL="https://gitlab.example.com/api/v4"
```

```vim
" Neovim設定 (init.vim)
let $GITLAB_TOKEN = 'glpat_your_gitlab_token'
```

```lua
-- Neovim設定 (init.lua)
vim.env.GITLAB_TOKEN = 'glpat_your_gitlab_token'
```

**トークンの取得:**
1. https://gitlab.com/-/profile/personal_access_tokens にアクセス
2. "Add new token" をクリック
3. スコープを選択: `api`, `read_user`, `read_api`
4. トークンを生成してコピー

## 使用例

### GitHubリポジトリでの作業

```vim
" 1. GitHubプロバイダーを設定
:let g:gitxab_provider = 'github'

" 2. リポジトリ一覧を表示
:GitXabProjects

" 3. イシュー一覧を表示 (owner/repoまたは数値ID)
:GitXabIssues microsoft/vscode

" 4. プルリクエスト一覧を表示
:GitXabMRs microsoft/vscode
```

### GitLabプロジェクトでの作業

```vim
" 1. GitLabプロバイダーを設定
:let g:gitxab_provider = 'gitlab'

" 2. プロジェクト一覧を表示
:GitXabProjects

" 3. イシュー一覧を表示 (数値プロジェクトID)
:GitXabIssues 12345

" 4. マージリクエスト一覧を表示
:GitXabMRs 12345
```

### 複数プロバイダーの切り替え

```vim
" GitHubの作業
:GitXabSetProvider github
:GitXabProjects
" → GitHubリポジトリが表示される

" GitLabに切り替え
:GitXabSetProvider gitlab
:GitXabProjects
" → GitLabプロジェクトが表示される

" 現在のプロバイダーを確認
:GitXabShowProvider
" → 出力: GitXab: Current provider is gitlab (https://gitlab.com/api/v4)
```

## トラブルシューティング

### プロバイダーが正しく検出されない

1. トークンが正しく設定されているか確認:
   ```vim
   :echo $GITHUB_TOKEN
   :echo $GITLAB_TOKEN
   ```

2. Vim変数が正しく設定されているか確認:
   ```vim
   :echo g:gitxab_provider
   ```

3. リモートURLを確認:
   ```bash
   git remote -v
   ```

### 認証エラー

- トークンが正しいスコープを持っているか確認
- トークンの有効期限が切れていないか確認
- セルフホスト環境の場合、BASE_URLが正しいか確認

### コマンドが見つからない

denops.vimが正しくインストールされているか確認:
```vim
:echo exists('*denops#plugin#load')
" → 1 が表示されるはずです
```

## 設定ファイルによる管理

`~/.config/gitxab/config.json` でプロバイダー設定を管理することもできます:

```json
{
  "defaultProvider": "github",
  "providers": {
    "github": {
      "token": "ghp_your_github_token",
      "baseUrl": "https://api.github.com"
    },
    "gitlab": {
      "token": "glpat_your_gitlab_token",
      "baseUrl": "https://gitlab.com/api/v4"
    }
  }
}
```

## コマンドリファレンス

| コマンド | 説明 |
|---------|------|
| `:GitXabSetProvider github\|gitlab` | プロバイダーを切り替え |
| `:GitXabShowProvider` | 現在のプロバイダーとベースURLを表示 |
| `:GitXabProjects [検索語]` | プロジェクト/リポジトリ一覧を表示 |
| `:GitXabIssues <id> [state]` | イシュー一覧を表示 |
| `:GitXabMRs <id>` | マージリクエスト/プルリクエスト一覧を表示 |

## より詳しい情報

- [プロバイダーガイド](../deno-backend/PROVIDER_GUIDE.md) - バックエンドAPI詳細
- [使用例](../deno-backend/examples/provider_example.ts) - コード例
- [README](../README.md) - 全体的な使い方
