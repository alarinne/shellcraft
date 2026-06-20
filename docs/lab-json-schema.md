# ShellCraft Lab JSON Schema

Status: draft for the frontend-first MVP.

Labs describe a safe simulated Linux environment. The frontend can load these structures from static JSON or TypeScript mocks before a backend exists.

## Lab Shape

```json
{
  "id": "lab-01-filesystem",
  "title": "Terminal and Filesystem",
  "level": "beginner",
  "durationMinutes": 10,
  "xp": 120,
  "summary": "Learn where you are, list files, and move between directories.",
  "initialState": {
    "cwd": "/home/guest/projects",
    "files": [
      {
        "path": "/home/guest/projects/README.md",
        "type": "file",
        "permissions": "rw-r--r--",
        "owner": "guest"
      }
    ]
  },
  "steps": [
    {
      "id": "step-01-current-directory",
      "prompt": "Find your current directory.",
      "acceptedCommands": ["pwd"],
      "expectedOutput": ["/home/guest/projects"],
      "explanation": "pwd prints the current working directory.",
      "visual": {
        "focus": "cwd",
        "labels": ["home", "guest", "projects"]
      }
    }
  ]
}
```

## Required Fields

- `id`: stable lab id.
- `title`: visible lab title.
- `level`: beginner, intermediate, or advanced.
- `durationMinutes`: estimated time.
- `xp`: progress reward.
- `summary`: short description.
- `initialState`: simulated filesystem/session state.
- `steps`: ordered lab tasks.

## Step Fields

- `id`: stable step id.
- `prompt`: task shown to the learner.
- `acceptedCommands`: whitelist of valid commands for the step.
- `expectedOutput`: simulated terminal output.
- `explanation`: visual explanation text.
- `visual`: UI hints for filesystem, permissions, or pipe diagrams.

## Security Rules

- Commands are strings to compare/parse, not shell instructions to execute.
- Lesson content should be rendered through Angular bindings.
- Avoid raw HTML in lab content unless a sanitizer is added deliberately.
