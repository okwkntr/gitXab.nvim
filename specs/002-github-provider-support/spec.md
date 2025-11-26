# GitHub Provider Support - Specification

**Feature ID:** 002-github-provider-support  
**Status:** Planning  
**Priority:** P1  
**Target Version:** v0.3.0  
**Dependencies:** 001-gitlab-vim-integration (Complete)

## 概要

GitXab.vimにGitHubプロバイダーサポートを追加し、GitLabとGitHubの両方のプラットフォームで統一されたインターフェースを提供します。

## 目標

1. **マルチプロバイダーアーキテクチャ** - GitLabとGitHubを抽象化した統一インターフェース
2. **GitHub API統合** - GitHub REST API v3との完全統合
3. **プロバイダー自動検出** - リポジトリURLやトークンから自動判別
4. **統一されたUX** - GitLabとGitHubで同じコマンドとキーバインド
5. **既存機能の互換性維持** - GitLab機能への影響なし

## 機能要件

### 1. プロバイダー抽象化層

#### 1.1 Provider Interface
```typescript
interface Provider {
  name: 'gitlab' | 'github';
  
  // Repository operations
  listRepositories(query?: string): Promise<Repository[]>;
  getRepository(id: string | number): Promise<Repository>;
  
  // Issue operations
  listIssues(repoId: string | number, state?: string): Promise<Issue[]>;
  getIssue(repoId: string | number, issueNumber: number): Promise<Issue>;
  createIssue(repoId: string | number, params: CreateIssueParams): Promise<Issue>;
  updateIssue(repoId: string | number, issueNumber: number, params: UpdateIssueParams): Promise<Issue>;
  
  // Pull Request / Merge Request operations
  listPullRequests(repoId: string | number, state?: string): Promise<PullRequest[]>;
  getPullRequest(repoId: string | number, number: number): Promise<PullRequest>;
  createPullRequest(repoId: string | number, params: CreatePRParams): Promise<PullRequest>;
  
  // Comment operations
  getIssueComments(repoId: string | number, issueNumber: number): Promise<Comment[]>;
  createIssueComment(repoId: string | number, issueNumber: number, body: string): Promise<Comment>;
  
  // Branch operations
  listBranches(repoId: string | number): Promise<Branch[]>;
  
  // Diff operations
  getPullRequestDiff(repoId: string | number, number: number): Promise<Diff>;
}
```

#### 1.2 統一データモデル
```typescript
interface Repository {
  id: string | number;
  name: string;
  fullName: string;  // owner/repo format
  description: string | null;
  url: string;
  defaultBranch: string;
  provider: 'gitlab' | 'github';
}

interface Issue {
  id: string | number;
  number: number;  // Issue/PR番号（GitLab: iid, GitHub: number）
  title: string;
  body: string | null;
  state: 'open' | 'closed';
  author: User;
  labels: string[];
  createdAt: string;
  updatedAt: string;
  url: string;
}

interface PullRequest {
  id: string | number;
  number: number;
  title: string;
  body: string | null;
  state: 'open' | 'closed' | 'merged';
  author: User;
  sourceBranch: string;
  targetBranch: string;
  createdAt: string;
  updatedAt: string;
  mergedAt: string | null;
  url: string;
}
```

### 2. GitHub API Client

#### 2.1 認証
- **Personal Access Token (PAT)** - 環境変数 `GITHUB_TOKEN`
- **Fine-grained PAT** - より細かい権限制御
- OAuth App トークン（将来）

必要なスコープ:
- `repo` - リポジトリへのフルアクセス
- `read:org` - 組織リポジトリの読み取り（オプション）

#### 2.2 エンドポイント
- Base URL: `https://api.github.com`
- GraphQL API: `https://api.github.com/graphql` (将来)
- Rate Limit: 5000 requests/hour (authenticated)

#### 2.3 主要API
- `GET /user/repos` - ユーザーのリポジトリ一覧
- `GET /repos/{owner}/{repo}` - リポジトリ詳細
- `GET /repos/{owner}/{repo}/issues` - Issue一覧
- `GET /repos/{owner}/{repo}/issues/{number}` - Issue詳細
- `POST /repos/{owner}/{repo}/issues` - Issue作成
- `PATCH /repos/{owner}/{repo}/issues/{number}` - Issue更新
- `GET /repos/{owner}/{repo}/pulls` - PR一覧
- `GET /repos/{owner}/{repo}/pulls/{number}` - PR詳細
- `POST /repos/{owner}/{repo}/pulls` - PR作成
- `GET /repos/{owner}/{repo}/issues/{number}/comments` - コメント一覧
- `POST /repos/{owner}/{repo}/issues/{number}/comments` - コメント作成
- `GET /repos/{owner}/{repo}/branches` - ブランチ一覧
- `GET /repos/{owner}/{repo}/pulls/{number}/files` - PR差分

### 3. プロバイダー検出と設定

#### 3.1 自動検出
```typescript
// Git remoteから検出
function detectProviderFromGit(): Provider | null {
  const remote = execSync('git remote get-url origin').toString();
  if (remote.includes('github.com')) return 'github';
  if (remote.includes('gitlab.com') || remote.includes('gitlab')) return 'gitlab';
  return null;
}

// トークンの存在から検出
function detectProviderFromTokens(): Provider[] {
  const providers: Provider[] = [];
  if (Deno.env.get('GITLAB_TOKEN')) providers.push('gitlab');
  if (Deno.env.get('GITHUB_TOKEN')) providers.push('github');
  return providers;
}
```

#### 3.2 設定ファイル
```json
// ~/.config/gitxab/config.json
{
  "defaultProvider": "github",
  "providers": {
    "gitlab": {
      "baseUrl": "https://gitlab.com/api/v4",
      "token": "glpat-xxx"
    },
    "github": {
      "baseUrl": "https://api.github.com",
      "token": "ghp_xxx"
    }
  }
}
```

### 4. ユーザーインターフェース

#### 4.1 コマンド拡張
```vim
" 既存コマンド（プロバイダー自動検出）
:GitXabProjects [query]
:GitXabIssues <repo_id>
:GitXabPRs <repo_id>  " MRs の代わりに PRs を使用可能に

" プロバイダー指定コマンド
:GitXabGitHubRepos [query]
:GitXabGitLabProjects [query]

" プロバイダー切り替え
:GitXabProvider github
:GitXabProvider gitlab
```

#### 4.2 バッファ表示
```
GitXab: Repositories (GitHub)
===============================================
1. owner/repo-name ⭐ 123        [GitHub]
   Description of the repository
   Updated: 2 hours ago

2. owner/another-repo ⭐ 456     [GitHub]
   Another repository
   Updated: 1 day ago

[?] Help  [<CR>] Open  [r] Reload  [p] Switch Provider  [q] Quit
```

#### 4.3 プロバイダー表示
- リポジトリ一覧にプロバイダーバッジ表示
- ステータスラインにプロバイダー情報
- 異なるアイコンで視覚的に区別

### 5. API差異の吸収

#### 5.1 用語の統一
| GitLab | GitHub | 統一名称 |
|--------|--------|---------|
| Project | Repository | Repository |
| Merge Request | Pull Request | PullRequest |
| iid | number | number |
| Project ID (数値) | owner/repo (文字列) | id (union型) |

#### 5.2 機能差異
| 機能 | GitLab | GitHub | 対応 |
|------|--------|--------|------|
| ディスカッションスレッド | ✅ | ⚠️ 制限あり | GitHubは単純なコメント |
| ラベル | ✅ | ✅ | 統一可能 |
| マイルストーン | ✅ | ✅ | 統一可能 |
| アサイン | ✅ | ✅ | 統一可能 |
| レビュワー | ✅ | ✅ (PRのみ) | 統一可能 |
| 承認 | ✅ | ⚠️ Reviews | 別実装 |
| Draft | ✅ | ✅ | 統一可能 |

### 6. キャッシュ戦略

#### 6.1 GitHub特有の対応
- **ETag対応** - GitHubもETagをサポート
- **Conditional Requests** - If-Modified-Since使用
- **Rate Limit ヘッダー** - X-RateLimit-* を監視

#### 6.2 キャッシュキー
```typescript
// プロバイダーを含むキャッシュキー
const cacheKey = `${provider}:${endpoint}:${params}`;
```

## 技術設計

### 1. ディレクトリ構造
```
deno-backend/
├── mod.ts                          # 統一エクスポート
├── src/
│   ├── providers/
│   │   ├── provider.ts             # Provider interface
│   │   ├── gitlab_provider.ts      # GitLab implementation
│   │   └── github_provider.ts      # GitHub implementation (NEW)
│   ├── services/
│   │   ├── gitlab_client.ts        # 既存GitLabクライアント
│   │   └── github_client.ts        # GitHub APIクライアント (NEW)
│   ├── models/
│   │   ├── common.ts               # 統一データモデル (NEW)
│   │   ├── gitlab.ts               # GitLab固有の型
│   │   └── github.ts               # GitHub固有の型 (NEW)
│   ├── auth/
│   │   ├── keyring.ts              # 既存
│   │   └── provider_auth.ts        # プロバイダー別認証 (NEW)
│   ├── cache/
│   │   └── cache_manager.ts        # 既存（拡張）
│   └── config/
│       └── provider_config.ts      # プロバイダー設定 (NEW)
```

### 2. 実装ステップ

#### Phase 1: 基盤整備
1. Provider インターフェース定義
2. 統一データモデル作成
3. プロバイダー検出ロジック
4. 設定ファイルサポート

#### Phase 2: GitHub クライアント
1. GitHub API クライアント実装
2. 認証処理（GITHUB_TOKEN）
3. レート制限監視
4. エラーハンドリング

#### Phase 3: プロバイダー統合
1. GitLab Provider実装（既存コードのラップ）
2. GitHub Provider実装
3. Provider Factory実装
4. キャッシュの統合

#### Phase 4: UI統合
1. Denopsプラグインの拡張
2. プロバイダー切り替え機能
3. バッファ表示の統一
4. コマンドの拡張

#### Phase 5: テストと検証
1. GitHub API ユニットテスト
2. Provider統合テスト
3. E2Eテスト
4. ドキュメント更新

## パフォーマンス要件

- GitHubのレート制限: 5000 req/hour
- 同じレイテンシ目標: < 500ms
- キャッシュ効率: ETag利用でGitLabと同等
- メモリ使用: 追加 < 100MB

## セキュリティ

### GitHub Token
- **Classic PAT**: `ghp_` プレフィックス
- **Fine-grained PAT**: より安全、期限設定必須
- 環境変数 `GITHUB_TOKEN` または設定ファイル
- スコープ最小化の推奨

### API通信
- HTTPS必須
- TLS 1.2以上
- GitHub Enterpriseサポート（将来）

## 互換性

### 既存機能への影響
- ✅ GitLab機能は完全に維持
- ✅ 既存コマンドは動作継続
- ✅ 設定の後方互換性
- ⚠️ 新しい設定ファイルフォーマット（オプション）

### 移行パス
1. v0.2.0: GitLab専用（現在）
2. v0.3.0: GitHub対応追加（このspec）
3. v0.4.0: GraphQL API対応（将来）

## テスト戦略

### ユニットテスト
- GitHub API クライアント
- Provider実装
- データモデル変換
- プロバイダー検出

### 統合テスト
- GitHub API実際の呼び出し
- プロバイダー切り替え
- キャッシュ動作

### E2Eテスト
- GitHubリポジトリでの全ワークフロー
- GitLab/GitHub混在環境

## 成功基準

1. ✅ GitHubで全コア機能が動作（リポジトリ、Issue、PR、コメント、diff）
2. ✅ GitLabとGitHubでシームレスに切り替え可能
3. ✅ 同じUX・キーバインド
4. ✅ パフォーマンス低下なし
5. ✅ 既存GitLab機能への影響なし
6. ✅ テストカバレッジ > 80%

## 制限事項

### v0.3.0では未対応
- GitHub Actions統合
- GitHub Projects統合
- GitHub Wiki
- GitHub Discussions
- GitHub Gists
- Organization management
- Team management
- Security alerts

### 将来対応予定
- GraphQL API (v0.4.0)
- GitHub Enterprise (v0.5.0)
- Advanced search (v0.4.0)

## リスクと軽減策

### リスク
1. **API差異が大きい** → Provider層で差異を吸収
2. **レート制限が厳しい** → キャッシュ戦略を強化
3. **テスト環境準備** → GitHub test organizationを使用
4. **既存コードへの影響** → Provider層を追加、既存コードは最小限の変更

### 軽減策
- 段階的実装（Phase分割）
- 既存機能の回帰テスト強化
- プロバイダー別の設定分離
- フィーチャーフラグでのロールアウト

## ドキュメント更新

- Installation Guide: GitHub token設定追加
- Configuration Guide: プロバイダー設定追加
- Command Reference: 新コマンド追加
- Architecture: Provider層の説明追加
- Security: GitHub token管理追加

## 変更履歴
- 2025-11-24: 初版作成
