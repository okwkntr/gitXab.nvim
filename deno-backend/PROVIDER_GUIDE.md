# GitXab Multi-Provider Support

GitXabは、GitLabとGitHubの両方をサポートする統一されたインターフェースを提供します。

## クイックスタート

### 自動プロバイダー検出

```typescript
import { createProvider } from "./deno-backend/mod.ts";

// Git remoteまたは環境変数から自動検出
const provider = await createProvider();

// リポジトリ一覧
const repos = await provider.listRepositories();
console.log(repos);

// Issue一覧
const issues = await provider.listIssues("owner/repo");
console.log(issues);
```

### GitHub専用

```typescript
import { createGitHubProvider } from "./deno-backend/mod.ts";

// GitHub専用プロバイダー
const github = await createGitHubProvider();

// Pull Request一覧
const prs = await github.listPullRequests("octocat/Hello-World");
console.log(prs);

// Issue作成
const issue = await github.createIssue("owner/repo", {
  title: "Bug report",
  body: "Found a bug",
  labels: ["bug"],
});
```

## 環境設定

### 環境変数

```bash
# GitHub
export GITHUB_TOKEN="ghp_your_token_here"
# または
export GH_TOKEN="ghp_your_token_here"

# GitLab
export GITLAB_TOKEN="glpat-your_token_here"
export GITLAB_BASE_URL="https://gitlab.com"  # オプション
```

### 設定ファイル

`~/.config/gitxab/config.json`:

```json
{
  "defaultProvider": "github",
  "providers": {
    "github": {
      "token": "ghp_your_token_here",
      "baseUrl": "https://api.github.com"
    },
    "gitlab": {
      "token": "glpat-your_token_here",
      "baseUrl": "https://gitlab.com"
    }
  }
}
```

## プロバイダー検出の優先順位

1. 明示的な指定（`createProvider({ provider: "github" })`）
2. 設定ファイルの`defaultProvider`
3. Git remote URL（`git remote get-url origin`から自動検出）
4. 環境変数（`GITHUB_TOKEN`または`GITLAB_TOKEN`の存在）
5. デフォルト: GitLab（後方互換性のため）

## API例

### リポジトリ操作

```typescript
// リポジトリ一覧
const repos = await provider.listRepositories();

// リポジトリ詳細
const repo = await provider.getRepository("owner/repo");
console.log(repo.name, repo.description);
```

### Issue操作

```typescript
// Issue一覧（オープンのみ）
const openIssues = await provider.listIssues("owner/repo", "open");

// Issue詳細
const issue = await provider.getIssue("owner/repo", 123);

// Issue作成
const newIssue = await provider.createIssue("owner/repo", {
  title: "New feature request",
  body: "Please add this feature",
  labels: ["enhancement"],
  assignees: ["username"],
});

// Issue更新
await provider.updateIssue("owner/repo", 123, {
  state: "closed",
  labels: ["wontfix"],
});
```

### Pull Request / Merge Request操作

```typescript
// PR一覧
const prs = await provider.listPullRequests("owner/repo", "open");

// PR詳細
const pr = await provider.getPullRequest("owner/repo", 456);

// PR作成
const newPr = await provider.createPullRequest("owner/repo", {
  title: "Add new feature",
  body: "This PR adds...",
  sourceBranch: "feature/new-feature",
  targetBranch: "main",
  draft: false,
});

// PR差分取得
const diff = await provider.getPullRequestDiff("owner/repo", 456);
console.log(`Changed files: ${diff.files.length}`);
console.log(`+${diff.totalAdditions} -${diff.totalDeletions}`);
```

### コメント操作

```typescript
// コメント一覧
const comments = await provider.getComments("owner/repo", 123);

// コメント作成
await provider.createComment("owner/repo", 123, "Great work!");
```

### ブランチ操作

```typescript
// ブランチ一覧
const branches = await provider.listBranches("owner/repo");

// デフォルトブランチを見つける
const defaultBranch = branches.find(b => b.default);
console.log(`Default branch: ${defaultBranch?.name}`);
```

## 型定義

すべてのプロバイダーは統一されたインターフェースを実装します:

```typescript
interface Provider {
  readonly name: 'gitlab' | 'github';
  readonly baseUrl: string;
  
  listRepositories(query?: string): Promise<Repository[]>;
  getRepository(id: string | number): Promise<Repository>;
  
  listIssues(repoId: string | number, state?: string): Promise<Issue[]>;
  getIssue(repoId: string | number, issueNumber: number): Promise<Issue>;
  createIssue(repoId: string | number, params: CreateIssueParams): Promise<Issue>;
  updateIssue(repoId: string | number, issueNumber: number, params: UpdateIssueParams): Promise<Issue>;
  
  listPullRequests(repoId: string | number, state?: string): Promise<PullRequest[]>;
  getPullRequest(repoId: string | number, number: number): Promise<PullRequest>;
  createPullRequest(repoId: string | number, params: CreatePullRequestParams): Promise<PullRequest>;
  
  getComments(repoId: string | number, issueNumber: number): Promise<Comment[]>;
  createComment(repoId: string | number, issueNumber: number, body: string): Promise<Comment>;
  
  listBranches(repoId: string | number): Promise<Branch[]>;
  getPullRequestDiff(repoId: string | number, number: number): Promise<PullRequestDiff>;
}
```

## テスト

```bash
# すべてのテスト（外部依存なし）
./run_tests.sh

# ユニットテストのみ
./run_tests.sh unit

# GitLabテスト含む
./run_tests.sh full
```

## アーキテクチャ

```
deno-backend/
├── src/
│   ├── providers/           # プロバイダー抽象化
│   │   ├── provider.ts      # インターフェース定義
│   │   ├── github_provider.ts      # GitHub実装
│   │   ├── github_converter.ts     # GitHub→統一モデル変換
│   │   └── provider_factory.ts    # ファクトリー
│   ├── services/
│   │   ├── github_client.ts        # GitHub REST API
│   │   └── gitlab_client.ts        # GitLab API（既存）
│   ├── models/
│   │   ├── common.ts               # 統一データモデル
│   │   └── github.ts               # GitHub型定義
│   ├── config/
│   │   └── provider_config.ts      # 設定管理
│   └── auth/
│       └── provider_auth.ts        # 認証管理
└── mod.ts                   # メインエクスポート
```

## 実装状況

- ✅ **GitHub**: 完全サポート
  - REST API v3
  - 自動リトライ
  - レート制限監視
  - 統一インターフェース

- ⏳ **GitLab**: レガシーAPI（直接呼び出し）
  - 今後、統一インターフェースに移行予定

## 今後の予定

1. GitLabProviderの統一インターフェース実装
2. Vim/Neovimプラグインでのプロバイダー切り替え対応
3. キャッシュ機能の統合
4. エラーハンドリングの改善
5. ページネーション対応
