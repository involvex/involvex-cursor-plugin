---
name: sync-agents-md
description: Create or update a portable root AGENTS.md for Cursor and OpenCode handoff. Use after shipping, after discovering repo commands or gotchas, or when the user asks to sync agent instructions.
---

# Sync AGENTS.md

## Goal

One root `AGENTS.md` that Cursor and OpenCode both load, so work continues when Premium ends.

## Steps

1. Read existing `AGENTS.md` if present. If missing, create it with only:

```markdown
# AGENTS.md

## Commands

## Layout

## Conventions

## Gotchas

## Current work

## Learned preferences

## Learned workspace facts
```

2. Fill or refresh from evidence only:
   - **Commands**: install, test, lint, typecheck, build (copy-pasteable; verified or found in package scripts/CI)
   - **Layout**: non-obvious paths only
   - **Conventions**: review-enforced choices a linter cannot catch
   - **Gotchas**: dated, high-signal traps
   - **Current work**: link `ROADMAP.md` Now item, or active branch/PR
   - **Learned preferences / workspace facts**: durable bullets only; max 12 each; dedupe

3. Never write secrets, API keys, emails, or absolute machine-only paths that break on another PC.

4. If the user also uses Claude Code, optionally add a one-line `CLAUDE.md` containing `@AGENTS.md` when that file is missing. Do not duplicate content.

## Output

Report which sections changed and confirm the file stays plain Markdown for OpenCode.
