# API Contracts: GitHub Provider Support

## GitHub REST API v3 Contracts

このドキュメントは、GitHubのREST API v3との契約（エンドポイント、リクエスト/レスポンス形式）を定義します。

### 基本情報

- **Base URL**: `https://api.github.com`
- **認証**: Bearer Token (`Authorization: Bearer {token}`)
- **User-Agent**: 必須（例: `GitXab.vim/0.3.0`）
- **Accept**: `application/vnd.github.v3+json`
- **Rate Limit**: 5000 requests/hour (authenticated)

### レスポンスヘッダー

```
X-RateLimit-Limit: 5000
X-RateLimit-Remaining: 4999
X-RateLimit-Reset: 1372700873
X-RateLimit-Used: 1
X-RateLimit-Resource: core

ETag: "abc123def456"
Last-Modified: Wed, 21 Oct 2015 07:28:00 GMT

Link: <https://api.github.com/repositories?page=2>; rel="next",
      <https://api.github.com/repositories?page=5>; rel="last"
```

## Repository Endpoints

### List User Repositories

```
GET /user/repos
```

**Query Parameters:**
- `visibility` (string): `all`, `public`, `private`
- `affiliation` (string): `owner`, `collaborator`, `organization_member`
- `sort` (string): `created`, `updated`, `pushed`, `full_name`
- `direction` (string): `asc`, `desc`
- `per_page` (integer): 1-100, default 30
- `page` (integer): Page number

**Response: 200 OK**
```json
[
  {
    "id": 1296269,
    "node_id": "MDEwOlJlcG9zaXRvcnkxMjk2MjY5",
    "name": "Hello-World",
    "full_name": "octocat/Hello-World",
    "owner": {
      "login": "octocat",
      "id": 1,
      "avatar_url": "https://github.com/images/error/octocat_happy.gif",
      "url": "https://api.github.com/users/octocat"
    },
    "private": false,
    "html_url": "https://github.com/octocat/Hello-World",
    "description": "This your first repo!",
    "fork": false,
    "url": "https://api.github.com/repos/octocat/Hello-World",
    "created_at": "2011-01-26T19:01:12Z",
    "updated_at": "2011-01-26T19:14:43Z",
    "pushed_at": "2011-01-26T19:06:43Z",
    "homepage": "https://github.com",
    "size": 180,
    "stargazers_count": 80,
    "watchers_count": 80,
    "language": "C",
    "forks_count": 9,
    "archived": false,
    "disabled": false,
    "open_issues_count": 0,
    "default_branch": "main",
    "visibility": "public"
  }
]
```

### Get Repository

```
GET /repos/{owner}/{repo}
```

**Response: 200 OK** (同上の単一オブジェクト)

### Search Repositories

```
GET /search/repositories?q={query}
```

**Query Parameters:**
- `q` (string): 検索クエリ（必須）
- `sort` (string): `stars`, `forks`, `updated`
- `order` (string): `asc`, `desc`

**Response: 200 OK**
```json
{
  "total_count": 40,
  "incomplete_results": false,
  "items": [
    {
      // Repository object
    }
  ]
}
```

## Issue Endpoints

### List Issues

```
GET /repos/{owner}/{repo}/issues
```

**Query Parameters:**
- `state` (string): `open`, `closed`, `all` (default: `open`)
- `labels` (string): ラベルフィルター（カンマ区切り）
- `sort` (string): `created`, `updated`, `comments`
- `direction` (string): `asc`, `desc`
- `since` (string): ISO 8601 timestamp
- `per_page` (integer): 1-100
- `page` (integer): ページ番号

**Response: 200 OK**
```json
[
  {
    "id": 1,
    "node_id": "MDU6SXNzdWUx",
    "url": "https://api.github.com/repos/octocat/Hello-World/issues/1347",
    "html_url": "https://github.com/octocat/Hello-World/issues/1347",
    "number": 1347,
    "state": "open",
    "title": "Found a bug",
    "body": "I'm having a problem with this.",
    "user": {
      "login": "octocat",
      "id": 1,
      "avatar_url": "https://github.com/images/error/octocat_happy.gif"
    },
    "labels": [
      {
        "id": 208045946,
        "name": "bug",
        "color": "d73a4a",
        "default": true
      }
    ],
    "assignees": [
      {
        "login": "octocat",
        "id": 1
      }
    ],
    "milestone": {
      "id": 1002604,
      "number": 1,
      "state": "open",
      "title": "v1.0",
      "description": "Tracking milestone for version 1.0"
    },
    "locked": false,
    "comments": 0,
    "created_at": "2011-04-22T13:33:48Z",
    "updated_at": "2011-04-22T13:33:48Z",
    "closed_at": null
  }
]
```

### Get Issue

```
GET /repos/{owner}/{repo}/issues/{issue_number}
```

**Response: 200 OK** (単一Issueオブジェクト)

### Create Issue

```
POST /repos/{owner}/{repo}/issues
```

**Request Body:**
```json
{
  "title": "Found a bug",
  "body": "I'm having a problem with this.",
  "labels": ["bug", "urgent"],
  "assignees": ["octocat"],
  "milestone": 1
}
```

**Response: 201 Created** (Issueオブジェクト)

### Update Issue

```
PATCH /repos/{owner}/{repo}/issues/{issue_number}
```

**Request Body:**
```json
{
  "title": "Updated title",
  "body": "Updated body",
  "state": "closed",
  "labels": ["bug"],
  "assignees": ["octocat"]
}
```

**Response: 200 OK** (更新されたIssueオブジェクト)

## Pull Request Endpoints

### List Pull Requests

```
GET /repos/{owner}/{repo}/pulls
```

**Query Parameters:**
- `state` (string): `open`, `closed`, `all` (default: `open`)
- `head` (string): ブランチフィルター（`user:branch`形式）
- `base` (string): ベースブランチフィルター
- `sort` (string): `created`, `updated`, `popularity`, `long-running`
- `direction` (string): `asc`, `desc`
- `per_page` (integer): 1-100
- `page` (integer): ページ番号

**Response: 200 OK**
```json
[
  {
    "id": 1,
    "node_id": "MDExOlB1bGxSZXF1ZXN0MQ==",
    "number": 1347,
    "state": "open",
    "locked": false,
    "title": "Amazing new feature",
    "user": {
      "login": "octocat",
      "id": 1
    },
    "body": "Please pull these awesome changes in!",
    "labels": [
      {
        "id": 208045946,
        "name": "feature",
        "color": "a2eeef"
      }
    ],
    "milestone": null,
    "created_at": "2011-01-26T19:01:12Z",
    "updated_at": "2011-01-26T19:01:12Z",
    "closed_at": null,
    "merged_at": null,
    "merge_commit_sha": "e5bd3914e2e596debea16f433f57875b5b90bcd6",
    "assignees": [],
    "requested_reviewers": [],
    "head": {
      "label": "octocat:new-topic",
      "ref": "new-topic",
      "sha": "6dcb09b5b57875f334f61aebed695e2e4193db5e"
    },
    "base": {
      "label": "octocat:main",
      "ref": "main",
      "sha": "6dcb09b5b57875f334f61aebed695e2e4193db5e"
    },
    "html_url": "https://github.com/octocat/Hello-World/pull/1347",
    "draft": false,
    "merged": false,
    "mergeable": true,
    "mergeable_state": "clean",
    "comments": 10,
    "review_comments": 0,
    "commits": 3,
    "additions": 100,
    "deletions": 3,
    "changed_files": 5
  }
]
```

### Get Pull Request

```
GET /repos/{owner}/{repo}/pulls/{pull_number}
```

**Response: 200 OK** (単一PRオブジェクト、詳細情報含む)

### Create Pull Request

```
POST /repos/{owner}/{repo}/pulls
```

**Request Body:**
```json
{
  "title": "Amazing new feature",
  "body": "Please pull these awesome changes in!",
  "head": "octocat:new-topic",
  "base": "main",
  "draft": false
}
```

**Response: 201 Created** (PRオブジェクト)

## Comment Endpoints

### List Issue Comments

```
GET /repos/{owner}/{repo}/issues/{issue_number}/comments
```

**Query Parameters:**
- `since` (string): ISO 8601 timestamp
- `per_page` (integer): 1-100
- `page` (integer): ページ番号

**Response: 200 OK**
```json
[
  {
    "id": 1,
    "node_id": "MDEyOklzc3VlQ29tbWVudDE=",
    "url": "https://api.github.com/repos/octocat/Hello-World/issues/comments/1",
    "html_url": "https://github.com/octocat/Hello-World/issues/1347#issuecomment-1",
    "body": "Me too",
    "user": {
      "login": "octocat",
      "id": 1
    },
    "created_at": "2011-04-14T16:00:49Z",
    "updated_at": "2011-04-14T16:00:49Z"
  }
]
```

### Create Issue Comment

```
POST /repos/{owner}/{repo}/issues/{issue_number}/comments
```

**Request Body:**
```json
{
  "body": "Me too"
}
```

**Response: 201 Created** (Commentオブジェクト)

## Branch Endpoints

### List Branches

```
GET /repos/{owner}/{repo}/branches
```

**Query Parameters:**
- `protected` (boolean): 保護ブランチのみ
- `per_page` (integer): 1-100
- `page` (integer): ページ番号

**Response: 200 OK**
```json
[
  {
    "name": "main",
    "commit": {
      "sha": "c5b97d5ae6c19d5c5df71a34c7fbeeda2479ccbc",
      "url": "https://api.github.com/repos/octocat/Hello-World/commits/c5b97d5ae6c19d5c5df71a34c7fbeeda2479ccbc"
    },
    "protected": true
  }
]
```

## Pull Request Files/Diff Endpoints

### List Pull Request Files

```
GET /repos/{owner}/{repo}/pulls/{pull_number}/files
```

**Query Parameters:**
- `per_page` (integer): 1-100
- `page` (integer): ページ番号

**Response: 200 OK**
```json
[
  {
    "sha": "bbcd538c8e72b8c175046e27cc8f907076331401",
    "filename": "file1.txt",
    "status": "added",
    "additions": 103,
    "deletions": 21,
    "changes": 124,
    "blob_url": "https://github.com/octocat/Hello-World/blob/6dcb09b5b57875f334f61aebed695e2e4193db5e/file1.txt",
    "raw_url": "https://github.com/octocat/Hello-World/raw/6dcb09b5b57875f334f61aebed695e2e4193db5e/file1.txt",
    "contents_url": "https://api.github.com/repos/octocat/Hello-World/contents/file1.txt?ref=6dcb09b5b57875f334f61aebed695e2e4193db5e",
    "patch": "@@ -132,7 +132,7 @@ module Test @@ -1000,7 +1000,7 @@ module Test"
  }
]
```

### Get Pull Request Diff (Unified Format)

```
GET /repos/{owner}/{repo}/pulls/{pull_number}
Accept: application/vnd.github.v3.diff
```

**Response: 200 OK** (text/plain)
```diff
diff --git a/file1.txt b/file1.txt
index 6dcb09b..b1e6722 100644
--- a/file1.txt
+++ b/file1.txt
@@ -1,3 +1,4 @@
+line 0
 line 1
 line 2
 line 3
```

## Error Responses

### 401 Unauthorized
```json
{
  "message": "Requires authentication",
  "documentation_url": "https://docs.github.com/rest/reference/repos#list-repositories-for-the-authenticated-user"
}
```

### 403 Forbidden (Rate Limit)
```json
{
  "message": "API rate limit exceeded for user ID 1.",
  "documentation_url": "https://docs.github.com/rest/overview/resources-in-the-rest-api#rate-limiting"
}
```

### 404 Not Found
```json
{
  "message": "Not Found",
  "documentation_url": "https://docs.github.com/rest/reference/repos#get-a-repository"
}
```

### 422 Unprocessable Entity
```json
{
  "message": "Validation Failed",
  "errors": [
    {
      "resource": "Issue",
      "field": "title",
      "code": "missing_field"
    }
  ],
  "documentation_url": "https://docs.github.com/rest/reference/issues#create-an-issue"
}
```

## Pagination

GitHubはLinkヘッダーでページネーション情報を提供：

```
Link: <https://api.github.com/repositories?page=3>; rel="next",
      <https://api.github.com/repositories?page=50>; rel="last",
      <https://api.github.com/repositories?page=1>; rel="first",
      <https://api.github.com/repositories?page=1>; rel="prev"
```

## Rate Limiting

```typescript
interface RateLimitInfo {
  limit: number;      // X-RateLimit-Limit
  remaining: number;  // X-RateLimit-Remaining
  reset: number;      // X-RateLimit-Reset (Unix timestamp)
  used: number;       // X-RateLimit-Used
  resource: string;   // X-RateLimit-Resource
}

// Check rate limit
GET /rate_limit

Response:
{
  "resources": {
    "core": {
      "limit": 5000,
      "remaining": 4999,
      "reset": 1372700873,
      "used": 1
    },
    "search": {
      "limit": 30,
      "remaining": 18,
      "reset": 1372697452,
      "used": 12
    }
  },
  "rate": {
    "limit": 5000,
    "remaining": 4999,
    "reset": 1372700873,
    "used": 1
  }
}
```

## 変更履歴
- 2025-11-24: 初版作成
