# ShellCraft API Contract

Status: planned. The current MVP is frontend-first and uses simulated command behavior in the Angular app.

## Goals

- Serve lab metadata and lab details.
- Validate simulated command attempts.
- Keep command validation deterministic and safe.
- Never execute arbitrary user-entered shell commands on the server.

## Planned Endpoints

### GET /api/health

Returns backend health when the backend exists.

Example response:

```json
{
  "status": "ok",
  "service": "shellcraft-api"
}
```

### GET /api/labs

Returns the learning path overview.

Example response:

```json
[
  {
    "id": "lab-01-filesystem",
    "title": "Terminal and Filesystem",
    "level": "beginner",
    "durationMinutes": 10,
    "status": "available"
  }
]
```

### GET /api/labs/{id}

Returns a full lab definition.

### POST /api/commands/check

Validates a command against the current simulated lab state.

Example request:

```json
{
  "labId": "lab-01-filesystem",
  "stepId": "step-02-list-files",
  "command": "ls -la",
  "state": {
    "cwd": "/home/guest/projects"
  }
}
```

Example response:

```json
{
  "correct": true,
  "output": [
    "drwxr-xr-x 2 guest guest 4096 labs",
    "-rw-r--r-- 1 guest guest 248 README.md"
  ],
  "explanation": "The -la flags show hidden files and long permissions.",
  "nextStepId": "step-03-change-directory"
}
```

## Security Notes

- Treat command text as untrusted input.
- Use a whitelist/parser per lab step.
- Do not call a real shell process for user input.
- Do not return secrets, environment variables, or host filesystem data.
- Add authentication and CSRF protection only if user accounts or cookie-based sessions are introduced.
