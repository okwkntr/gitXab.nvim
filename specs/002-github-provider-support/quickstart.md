# Quick Start: GitHub Provider Support

このガイドでは、GitHubプロバイダーサポートの実装を開始する方法を説明します。

## 前提条件

- GitXab.vim v0.2.0（GitLab機能完全実装済み）
- GitHub Personal Access Token
- テスト用GitHubリポジトリ

## セットアップ

### 1. GitHub Token取得

1. GitHub → Settings → Developer settings → Personal access tokens → Tokens
   (classic)
2. "Generate new token (classic)" をクリック
3. 必要なスコープ:
   - ✅ `repo` - Full control of private repositories
   - ✅ `read:org` - Read org and team membership (optional)
4. トークンをコピー（`ghp_xxxxxxxxxxxxxxxxxxxx`）

### 2. 環境変数設定

```bash
# ~/.bashrc or ~/.zshrc
export GITHUB_TOKEN='ghp_xxxxxxxxxxxxxxxxxxxx'
```

### 3. テストリポジトリ準備

```bash
# テスト用の公開リポジトリを作成
# または既存のリポジトリを使用
```

## 開発環境

### ブランチ作成

```bash
cd /path/to/gitXab.nvim
git checkout -b 002-github-provider-support
```

### ディレクトリ構造（予定）

```
deno-backend/
├── src/
│   ├── providers/
│   │   ├── provider.ts          # [NEW] Provider interface
│   │   ├── gitlab_provider.ts   # [NEW] GitLab wrapper
│   │   └── github_provider.ts   # [NEW] GitHub implementation
│   ├── services/
│   │   ├── gitlab_client.ts     # [EXISTING] 既存
│   │   └── github_client.ts     # [NEW] GitHub API client
│   ├── models/
│   │   ├── common.ts            # [NEW] 統一データモデル
│   │   ├── gitlab.ts            # [NEW] GitLab型定義
│   │   └── github.ts            # [NEW] GitHub型定義
│   └── config/
│       └── provider_config.ts   # [NEW] プロバイダー設定

tests/
├── unit/
│   └── github_client_test.ts    # [NEW]
├── integration/
│   └── provider_test.ts         # [NEW]
└── contract/
    └── github_api_test.ts       # [NEW]
```

## 実装の流れ

### Phase 1: 基盤整備（1-2日）

```bash
# T101: Provider interface作成
touch deno-backend/src/providers/provider.ts

# T102: 統一データモデル
touch deno-backend/src/models/common.ts

# T103: GitHub型定義
touch deno-backend/src/models/github.ts
```

**確認方法:**

```bash
deno check deno-backend/src/providers/provider.ts
deno check deno-backend/src/models/common.ts
```

### Phase 2: GitHub API実装（3-5日）

```bash
# T107: GitHub client skeleton
touch deno-backend/src/services/github_client.ts

# 基本的なテスト
touch tests/unit/github_client_test.ts
deno test --allow-env --allow-net tests/unit/github_client_test.ts
```

**動作確認:**

```bash
# 簡単なテストスクリプト
cat > test_github.ts << 'EOF'
import { listRepositories } from "./deno-backend/src/services/github_client.ts";

const repos = await listRepositories();
console.log(`Found ${repos.length} repositories`);
repos.slice(0, 3).forEach(r => {
  console.log(`- ${r.full_name}: ${r.description}`);
});
EOF

deno run --allow-env --allow-net test_github.ts
```

### Phase 3: Provider統合（2-3日）

```bash
# T113: GitLabProvider
touch deno-backend/src/providers/gitlab_provider.ts

# T114: GitHubProvider
touch deno-backend/src/providers/github_provider.ts

# T115: ProviderFactory
touch deno-backend/src/providers/provider_factory.ts
```

**確認方法:**

```typescript
// test_provider.ts
import { ProviderFactory } from "./deno-backend/src/providers/provider_factory.ts";

const provider = ProviderFactory.create("github");
const repos = await provider.listRepositories();
console.log("Repositories:", repos.length);
```

### Phase 4: UI統合（2-3日）

denops/gitxab/main.tsの変更:

```typescript
// Before (GitLab専用)
const projects = await listProjects(query);

// After (Provider統合)
const provider = await ProviderFactory.getCurrentProvider();
const repositories = await provider.listRepositories(query);
```

### Phase 5: テストと文書化（2-3日）

```bash
# すべてのテストを実行
deno test --allow-env --allow-read --allow-net

# ドキュメント更新
# docs/installation.md
# docs/configuration.md
# docs/providers.md (新規)
```

## マイルストーン

### Milestone 1: 基盤完成（Week 1）

- [ ] Provider interface
- [ ] 統一データモデル
- [ ] GitHub型定義
- [ ] 設定システム

### Milestone 2: GitHub API（Week 2）

- [ ] GitHub client実装
- [ ] 全エンドポイント動作
- [ ] ユニットテスト通過

### Milestone 3: Provider統合（Week 3）

- [ ] GitLab/GitHubプロバイダー実装
- [ ] Factory pattern
- [ ] キャッシュ統合

### Milestone 4: UI統合（Week 4）

- [ ] Denopsプラグイン更新
- [ ] プロバイダー切り替え
- [ ] E2Eテスト

### Milestone 5: リリース準備（Week 5）

- [ ] ドキュメント完成
- [ ] すべてのテスト通過
- [ ] v0.3.0リリース

## 簡易テスト手順

### 1. GitHub API直接テスト

```bash
# Repository一覧
curl -H "Authorization: Bearer $GITHUB_TOKEN" \
     -H "Accept: application/vnd.github.v3+json" \
     https://api.github.com/user/repos | jq '.[0:3]'

# Issue一覧
curl -H "Authorization: Bearer $GITHUB_TOKEN" \
     -H "Accept: application/vnd.github.v3+json" \
     https://api.github.com/repos/owner/repo/issues | jq '.[0:3]'
```

### 2. Deno実装テスト

```bash
# GitHub client単体テスト
deno test --allow-env --allow-net tests/unit/github_client_test.ts

# Provider統合テスト
deno test --allow-env --allow-net tests/integration/provider_test.ts
```

### 3. Neovimでの動作確認

```vim
" Neovimで実行
:GitXabProvider github
:GitXabProjects

" GitHubリポジトリ一覧が表示されることを確認
```

## トラブルシューティング

### GitHub Token認証エラー

```
Error: Unauthorized: GitHub token is missing or invalid
```

**解決策:**

```bash
# トークンが設定されているか確認
echo $GITHUB_TOKEN

# トークンが有効か確認
curl -H "Authorization: Bearer $GITHUB_TOKEN" https://api.github.com/user
```

### レート制限エラー

```
Error: Rate limited. Retry after: 3600
```

**解決策:**

```bash
# レート制限状況を確認
curl -H "Authorization: Bearer $GITHUB_TOKEN" https://api.github.com/rate_limit
```

### 型エラー

```
error: Property 'full_name' does not exist on type 'Repository'
```

**解決策:**

- `data-model.md`を参照して統一型を確認
- GitHub/GitLabプロバイダーで正しく変換されているか確認

## 参考リソース

- [GitHub REST API Documentation](https://docs.github.com/en/rest)
- [GitHub API Rate Limiting](https://docs.github.com/en/rest/overview/resources-in-the-rest-api#rate-limiting)
- [Deno HTTP Client](https://deno.land/manual/runtime/http_server_apis)
- GitXab.vim existing code: `deno-backend/src/services/gitlab_client.ts`

## 次のステップ

1. **Phase 1から開始** - `specs/002-github-provider-support/tasks.md`のT101から
2. **小さく実装、頻繁にテスト** - 各タスク完了後にテスト実行
3. **既存機能への影響確認** - GitLab機能が壊れていないか常に確認
4. **ドキュメント更新** - 実装と並行してドキュメントも更新

## コミット例

```bash
# Phase 1
git add deno-backend/src/providers/provider.ts
git commit -m "feat: Add Provider interface for multi-provider support (T101)"

# Phase 2
git add deno-backend/src/services/github_client.ts
git commit -m "feat: Implement GitHub API client with repository operations (T107-T108)"

# Phase 3
git add deno-backend/src/providers/github_provider.ts
git commit -m "feat: Implement GitHubProvider with unified data models (T114)"
```

## 成功基準チェックリスト

Phase完了時に以下を確認:

- [ ] すべてのユニットテストが通過
- [ ] 既存GitLab機能が正常動作（回帰テストクリア）
- [ ] 新機能が仕様通り動作
- [ ] ドキュメントが更新されている
- [ ] コードレビュー可能な状態
- [ ] パフォーマンス目標達成（< 500ms）

---

**準備完了！** 実装を開始しましょう 🚀
