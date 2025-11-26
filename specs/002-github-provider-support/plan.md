# Implementation Plan: GitHub Provider Support

**Branch**: `002-github-provider-support` | **Date**: 2025-11-24 | **Spec**: [spec.md](spec.md)  
**Input**: Feature specification from `/specs/002-github-provider-support/spec.md`

## Summary

GitXab.vimにGitHubサポートを追加し、GitLabとGitHubの両方で統一されたインターフェースを提供します。プロバイダー抽象化層を導入し、既存のGitLab機能を維持しながら、GitHubの機能を追加します。

## Technical Context

**Language/Version**: TypeScript 5.x, Deno 1.x  
**Primary Dependencies**: Deno標準ライブラリ, denops.vim 5.x+, GitHub REST API v3  
**Storage**: インメモリキャッシュ（ETag対応）  
**Testing**: deno test, 統合テスト、E2Eテスト  
**Target Platform**: Neovim 0.7+, Linux/macOS/Windows  
**Project Type**: Vim/Neovimプラグイン（denops）  
**Performance Goals**: レイテンシ < 500ms, GitHubレート制限対応（5000 req/hour）  
**Constraints**: 既存GitLab機能への影響なし、後方互換性維持  
**Scale/Scope**: 2つのプロバイダー（GitLab, GitHub）、統一API

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Neovim (User)                       │
│              :GitXabProjects, :GitXabIssues             │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────┐
│              denops/gitxab/main.ts                      │
│          (UI Layer - Provider Agnostic)                 │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────┐
│           Provider Factory & Manager                    │
│         (Auto-detect, Switch, Config)                   │
└───────────┬──────────────────────────┬──────────────────┘
            │                          │
┌───────────▼──────────┐  ┌───────────▼──────────────────┐
│  GitLab Provider     │  │  GitHub Provider (NEW)       │
│  (Existing)          │  │                              │
└───────────┬──────────┘  └───────────┬──────────────────┘
            │                          │
┌───────────▼──────────┐  ┌───────────▼──────────────────┐
│  gitlab_client.ts    │  │  github_client.ts (NEW)      │
│  (Existing)          │  │  - REST API v3               │
└───────────┬──────────┘  │  - Auth (GITHUB_TOKEN)       │
            │              │  - Rate limit handling       │
            │              └───────────┬──────────────────┘
            │                          │
            └───────────┬──────────────┘
                        │
        ┌───────────────▼───────────────┐
        │     Unified Data Models       │
        │  (Repository, Issue, PR)      │
        └───────────────┬───────────────┘
                        │
        ┌───────────────▼───────────────┐
        │     Cache Manager (ETag)      │
        │  (Provider-aware caching)     │
        └───────────────────────────────┘
```

## Implementation Strategy

### Phase 1: 基盤整備（Infrastructure）
**目標**: プロバイダー抽象化層とデータモデルの統一

### Phase 2: GitHub API実装（GitHub Client）
**目標**: GitHub REST APIクライアントの完全実装

### Phase 3: プロバイダー統合（Provider Integration）
**目標**: GitLabとGitHubをProviderインターフェースで統合

### Phase 4: UI統合（UI Integration）
**目標**: Denopsプラグインでのプロバイダー切り替えとUX統一

### Phase 5: テストと文書化（Testing & Documentation）
**目標**: 完全なテストカバレッジとドキュメント更新

## Dependencies & Execution Order

```
Phase 1 (基盤整備)
  ↓
Phase 2 (GitHub API) ← Phase 3の前提
  ↓
Phase 3 (Provider統合)
  ↓
Phase 4 (UI統合)
  ↓
Phase 5 (テスト・文書化)
```

## Parallel Opportunities

- Phase 1のタスク（T101-T106）は並列実行可能
- Phase 2のGitHub API実装（T107-T112）は並列実行可能
- Phase 3のProvider実装（T113-T114）はGitLab/GitHub別々に実装可能
- Phase 5のテスト（T121-T124）は並列実行可能

## Risk Mitigation

### 既存機能への影響
- **リスク**: GitLab機能の破壊
- **軽減策**: 
  - Provider層は新規追加のみ
  - 既存コードは最小限の変更
  - 回帰テスト強化

### GitHub API差異
- **リスク**: GitLabとの機能差異が大きい
- **軽減策**:
  - Provider層で差異を吸収
  - 統一データモデルで抽象化
  - 段階的な機能追加

### レート制限
- **リスク**: GitHub API制限（5000 req/hour）
- **軽減策**:
  - ETagキャッシュの活用
  - レート制限ヘッダーの監視
  - エラーハンドリングと再試行

## Validation Checkpoints

### Phase 1 完了条件
- [ ] Provider interface定義完了
- [ ] 統一データモデル作成
- [ ] 既存GitLabコードが動作

### Phase 2 完了条件
- [ ] GitHub API全エンドポイント実装
- [ ] ユニットテスト通過
- [ ] レート制限対応完了

### Phase 3 完了条件
- [ ] GitLab/GitHub両Provider実装
- [ ] Provider Factory動作
- [ ] キャッシュ統合完了

### Phase 4 完了条件
- [ ] プロバイダー切り替え機能
- [ ] 統一コマンド動作
- [ ] UI表示統一

### Phase 5 完了条件
- [ ] テストカバレッジ > 80%
- [ ] ドキュメント更新完了
- [ ] E2Eテスト通過

## Rollout Plan

1. **v0.3.0-alpha** - Phase 1-2完了（GitHub APIのみ）
2. **v0.3.0-beta** - Phase 3-4完了（統合テスト）
3. **v0.3.0** - Phase 5完了（正式リリース）

## Success Metrics

- GitHubで全コア機能動作
- GitLab機能への影響ゼロ
- パフォーマンス低下なし（< 500ms）
- テストカバレッジ > 80%
- ドキュメント完全性 100%
