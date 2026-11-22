---
name: release-batch
description: Propose the next shippable feature batch for a release. Use when planning a release, prioritizing work, or running /next-feature-batch.
---

# Release batch

## Instructions

1. Read recent commits (`git log --oneline -20`) and the project README.
2. When `gh` is available, list open issues and PRs that look shippable.
3. Infer unfinished work from TODOs, stubs, and docs only when evidence exists.
4. Propose **one** batch sized for a single release.

## Output template

```markdown
## Next feature batch

**Goal:** one sentence

### Include

- item — why it belongs in this batch

### Out of scope

- item — why it waits

### Risks

- risk — mitigation
```

## Guardrails

- Do not invent product demand or fake issue numbers.
- Prefer completing in-flight work over starting new themes.
- Keep the batch small enough to review and ship together.
