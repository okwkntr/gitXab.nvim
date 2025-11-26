# Data Model: GitHub Provider Support

## 統一データモデル (Unified Data Models)

GitLabとGitHubの両方で使用される統一されたデータモデル。プロバイダー固有の差異を吸収します。

### Repository (統一モデル)

```typescript
interface Repository {
  // 識別子（GitLab: 数値ID, GitHub: "owner/repo"文字列）
  id: string | number;
  
  // 基本情報
  name: string;                    // リポジトリ名
  fullName: string;                // フルネーム（owner/repo形式）
  description: string | null;      // 説明
  
  // URL
  url: string;                     // Web URL
  apiUrl?: string;                 // API URL（オプション）
  
  // ブランチ
  defaultBranch: string;           // デフォルトブランch (main/master)
  
  // メタデータ
  provider: 'gitlab' | 'github';   // プロバイダー識別子
  visibility?: 'public' | 'private' | 'internal'; // 公開設定
  archived?: boolean;              // アーカイブ済みかどうか
  
  // 統計（オプション）
  stars?: number;                  // スター数
  forks?: number;                  // フォーク数
  openIssues?: number;            // オープンIssue数
  
  // タイムスタンプ
  createdAt?: string;              // 作成日時（ISO 8601）
  updatedAt?: string;              // 更新日時（ISO 8601）
}
```

### Issue (統一モデル)

```typescript
interface Issue {
  // 識別子
  id: string | number;             // 内部ID
  number: number;                  // Issue番号（GitLab: iid, GitHub: number）
  
  // 基本情報
  title: string;                   // タイトル
  body: string | null;             // 本文（description）
  state: 'open' | 'closed';        // 状態
  
  // ユーザー情報
  author: User;                    // 作成者
  assignees?: User[];              // アサイン先（複数可）
  
  // 分類
  labels: string[];                // ラベル
  milestone?: Milestone | null;    // マイルストーン
  
  // URL
  url: string;                     // Web URL
  
  // タイムスタンプ
  createdAt: string;               // 作成日時（ISO 8601）
  updatedAt: string;               // 更新日時（ISO 8601）
  closedAt?: string | null;        // クローズ日時（ISO 8601）
  
  // 統計
  commentCount?: number;           // コメント数
  
  // メタデータ
  locked?: boolean;                // ロック済みかどうか
}
```

### PullRequest (統一モデル)

```typescript
interface PullRequest {
  // 識別子
  id: string | number;             // 内部ID
  number: number;                  // PR/MR番号
  
  // 基本情報
  title: string;                   // タイトル
  body: string | null;             // 説明
  state: 'open' | 'closed' | 'merged'; // 状態
  draft?: boolean;                 // ドラフトかどうか
  
  // ブランチ情報
  sourceBranch: string;            // ソースブランチ
  targetBranch: string;            // ターゲットブランチ
  
  // ユーザー情報
  author: User;                    // 作成者
  assignees?: User[];              // アサイン先
  reviewers?: User[];              // レビュワー
  
  // 分類
  labels?: string[];               // ラベル
  milestone?: Milestone | null;    // マイルストーン
  
  // URL
  url: string;                     // Web URL
  
  // タイムスタンプ
  createdAt: string;               // 作成日時
  updatedAt: string;               // 更新日時
  mergedAt?: string | null;        // マージ日時
  closedAt?: string | null;        // クローズ日時
  
  // 統計
  changedFiles?: number;           // 変更ファイル数
  additions?: number;              // 追加行数
  deletions?: number;              // 削除行数
  commentCount?: number;           // コメント数
  
  // マージ情報
  mergeable?: boolean | null;      // マージ可能かどうか
  mergeableState?: string;         // マージ可能性の詳細状態
}
```

### Comment (統一モデル)

```typescript
interface Comment {
  // 識別子
  id: string | number;             // コメントID
  
  // 内容
  body: string;                    // コメント本文
  
  // ユーザー情報
  author: User;                    // 作成者
  
  // タイムスタンプ
  createdAt: string;               // 作成日時
  updatedAt: string;               // 更新日時
  
  // URL
  url?: string;                    // Web URL（オプション）
  
  // メタデータ
  isSystemGenerated?: boolean;     // システム生成かどうか
}
```

### User (統一モデル)

```typescript
interface User {
  // 識別子
  id: string | number;             // ユーザーID
  username: string;                // ユーザー名
  name?: string;                   // 表示名
  
  // URL
  avatarUrl?: string;              // アバターURL
  profileUrl?: string;             // プロフィールURL
}
```

### Branch (統一モデル)

```typescript
interface Branch {
  // 基本情報
  name: string;                    // ブランチ名
  
  // コミット情報
  commit?: {
    sha: string;                   // コミットSHA
    message?: string;              // コミットメッセージ
  };
  
  // 保護設定
  protected?: boolean;             // 保護ブランチかどうか
}
```

### Diff (統一モデル)

```typescript
interface Diff {
  // ファイル情報
  files: DiffFile[];               // 変更ファイル一覧
  
  // 統計
  totalAdditions?: number;         // 合計追加行数
  totalDeletions?: number;         // 合計削除行数
}

interface DiffFile {
  // ファイル情報
  oldPath: string | null;          // 旧パス（削除/リネーム時）
  newPath: string;                 // 新パス
  status: 'added' | 'deleted' | 'modified' | 'renamed'; // ステータス
  
  // 差分
  patch?: string;                  // Unified diff形式のパッチ
  
  // 統計
  additions: number;               // 追加行数
  deletions: number;               // 削除行数
  changes: number;                 // 変更行数
}
```

### Milestone (統一モデル)

```typescript
interface Milestone {
  // 識別子
  id: string | number;             // マイルストーンID
  number?: number;                 // マイルストーン番号
  
  // 基本情報
  title: string;                   // タイトル
  description?: string | null;     // 説明
  state: 'open' | 'closed';        // 状態
  
  // 期限
  dueDate?: string | null;         // 期限（ISO 8601）
  
  // URL
  url?: string;                    // Web URL
}
```

## プロバイダー固有モデルとマッピング

### GitLab → 統一モデル

```typescript
// GitLab Project → Repository
function gitlabProjectToRepository(project: GitLabProject): Repository {
  return {
    id: project.id,
    name: project.name,
    fullName: project.path_with_namespace,
    description: project.description,
    url: project.web_url,
    defaultBranch: project.default_branch,
    provider: 'gitlab',
    visibility: project.visibility,
    stars: project.star_count,
    forks: project.forks_count,
    createdAt: project.created_at,
    updatedAt: project.last_activity_at,
  };
}

// GitLab Issue → Issue
function gitlabIssueToIssue(issue: GitLabIssue): Issue {
  return {
    id: issue.id,
    number: issue.iid,
    title: issue.title,
    body: issue.description,
    state: issue.state,
    author: gitlabUserToUser(issue.author),
    assignees: issue.assignees?.map(gitlabUserToUser),
    labels: issue.labels,
    url: issue.web_url,
    createdAt: issue.created_at,
    updatedAt: issue.updated_at,
    closedAt: issue.closed_at,
  };
}

// GitLab MergeRequest → PullRequest
function gitlabMRToPullRequest(mr: GitLabMergeRequest): PullRequest {
  return {
    id: mr.id,
    number: mr.iid,
    title: mr.title,
    body: mr.description,
    state: mr.state === 'merged' ? 'merged' : mr.state,
    draft: mr.draft || mr.work_in_progress,
    sourceBranch: mr.source_branch,
    targetBranch: mr.target_branch,
    author: gitlabUserToUser(mr.author),
    url: mr.web_url,
    createdAt: mr.created_at,
    updatedAt: mr.updated_at,
    mergedAt: mr.merged_at,
    closedAt: mr.closed_at,
  };
}
```

### GitHub → 統一モデル

```typescript
// GitHub Repository → Repository
function githubRepoToRepository(repo: GitHubRepository): Repository {
  return {
    id: repo.full_name,  // "owner/repo" format
    name: repo.name,
    fullName: repo.full_name,
    description: repo.description,
    url: repo.html_url,
    apiUrl: repo.url,
    defaultBranch: repo.default_branch,
    provider: 'github',
    visibility: repo.private ? 'private' : 'public',
    archived: repo.archived,
    stars: repo.stargazers_count,
    forks: repo.forks_count,
    openIssues: repo.open_issues_count,
    createdAt: repo.created_at,
    updatedAt: repo.updated_at,
  };
}

// GitHub Issue → Issue
function githubIssueToIssue(issue: GitHubIssue): Issue {
  return {
    id: issue.id,
    number: issue.number,
    title: issue.title,
    body: issue.body,
    state: issue.state,
    author: githubUserToUser(issue.user),
    assignees: issue.assignees?.map(githubUserToUser),
    labels: issue.labels.map(l => typeof l === 'string' ? l : l.name),
    milestone: issue.milestone ? githubMilestoneToMilestone(issue.milestone) : null,
    url: issue.html_url,
    createdAt: issue.created_at,
    updatedAt: issue.updated_at,
    closedAt: issue.closed_at,
    commentCount: issue.comments,
    locked: issue.locked,
  };
}

// GitHub PullRequest → PullRequest
function githubPRToPullRequest(pr: GitHubPullRequest): PullRequest {
  return {
    id: pr.id,
    number: pr.number,
    title: pr.title,
    body: pr.body,
    state: pr.merged_at ? 'merged' : pr.state,
    draft: pr.draft,
    sourceBranch: pr.head.ref,
    targetBranch: pr.base.ref,
    author: githubUserToUser(pr.user),
    assignees: pr.assignees?.map(githubUserToUser),
    reviewers: pr.requested_reviewers?.map(githubUserToUser),
    labels: pr.labels?.map(l => l.name),
    milestone: pr.milestone ? githubMilestoneToMilestone(pr.milestone) : null,
    url: pr.html_url,
    createdAt: pr.created_at,
    updatedAt: pr.updated_at,
    mergedAt: pr.merged_at,
    closedAt: pr.closed_at,
    changedFiles: pr.changed_files,
    additions: pr.additions,
    deletions: pr.deletions,
    commentCount: pr.comments,
    mergeable: pr.mergeable,
    mergeableState: pr.mergeable_state,
  };
}
```

## リポジトリID形式の違い

### GitLab
- **形式**: 数値ID（例: `123`, `456789`）
- **取得**: `project.id`
- **API使用**: `/projects/123`

### GitHub
- **形式**: `owner/repo`文字列（例: `"octocat/Hello-World"`）
- **取得**: `repo.full_name`
- **API使用**: `/repos/octocat/Hello-World`

### 統一的な扱い
```typescript
type RepositoryId = string | number;

// Provider interface
interface Provider {
  getRepository(id: RepositoryId): Promise<Repository>;
  listIssues(repoId: RepositoryId, state?: string): Promise<Issue[]>;
}

// GitLab implementation
class GitLabProvider {
  async getRepository(id: RepositoryId): Promise<Repository> {
    // id is number for GitLab
    const projectId = id as number;
    const project = await fetchGitLabProject(projectId);
    return gitlabProjectToRepository(project);
  }
}

// GitHub implementation
class GitHubProvider {
  async getRepository(id: RepositoryId): Promise<Repository> {
    // id is "owner/repo" for GitHub
    const fullName = id as string;
    const repo = await fetchGitHubRepo(fullName);
    return githubRepoToRepository(repo);
  }
}
```

## 変更履歴
- 2025-11-24: 初版作成
