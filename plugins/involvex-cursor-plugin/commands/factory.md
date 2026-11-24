---
name: factory
description: Run explore then build, update AGENTS.md, and optionally ship one ROADMAP item
---

# Factory

Orchestrate a short explore → build loop. One task only. Hobby budget: no paid loops.

## Steps

1. If root `AGENTS.md` is missing, follow `sync-agents-md` to create the stub first.
2. Spawn the **explorer** subagent (readonly) with the user goal. Require a Build brief.
3. Spawn the **builder** subagent with that brief. Implement and verify.
4. Follow `sync-agents-md`: write durable Commands / Gotchas / Current work from what you learned.
5. If `ROADMAP.md` exists and the goal matches the next Now item (or the user said `/ship`), finish with `ship-roadmap` for that one item only.
6. Stop. Report: brief summary, what changed, AGENTS.md updates, PR URL if any.

Do not start a second factory loop in the same session. Do not ask for commit permission when shipping a roadmap item.
