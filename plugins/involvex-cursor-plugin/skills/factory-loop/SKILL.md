---
name: factory-loop
description: Orchestrate explorer then builder subagents, sync AGENTS.md, and optionally ship one ROADMAP item. Use when the user runs /factory or asks for an explore-then-build loop.
---

# Factory loop

## Intent

Explore maps; builder ships code; `AGENTS.md` stays the portable brain for OpenCode when Cursor Premium ends.

## Steps

1. Ensure root `AGENTS.md` exists (`sync-agents-md`).
2. Task **explorer** with the user goal. Wait for the Build brief.
3. Task **builder** with the brief only (paths, verify command, done when).
4. Sync `AGENTS.md` with new durable facts.
5. If shipping a `ROADMAP.md` Now item was requested, run `ship-roadmap` once.
6. Stop after one task. Report handoff notes for OpenCode: where `AGENTS.md` is, current work pointer, verify command.

## Budget

- One explore + one build per invocation.
- `subagentStop` may auto-continue explore → build once; do not add more follow-ups.
- Prefer local free commands. No paid services.
