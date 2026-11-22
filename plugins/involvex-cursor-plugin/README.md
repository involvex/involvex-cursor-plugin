# Involvex Cursor Plugin

Personal engineering kit for Cursor: coding standards, review and shipping workflows, specialist agents, slash commands, and safety hooks.

Requires **Node.js** on `PATH` for hook scripts.

## Install locally

From this repository, link the plugin into Cursor's local plugin directory, then reload the window.

**PowerShell (Windows):**

```powershell
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.cursor\plugins\local" | Out-Null
New-Item -ItemType Junction -Force `
  -Path "$env:USERPROFILE\.cursor\plugins\local\involvex-cursor-plugin" `
  -Target "D:\repos\cursor\involvex-cursor-plugin\plugins\involvex-cursor-plugin"
```

**Bash (macOS / Linux):**

```bash
mkdir -p ~/.cursor/plugins/local
ln -sfn /path/to/involvex-cursor-plugin/plugins/involvex-cursor-plugin \
  ~/.cursor/plugins/local/involvex-cursor-plugin
```

Then run **Developer: Reload Window** and confirm components under **Customize**.

## Components

### Rules

| Rule                   | Behavior                                           |
| ---------------------- | -------------------------------------------------- |
| `coding-standards`     | Always on: small focused changes, match repo style |
| `review-checklist`     | Agent-decided review checklist                     |
| `conventional-commits` | Commit message format                              |
| `tests`                | Applies when editing test files                    |

### Skills

| Skill                 | Use when                             |
| --------------------- | ------------------------------------ |
| `code-reviewer`       | Reviewing a PR or change set         |
| `conventional-commit` | Creating a conventional commit       |
| `release-batch`       | Planning the next shippable batch    |
| `verify-change`       | Running the narrowest project checks |

### Agents

| Agent               | Role                     |
| ------------------- | ------------------------ |
| `reviewer`          | Readonly general review  |
| `security-reviewer` | Readonly security review |
| `tester`            | Writes and runs tests    |

### Commands

| Command                | Action                                        |
| ---------------------- | --------------------------------------------- |
| `/conventional-commit` | Commit with Conventional Commits              |
| `/next-feature-batch`  | Propose the next release batch                |
| `/deploy-staging`      | Validate, then deploy only after confirmation |

### Hooks

| Event                  | Behavior                                                                             |
| ---------------------- | ------------------------------------------------------------------------------------ |
| `afterFileEdit`        | Format with workspace Prettier when config + local binary exist                      |
| `beforeShellExecution` | Ask before destructive or network-looking commands                                   |
| `beforeReadFile`       | Deny reads of `.env` (non-template), private keys, `.pem`/`.pfx`, `credentials.json` |

## MCP

This release ships an empty `mcp.json`:

```json
{ "mcpServers": {} }
```

To add a server later:

1. Put a real package command or HTTP URL in `mcp.json` with `${VAR}` placeholders for secrets.
2. Declare every `${VAR}` in `.cursor-plugin/plugin.json` under `variables` (JSON Schema).
3. Set values in Cursor under **Plugins → Configure**. Never commit secret values.

Example shape:

```json
{
  "mcpServers": {
    "example": {
      "command": "npx",
      "args": ["-y", "@example/mcp-server"],
      "env": {
        "API_TOKEN": "${API_TOKEN}"
      }
    }
  }
}
```

## Version

`0.2.0`

## License

MIT
