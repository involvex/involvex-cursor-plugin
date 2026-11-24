---
name: conventional-commit
description: Create a conventional commit from the current git changes. Use when the user asks to commit, write a commit message, or run /conventional-commit.
---

# Conventional commit

## Instructions

1. Run in parallel:
   - `git status --short`
   - `git diff` and `git diff --staged`
   - `git log -5 --oneline` (match the repo's message style)
2. Stage only relevant files. Skip `.env`, credentials, and unrelated noise.
3. Draft a message: `type(scope): subject` in imperative mood.
4. Commit with PowerShell-safe flags:

```bash
git commit -m "type(scope): subject" -m "Optional body."
```

5. Run `git status` after the commit and report the result.

## Guardrails

- Never update git config.
- Never skip hooks (`--no-verify`) unless the user asks.
- Never push unless the user explicitly asks, **except** while shipping a `ROADMAP.md` item: then push the feature branch and open the PR without waiting.
- Never amend a pushed commit.
- Never force-push.
- Warn before staging files that look like secrets.
