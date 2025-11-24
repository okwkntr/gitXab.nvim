# data-model.md

**Feature**: GitLab Vim Integration  
**Date**: 2025-11-03

## Key Entities

### Project
- id: integer (GitLab project id)
- name: string
- path: string
- description: string
- visibility: enum (private|internal|public)
- web_url: string

### Issue
- id: integer
- iid: integer (project-scoped id)
- project_id: integer
- title: string
- description: string (Markdown)
- state: enum (opened|closed|reopened)
- author: User
- assignees: [User]
- labels: [string]
- created_at: string (ISO8601)
- updated_at: string (ISO8601)

### MergeRequest
- id: integer
- iid: integer
- project_id: integer
- title: string
- description: string
- state: enum (opened|closed|merged)
- author: User
- reviewers: [User]
- created_at / updated_at

### Comment
- id: integer
- note: string (Markdown)
- author: User
- created_at
- parent_id (for replies)
- resolved: boolean (MR diff comments)

### User
- id: integer
- username: string
- name: string
- avatar_url: string

### DiffFile
- old_path: string
- new_path: string
- a_mode / b_mode
- hunks: [Hunk]

### Hunk
- old_start, old_lines
- new_start, new_lines
- lines: [ { type: '+', '-', ' ' , content: string, line_number } ]

## Validation rules
- IDs must be integers
- timestamps ISO8601
- titles non-empty

## State transitions
- Issue: opened -> closed -> reopened
- MR: opened -> merged | closed

**End of data-model.md**
