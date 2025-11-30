# GitXab.vim 仕様書

## 概要

GitXab.vimは、Vim/Neovim上でGitLabとGitHubのWeb
UIと同等の機能を提供するプラグインです。マルチプロバイダー対応により、GitHub
REST API v3とGitLab API v4の両方をサポートしています。

## 機能要件

### 1. プロジェクト管理

#### 1.1 プロジェクト一覧

- プロジェクトの一覧表示
- プロジェクトの検索機能
  - プロジェクト名による検索
  - 説明文による検索
  - タグによる検索

### 2. Issue管理

#### 2.1 Issue一覧

- プロジェクトごとのissue一覧表示
- issue検索機能
  - タイトルによる検索
  - 説明文による検索
  - ステータスによるフィルタリング
  - アサイン者によるフィルタリング
  - ラベルによるフィルタリング

#### 2.2 Issue詳細

- issue内容の表示
- コメントの表示
- 新規コメントの投稿
- コメントへの返信
- issueのステータス変更
- アサイン者の変更
- ラベルの編集

### 3. Merge Request / Pull Request管理

#### 3.1 MR/PR一覧

- プロジェクトごとのMR/PR一覧表示
- MR/PR検索機能
  - タイトルによる検索
  - 説明文による検索
  - ステータスによるフィルタリング
  - レビュワーによるフィルタリング

#### 3.2 MR/PR詳細

- MR/PR内容の表示
- コメントの表示・投稿
- コメントへの返信
- MR/PRのステータス変更
- レビュワーの変更

#### 3.3 差分表示

- ファイル単位の差分表示
- インライン差分コメント
- コメントへの返信
- 差分のナビゲーション

### 4. プロバイダー管理

#### 4.1 プロバイダー切り替え

- GitHubとGitLabの切り替え
- 自動検出機能
  - Git remoteのURLから検出
  - 環境変数から検出
  - 設定ファイルから検出

#### 4.2 プロバイダー設定

- プロバイダー別の認証情報管理
- プロバイダー別のベースURL設定
- セルフホスト環境のサポート

## 技術要件

### 1. 技術スタック

#### フロントエンド (Denops/TypeScript)

- denops.vim 6.x以降
- Neovim 0.7以降
- Deno 1.x以降
- TypeScript 5.x以降
- Denops標準API（バッファ管理、コマンド登録、UI操作）

#### バックエンド (Deno/TypeScript ライブラリ)

- Deno 1.x以降
- TypeScript 5.x以降
- マルチプロバイダーアーキテクチャ
  - 統一Provider interface
  - GitHub REST API v3クライアント
  - GitLab API v4クライアント（Provider interface経由で使用）
- 認証管理ライブラリ
  - マルチプロバイダートークン管理
  - 環境変数サポート（GITHUB_TOKEN, GITLAB_TOKEN）
  - 設定ファイルサポート
- キャッシュシステム（ETagベース）
- 自動プロバイダー検出
  - Git remoteからの検出
  - 環境変数からの検出

#### CLI

- バックエンドライブラリ（`deno-backend/mod.ts`）を直接インポート
- CLI は JSON を stdout に出力する設計とし、自動化やデバッグ、CI
  レシピから直接利用可能
- Denopsプラグインと同じライブラリを共有することでコードの重複を排除

### 2. アーキテクチャ

#### Denopsプラグイン層（`denops/gitxab/main.ts`）

- TypeScriptベースのプラグインコア
- Denops APIを利用したバッファ管理
- コマンド登録とディスパッチャー
  - `:GitXabProjects` - プロジェクト/リポジトリ一覧
  - `:GitXabIssues` - イシュー一覧
  - `:GitXabMRs` - MR/PR一覧
  - `:GitXabSetProvider` - プロバイダー切り替え
  - `:GitXabShowProvider` - 現在のプロバイダー表示
- UI/UXコンポーネント
- バックエンドライブラリとの直接統合
- プロバイダー切り替えロジック

#### バックエンドライブラリ層（`deno-backend/mod.ts`）

- **プロバイダー層**（`src/providers/`）
  - 統一Provider interface
  - GitHubProvider実装（完成）
  - GitLabProvider実装（予定）
  - ProviderFactory（自動検出機能付き）
- **APIクライアント層**（`src/services/`）
  - GitHub REST API v3クライアント（リトライ、レート制限対応）
  - GitLab REST API v4クライアント
- **データモデル層**（`src/models/`）
  - 共通データモデル（Repository, Issue, PullRequest, Comment, Branch）
  - GitHub型定義
  - GitLab型定義
- **Converter層**（`src/providers/`）
  - GitHub Converter
  - GitLab Converter
- **設定・認証層**（`src/config/`, `src/auth/`）
  - プロバイダー設定管理
  - 自動検出（Git remote, 環境変数）
  - マルチプロバイダー認証
  - トークン管理（環境変数、設定ファイル、将来的にOSキーリング）
- **キャッシュ層**（`src/cache/`）
  - ETagベースキャッシュマネージャー
- エラーハンドリングとレスポンスパース
- 型定義のエクスポート

#### プロセス通信

- denops.vimがNeovimとDenoプロセス間の通信を自動管理（msgpack-rpc）
- ユーザーは通信を意識する必要がない
- denops起動時に自動的にDenoプロセスが起動

### 3. パフォーマンス要件

- コマンド実行から表示までの最大レイテンシ: 500ms
- メモリ使用量の上限: 512MB
- キャッシュの有効期限設定
- バッファリングとページネーション

### 4. セキュリティ

- 認証情報の安全な保存
  - 環境変数による管理
  - 設定ファイルのパーミッション管理
  - 将来的にOSキーリング対応
- SSL/TLS通信
- レート制限への対応
  - GitHub: リトライロジック、レート制限検出
  - GitLab: リトライロジック
- エラーメッセージのサニタイズ
- トークン検証

### 5. 拡張性

- プロバイダーシステム
  - ✅ GitHubプロバイダー（Provider interface実装済み）
  - ✅ GitLabプロバイダー（Provider interface実装済み）
  - 将来的に他のGitホスティングサービス追加可能
- カスタムUIテーマ
- ユーザー定義コマンド
- セルフホスト環境のサポート
  - GitHub Enterprise
  - GitLab CE/EE

## 制約条件

1. Neovim 0.7以降のみをサポート（denops互換）
2. denops.vim 6.x以降が必要
3. Deno 1.x以降が必要
4. SSL/TLS通信のサポート
5. UTF-8エンコーディングのサポート
6. 最低2GB以上のRAM
7. GitHub REST API v3との互換性
8. GitLab API v4との互換性
9. プロキシ環境での動作サポート
10. Git リポジトリ内での使用を推奨（自動プロバイダー検出のため）

## 実装フェーズ

### フェーズ1: 基本機能（✅ 完了）

1. ✅ プロジェクト一覧表示・検索
2. ✅ Issue一覧表示・検索
3. ✅ Issue詳細表示・コメント
4. ✅ Issue作成・編集

### フェーズ2: MR管理（✅ 完了）

1. ✅ MR一覧表示・検索
2. ✅ MR詳細表示・コメント
3. ✅ 差分表示
4. ✅ MR作成

### フェーズ3: マルチプロバイダー対応（✅ 完了）

1. ✅ GitHub REST API v3統合
2. ✅ 統一Provider interface実装
3. ✅ 自動プロバイダー検出
4. ✅ プロバイダー切り替えコマンド
5. ✅ GitHub/GitLab両対応のドキュメント

### フェーズ4: 拡張機能（🔄 進行中）

1. ✅ GitLabのProvider interface移行（完了）
2. ⏳ インライン差分コメント
3. ⏳ 高度な検索機能
4. ⏳ PR/MRのマージ操作

## テスト要件

1. ユニットテスト（✅ 実装済み: 94テスト）
   - ✅ API通信のモック（7テスト）
   - ✅ 認証テスト（4テスト）
   - ✅ キャッシュテスト（6テスト）
   - ✅ GitHubクライアントテスト（18テスト）
   - ✅ プロバイダー設定テスト（29テスト）

2. 統合テスト（✅ 実装済み）
   - ✅ 実際のGitLab APIとの連携テスト（8テスト）
   - ✅ GitLab APIコントラクトテスト（8テスト）
   - ✅ Denopsプラグイン統合テスト（14テスト）
   - ✅ エラーケースの検証

3. E2Eテスト（⏳ 一部実装）
   - ✅
     テストシナリオ定義（`specs/001-gitlab-vim-integration/tests/e2e_mrs.md`）
   - ⏳ 自動E2Eテスト
   - ⏳ パフォーマンステスト

**現状**:
94テスト成功、1テストスキップ（Provider統合の複雑性によるバッファテスト）

## コード品質チェック要件

**すべての変更完了時に実行必須のチェックリスト**:

1. **フォーマットチェック**
   ```bash
   deno fmt --check
   ```
   - 全TypeScript/JSON/Markdownファイルが正しくフォーマットされていること
   - エラーがある場合は `deno fmt` で自動修正

2. **Lintチェック**
   ```bash
   deno lint
   ```
   - 全TypeScriptファイルがlintルールに準拠していること
   - 未使用変数は `_` プレフィックスでリネーム
   - 必要な場合のみ `// deno-lint-ignore` コメント使用

3. **Luaフォーマットチェック** (Luaファイル変更時)
   ```bash
   stylua --check lua/ plugin/
   ```
   - 全Luaファイルが正しくフォーマットされていること
   - エラーがある場合は `stylua lua/ plugin/` で自動修正

4. **型チェック**
   ```bash
   deno check denops/gitxab/main.ts deno-backend/mod.ts
   ```
   - TypeScriptの型エラーがないこと

5. **全テスト実行**
   ```bash
   ./run_tests.sh all
   ```
   - Mock tests、Unit tests、Integration testsすべてが成功すること
   - テスト失敗がある場合は修正してから完了とする

**CI相当チェックの自動化**: 上記すべてのチェックは、GitHub Actions
CIと同等の品質保証となります。
変更をコミット・プッシュする前に必ず実行し、すべてパスすることを確認してください。

**チェック実行タイミング**:

- コード変更完了時（ユーザーへの報告前）
- PR作成前
- コミット前
- 大規模なリファクタリング後

## 成功基準

1. ✅ GitLab/GitHubのWeb UIで実行可能な主要な操作がVim上で実行可能
   - ✅ プロジェクト/リポジトリ閲覧
   - ✅ Issue管理（一覧、詳細、作成、編集、コメント）
   - ✅ MR/PR管理（一覧、詳細、作成、コメント、差分表示）
   - ✅ プロバイダー切り替え

2. ✅ コマンド実行からレスポンス表示までの遅延が適切
   - キャッシュ機能（ETag）による高速化
   - リトライロジックによる信頼性向上

3. ✅ エラー発生時の適切なフィードバック提供
   - エラーメッセージの表示
   - デバッグモード（$GITXAB_DEBUG）

4. ✅ 高いテストカバレッジ
   - 94テスト成功
   - ユニット、統合、APIコントラクトテスト

5. ✅ ドキュメントの完備
   - ✅ インストール手順（README.md）
   - ✅ 設定ガイド（README.md, docs/PROVIDER_SWITCHING.md）
   - ✅ クイックスタート（docs/QUICKSTART.md）
   - ✅ コマンドリファレンス（README.md, doc/gitxab.txt）
   - ✅ プロバイダーAPI詳細（deno-backend/PROVIDER_GUIDE.md）
   - ✅ トラブルシューティングガイド（doc/gitxab.txt）
   - ✅ 変更履歴（CHANGELOG.md）

## 現在の実装状況

### 実装済み機能

- ✅ GitLab統合（Provider interface）
  - プロジェクト一覧・検索
  - Issue管理（一覧、詳細、作成、編集、コメント）
  - MR管理（一覧、詳細、作成、コメント、差分表示）

- ✅ GitHub統合（Provider interface）
  - リポジトリ一覧・検索
  - REST API v3クライアント（リトライ、レート制限対応）
  - 統一データモデル

- ✅ マルチプロバイダー機能
  - プロバイダー自動検出（Git remote, 環境変数）
  - プロバイダー切り替えコマンド
  - 設定ファイルサポート

- ✅ テスト体制
  - 94テスト成功（ユニット、統合、コントラクト）

### 今後の実装予定

- 🔄 GitLabのProvider interface移行
- ⏳ GitHub Issue/PR操作の完全対応
- ⏳ インライン差分コメント
- ⏳ 高度な検索機能
- ⏳ PR/MRのマージ操作

## 変更履歴

- 2025-11-03: 初版作成
- 2025-11-09:
  アーキテクチャをdenopsベースに変更。バックエンドをサーバーからライブラリ化
- 2025-11-26: マルチプロバイダー対応完了。GitHub統合追加。仕様書更新
