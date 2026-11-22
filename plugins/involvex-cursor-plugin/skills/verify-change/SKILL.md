---
name: verify-change
description: Find and run the narrowest project checks that cover a change. Use when verifying work, before a PR, or after implementing a feature.
---

# Verify change

## Instructions

1. Discover how this repo validates:
   - `package.json` scripts (`test`, `lint`, `typecheck`, `check`, `ci`)
   - CI config under `.github/workflows/` or similar
   - language-native tools (pytest, cargo test, go test)
2. Run the **narrowest** check that still covers the changed files.
3. Prefer local project binaries over downloading tools.
4. Report clearly:

```markdown
## Verification

- Ran: `...`
- Result: pass | fail
- Did not run: `...` (reason)
```

## Guardrails

- Do not invent scripts that are not in the repo.
- If no automated check exists, say so and suggest a concrete manual check.
- Stop after a clear failure; include the failing command and a short diagnosis.
