# GitXab.vim Constitution

<!--
Sync Impact Report:
Version change: 1.0.0 (Initial version)
Modified principles:
- Added: I. Documentation Management
- Added: II. Change History
- Added: III. Test-Driven Development
- Added: IV. Docker-First Development
- Added: V. Issue-Based Management

Templates requiring updates:
⚠ .specify/templates/plan-template.md
⚠ .specify/templates/spec-template.md
⚠ .specify/templates/tasks-template.md
⚠ .specify/templates/commands/*.md

Follow-up TODOs:
None
-->

## Core Principles

### I. Documentation Management

仕様書は`docs`ディレクトリに格納し、常に最新の状態を維持しなければならない（MUST）。
これにより、プロジェクトの一貫性と透明性を確保し、全てのステークホルダーが最新の情報にアクセスできる。

### II. Change History

仕様書の変更履歴は明確に記録されなければならない（MUST）。
各変更には以下の情報を含める：

- 変更日時
- 変更者
- 変更内容
- 変更理由
  変更履歴の明確な記録により、プロジェクトの進化と意思決定の過程を追跡可能にする。

### III. Test-Driven Development

実装はt-wadaスタイルのTDDに従って行わなければならない（MUST）。
開発プロセスは以下のサイクルを厳密に遵守する：

1. テストを書く（Red）
2. テストが通るように実装する（Green）
3. リファクタリングを行う（Refactor）

### IV. Docker-First Development

ビルド環境は可能な限りDockerで構築しなければならない（MUST）。 これにより：

- 開発環境の一貫性を確保
- 環境依存の問題を最小化
- デプロイメントの再現性を保証

### V. Issue-Based Management

問題・バグの管理はissueベースで行い、以下の原則を遵守する：

- 1つの問題につき1つのissueを作成（MUST）
- 1つのissueにつき1つの修正を行う（MUST）
- 各issueには再現手順、影響範囲、解決策を明記する（SHOULD）

## Development Workflow

1. 新機能の追加や修正は必ずissueから開始する
2. ブランチ名はissue番号を含める（例：feature/#123-add-new-feature）
3. コミットメッセージはissue番号を参照する
4. PRレビューは最低1名の承認を必要とする
5. マージ前にCI/CDパイプラインのすべてのチェックをパスする

## Quality Gates

1. すべてのテストがパスすること
2. コードカバレッジが80%以上であること
3. リンター/フォーマッターのチェックをパスすること
4. ドキュメントが更新されていること

## Governance

本憲章は、プロジェクトの全ての開発活動において最上位の指針となる。

変更プロセス：

1. 変更提案はissueとして提出
2. コアメンバーによるレビューと議論
3. 承認後、PRを作成
4. マージ前に移行計画の作成が必要

コンプライアンス：

- 全てのPRは本憲章への準拠を確認する
- 四半期ごとにコンプライアンスレビューを実施
- 違反が発見された場合は即座に修正

**Version**: 1.0.0 | **Ratified**: 2025-11-03 | **Last Amended**: 2025-11-03
