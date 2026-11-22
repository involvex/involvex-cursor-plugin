---
name: deploy-staging
description: Deploy the current branch to staging after validation, with explicit confirmation
---

# Deploy to staging

1. Discover this repo's deploy path (npm scripts, Makefiles, or CI/CD workflows). If none exists, stop and say so.
2. Follow the `verify-change` skill and run validation first.
3. Show the exact deploy command you would run.
4. Wait for explicit user confirmation before any command that changes a remote environment.
5. After deploy (only if confirmed), run smoke checks if the repo defines them and report status.
