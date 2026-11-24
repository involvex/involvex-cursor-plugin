---
name: ship-roadmap
description: Ship the next unchecked ROADMAP.md Now item end-to-end (implement, verify, commit, push, PR). Use when the user runs /ship, asks to ship the roadmap, or continues a ship without waiting for commit permission.
---

# Ship roadmap

## Opt-in

Requires a workspace-root `ROADMAP.md` with sections `## Now`, `## Later`, and `## Done`. If missing, stop and tell the user to add one; do not invent a factory loop.

Expected shape:

```markdown
# Roadmap

## Now
- [ ] short, shippable item

## Later
- [ ] not this session

## Done
- [x] finished item
```

## Loop (one item only)

1. Read `ROADMAP.md`. Take the first unchecked `- [ ]` under `## Now`.
2. Implement only that item. Prefer local free commands. Do not add paid dependencies. Do not spawn extra agents to keep going.
3. Follow `verify-change`: run the narrowest existing local check. Fix failures caused by this change.
4. Create or use a feature branch. Commit with a conventional message. Never commit secrets.
5. Push the feature branch (`git push -u origin HEAD`). Open a PR with `gh` when `gh` is authenticated. Do not ask for permission to commit, push, or open the PR.
6. Mark the item done (`- [x]`), move it under `## Done`. Append newly discovered work under `## Later`, or under `## Now` only when it blocks the item just shipped.
7. If the shipped item is something a person can install or try, follow `hobby-share` (one Later share item + `SHARE.md` draft, no public posting).
8. Report the PR URL (or branch name if no PR) and **stop**. Do not watch CI in this Cursor turn — the OpenCode babysit hook (`spawn-pr-babysit.mjs`) owns further CI/conflict fixes and `@cursor` escalation. Do not start another `## Now` item in this session.

## Hard stops

Ask and stop for:

- Paid services, ads, new API keys, or deploys that can charge money
- Force-push, history rewrite, deleting branches you did not create
- Secrets, `.env`, credentials
- Posting or sending anything outside the repo (except notify-to-self via the configured Google Chat / Telegram stop hook)

## Output

```markdown
## Shipped
- Item: …
- PR: …
- Roadmap: moved to Done
- Next session: first open Now item (do not start it now)
```
