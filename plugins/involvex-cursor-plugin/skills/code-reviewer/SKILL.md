---
name: code-reviewer
description: Review code for correctness, maintainability, and security risks. Use when preparing a PR, auditing a change set, or when the user asks for a code review.
---

# Code reviewer

## When to use

- Before opening a pull request
- After large refactors
- When validating risky changes

## Instructions

1. Identify potential behavioral regressions first.
2. Flag security concerns (XSS, SQL injection, command injection, secrets).
3. Evaluate readability, structure, and naming consistency.
4. Recommend concrete fixes with minimal churn.
5. Call out missing tests or validation steps.

## Output format

List findings first. Each finding includes:

- **Severity**: `critical` | `suggestion` | `note`
- **File**: path and line when known
- **Issue**: what is wrong
- **Fix**: a concrete change, not a full-diff rewrite

End with a short summary of what looks solid.
