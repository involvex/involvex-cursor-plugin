---
name: ship
description: Ship the next ROADMAP.md Now item (implement, verify, commit, push, PR) without waiting for permission
---

# Ship

Follow the `ship-roadmap` skill.

1. Require a root `ROADMAP.md`. If missing, stop and say so.
2. Ship only the next unchecked `## Now` item end-to-end.
3. Do not ask for commit, push, or PR permission. Hard stops still apply.
4. Report the PR URL and stop. Do not watch CI here — OpenCode babysit owns that. Do not start another Now item.
