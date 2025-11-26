# IPC Protocol — GitXab (NDJSON over UDS/TCP)

## Overview

This document defines the simple, versioned IPC protocol used between the Neovim
Lua frontend and the Deno TypeScript backend. The protocol is newline-delimited
JSON (NDJSON). Each message is a single JSON object followed by a `\n` (LF).

Messages are either client requests or server responses/notifications.

## Framing

- Each logical message is a single JSON object serialized and followed by `\n`.
- If binary payloads are required in future, switch to length-prefixed framing.

## Message shapes

Client Request:

```
{ "id": <number>, "method": "<string>", "params": { ... } }
```

- `id` (number): unique request id chosen by client. Server echoes in response.
- `method` (string): action to perform (e.g., `list_projects`, `get_issue`,
  `post_comment`).
- `params` (object): method-specific parameters.

Server Response:

```
{ "id": <number>, "result": <any> }
```

- `id` corresponds to client request id.
- `result` contains method-specific payload.

Server Error Response:

```
{ "id": <number>, "error": { "code": <number>, "message": "<string>", "data": <any?> } }
```

Server Notification (unsolicited):

```
{ "event": "<string>", "data": { ... } }
```

- Notifications do not contain `id`.

## Supported Methods (initial)

- `list_projects` — params: `{ q?: string }` — returns array of Project objects
- `get_issue` — params: `{ project_id: number, issue_iid: number }` — returns
  Issue object
- `list_merge_requests` — params: `{ project_id: number }` — returns array of
  MergeRequests
- `get_diffs` — params: `{ project_id: number, mr_iid: number }` — returns array
  of DiffFile

## Error codes

- `1000` — Invalid request
- `1001` — Method not found
- `1002` — Backend unavailable
- `2000` — Auth required

## Transport

- Prefer Unix Domain Socket (UDS) at path provided by environment
  `GITXAB_SOCKET_PATH`.
- Fallback to TCP localhost at port provided by `GITXAB_PORT`.
- On Windows, TCP will be used.

## Versioning

- The protocol is versioned implicitly; include a top-level `protocol_version`
  in future messages if breaking changes are made.

## Example

Client sends:

```
{"id":1,"method":"list_projects","params":{"q":"gitxab"}}\n
```

Server responds:

```
{"id":1,"result":[{"id":123,"name":"gitxab","path":"gitxab","description":"..."}]}\n
```

## Security

- Only accept connections on local UDS or localhost TCP by default.
- Authenticate requests if the backend requires auth; use token from env or
  keyring for GitLab API calls.

## Notes

- Keep messages small and page results at the API level when possible.
- The backend should always reply with a response for every request (error or
  success).
