# Involvex Cursor Plugin

Personal engineering kit for Cursor: coding standards, autonomous roadmap shipping, explore→build factory, portable `AGENTS.md` for OpenCode handoff, notify-to-self on agent stop, slash commands, and safety hooks.

Requires **Node.js** on `PATH` for hook scripts. Google Chat notify also needs `gws` on `PATH`.

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

## Portable `AGENTS.md` (Cursor ↔ OpenCode)

Keep a root `AGENTS.md` so you can leave Cursor Premium and continue in OpenCode or a CLI without re-explaining the repo.

Sections:

- Commands, Layout, Conventions, Gotchas
- Current work (point at `ROADMAP.md` when present)
- Learned preferences / Learned workspace facts

The always-on `agents-md` rule and `sync-agents-md` skill keep it updated after real discoveries. Plain Markdown only (no Cursor frontmatter). Optional one-line `CLAUDE.md` with `@AGENTS.md` for Claude Code.

## Factory loop (`/factory`)

```text
explorer (readonly brief) → builder (implement + verify) → sync AGENTS.md → optional /ship
```

1. Run `/factory` with a goal (or match it to the next `ROADMAP.md` Now item).
2. **explorer** maps the codebase and returns a Build brief.
3. A `subagentStop` hook may continue **once** into **builder**.
4. Sync `AGENTS.md`, then stop (or finish one roadmap ship).

One explore + one build per invocation. No open-ended agent farms.

## Autonomous shipping (`/ship`)

Opt in with a root `ROADMAP.md`:

```markdown
# Roadmap

## Now
- [ ] short, shippable item

## Later
- [ ] not this session

## Done
- [x] finished item
```

`/ship` implements the next Now item, verifies, commits, pushes, opens a PR, updates the roadmap, and stops. Without `ROADMAP.md`, the agent asks before commit/push.

### Hard stops

Paid services, ads, new API keys, money-charging deploys, force-push / history rewrite, foreign branch deletes, secrets, and any post outside the repo. `SHARE.md` is a draft only. Notify-to-self (Google Chat / Telegram hook below) is allowed.

## Notify-to-self (stop hook)

When an agent turn finishes (or needs input), `scripts/notify.mjs` can ping you. No Cursor Google Chat plugin required — uses `gws chat +send` or Telegram.

**Setup (Google Chat):**

1. Chat API enabled + **Configuration** filled (app name/avatar) on the same GCP project as `gws`.
2. OAuth scopes include `chat.spaces.readonly` and `chat.messages` (`gws auth login --scopes …`). If list/send returns 403 after re-login, delete `%USERPROFILE%\.config\gws\token_cache.json`.
3. Create a space (e.g. “Cursor updates”) and note its id (`spaces/…` from `gws chat spaces list`).
4. Copy `notify.env.example` to `~/.config/involvex/notify.env`:

```env
INVOLVEX_NOTIFY=auto
INVOLVEX_GWS_CHAT_SPACE=spaces/AAQAiK8Oa3Q
```

Smoke test (writes to your space — run yourself):

```powershell
gws chat +send --space spaces/AAQAiK8Oa3Q --text "notify test"
```

**Telegram fallback:** set `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` in the same file (`INVOLVEX_NOTIFY=telegram` to force).

`auto` prefers Google Chat when `INVOLVEX_GWS_CHAT_SPACE` is set, else Telegram. `off` disables.

## Components

### Rules

| Rule | Behavior |
| --- | --- |
| `coding-standards` | Always on: small focused changes |
| `ship-roadmap` | Always on: autonomous loop when shipping `ROADMAP.md` |
| `agents-md` | Always on: keep portable `AGENTS.md` current |
| `review-checklist` | Agent-decided review checklist |
| `conventional-commits` | Commit format; push allowed while shipping a roadmap item |
| `tests` | Applies when editing test files |

### Skills

| Skill | Use when |
| --- | --- |
| `factory-loop` | Explore → build orchestration |
| `sync-agents-md` | Create/update portable `AGENTS.md` |
| `ship-roadmap` | Ship the next Now item end-to-end |
| `hobby-share` | Free no-budget share draft |
| `code-reviewer` | Review a change set |
| `conventional-commit` | Create a conventional commit |
| `release-batch` | Plan the next batch |
| `verify-change` | Run the narrowest project checks |

### Agents

| Agent | Role |
| --- | --- |
| `explorer` | Readonly map + Build brief |
| `builder` | Implement from a brief |
| `reviewer` | Readonly general review |
| `security-reviewer` | Readonly security review |
| `tester` | Writes and runs tests |

### Commands

| Command | Action |
| --- | --- |
| `/factory` | Explore → build → sync `AGENTS.md` (optional ship) |
| `/ship` | Ship the next `ROADMAP.md` Now item |
| `/conventional-commit` | Conventional commit |
| `/next-feature-batch` | Propose next release batch |
| `/deploy-staging` | Deploy only after confirmation |

### Hooks

| Event | Behavior |
| --- | --- |
| `afterFileEdit` | Format with workspace Prettier when available |
| `beforeShellExecution` | Ask before destructive/network commands |
| `beforeReadFile` | Block secret-looking file reads |
| `stop` | Ship follow-up if paused on commit/push/PR ask; notify-to-self (gws/Telegram) |
| `subagentStop` | One follow-up: explorer → builder during factory |

## MCP

Empty by default:

```json
{ "mcpServers": {} }
```

Add real servers later with `${VAR}` placeholders and a matching `variables` schema in `plugin.json`. Never commit secrets.

## Version

`0.5.0`

## License

MIT
