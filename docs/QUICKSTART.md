# GitXab.vim クイックスタート

GitXab.vimでGitHubとGitLabを使い始めるための最速ガイド。

## 1. インストール

### 必要なもの

- Neovim 0.7+
- Deno 1.x
- denops.vim

### lazy.nvimでインストール

```lua
-- ~/.config/nvim/lua/plugins/gitxab.lua
return {
  {
    'vim-denops/denops.vim',
    lazy = false,
  },
  {
    'your-org/gitxab.vim',
    dependencies = { 'vim-denops/denops.vim' },
    config = function()
      -- GitHubを使う場合
      vim.env.GITHUB_TOKEN = 'ghp_your_github_token'
      
      -- GitLabを使う場合
      vim.env.GITLAB_TOKEN = 'glpat_your_gitlab_token'
      
      -- プロバイダーを指定（オプション、デフォルトは自動検出）
      vim.g.gitxab_provider = 'github'  -- 'github', 'gitlab', 'auto'
    end,
  },
}
```

## 2. トークンの取得

### GitHub

1. https://github.com/settings/tokens にアクセス
2. "Generate new token (classic)" をクリック
3. スコープを選択: `repo`, `read:user`
4. トークンを生成してコピー

### GitLab

1. https://gitlab.com/-/profile/personal_access_tokens にアクセス
2. "Add new token" をクリック
3. スコープを選択: `api`, `read_user`, `read_api`
4. トークンを生成してコピー

## 3. 基本的な使い方

### プロバイダーの切り替え

```vim
" GitHubに切り替え
:GitXabSetProvider github

" GitLabに切り替え
:GitXabSetProvider gitlab

" 現在のプロバイダーを確認
:GitXabShowProvider
```

### プロジェクト/リポジトリの表示

```vim
" 全リポジトリを表示
:GitXabProjects

" 検索
:GitXabProjects my-project
```

**キー操作:**

- `<Enter>` - プロジェクトメニューを開く
- `q` - 閉じる

### イシューの表示

```vim
" GitHubの場合（owner/repo形式）
:GitXabIssues microsoft/vscode

" GitLabの場合（プロジェクトID）
:GitXabIssues 12345

" オープンなイシューのみ
:GitXabIssues microsoft/vscode opened
```

**キー操作:**

- `<Enter>` - イシュー詳細を表示
- `n` - 新しいイシューを作成
- `r` - リストを更新
- `q` - 閉じる

### プルリクエスト/マージリクエストの表示

```vim
" GitHubの場合
:GitXabMRs microsoft/vscode

" GitLabの場合
:GitXabMRs 12345
```

**キー操作:**

- `<Enter>` - PR/MR詳細を表示
- `n` - 新しいPR/MRを作成
- `d` - 差分を表示（詳細画面から）
- `c` - コメントを追加
- `q` - 閉じる

## 4. 設定例

### init.lua での設定

```lua
-- ~/.config/nvim/init.lua

-- トークンの設定
vim.env.GITHUB_TOKEN = 'ghp_your_github_token'
vim.env.GITLAB_TOKEN = 'glpat_your_gitlab_token'

-- デフォルトプロバイダー（オプション）
vim.g.gitxab_provider = 'auto'  -- gitリモートから自動検出

-- セルフホスト環境の場合（オプション）
-- vim.env.GITHUB_BASE_URL = 'https://github.example.com/api/v3'
-- vim.env.GITLAB_BASE_URL = 'https://gitlab.example.com/api/v4'
```

### 環境変数での設定

```bash
# ~/.bashrc または ~/.zshrc

# GitHub
export GITHUB_TOKEN="ghp_your_github_token"

# GitLab
export GITLAB_TOKEN="glpat_your_gitlab_token"
```

## 5. よくある使い方

### GitHub上の特定リポジトリで作業

```vim
" 1. GitHubプロバイダーに切り替え
:GitXabSetProvider github

" 2. リポジトリのイシューを表示
:GitXabIssues microsoft/vscode opened

" 3. プルリクエストを表示
:GitXabMRs microsoft/vscode

" 4. 新しいイシューを作成
:GitXabCreateIssue microsoft/vscode
```

### GitLabプロジェクトで作業

```vim
" 1. GitLabプロバイダーに切り替え
:GitXabSetProvider gitlab

" 2. プロジェクト一覧から選択
:GitXabProjects
" <Enter>でメニューを開く

" 3. イシューやMRを確認
:GitXabIssues 12345
:GitXabMRs 12345
```

### 複数プロバイダーを切り替えて使う

```vim
" GitHubで作業
:GitXabSetProvider github
:GitXabProjects
:GitXabIssues owner/repo

" GitLabに切り替え
:GitXabSetProvider gitlab
:GitXabProjects
:GitXabIssues 12345

" 現在のプロバイダーを確認
:GitXabShowProvider
```

## 6. トラブルシューティング

### コマンドが見つからない

```vim
" denopsプラグインがロードされているか確認
:echo denops#plugin#is_loaded('gitxab')

" プラグインをリロード
:call denops#plugin#reload('gitxab')
```

### プロジェクトが表示されない

```vim
" トークンが設定されているか確認
:echo $GITHUB_TOKEN
:echo $GITLAB_TOKEN

" プロバイダーが正しいか確認
:GitXabShowProvider
```

### デバッグモード

```vim
" デバッグログを有効化
:let $GITXAB_DEBUG = "1"
:call denops#plugin#reload('gitxab')
:GitXabProjects

" メッセージを確認
:messages
```

## 7. 次のステップ

詳しい使い方は以下のドキュメントを参照：

- **Vimヘルプ**: `:help gitxab`
- **プロバイダー切り替えガイド**: `docs/PROVIDER_SWITCHING.md`
- **プロバイダーAPI詳細**: `deno-backend/PROVIDER_GUIDE.md`
- **README**: `README.md`

## 利用可能なコマンド一覧

| コマンド                            | 説明                                |
| ----------------------------------- | ----------------------------------- |
| `:GitXabProjects [search]`          | プロジェクト/リポジトリ一覧         |
| `:GitXabIssues <id> [state]`        | イシュー一覧                        |
| `:GitXabCreateIssue <id>`           | 新しいイシューを作成                |
| `:GitXabMRs <id>`                   | マージリクエスト/プルリクエスト一覧 |
| `:GitXabCreateMR <id>`              | 新しいMR/PRを作成                   |
| `:GitXabSetProvider github\|gitlab` | プロバイダーを切り替え              |
| `:GitXabShowProvider`               | 現在のプロバイダーを表示            |

---

何か問題があれば、GitHubのIssuesで報告してください！
