#!/usr/bin/env node
/**
 * stop hook: detach OpenCode against the always-on service to babysit pending PRs.
 * Side-effect only — empty stdout. Always exit 0.
 *
 * Uses: opencode run --server <service> --auto --agent build --model kilo/kilo-auto/free
 */
import { openSync } from "node:fs";
import { spawn } from "node:child_process";
import {
  alreadySpawned,
  babysitEnabled,
  babysitModel,
  buildBabysitPrompt,
  ensurePushAllowConfig,
  listPending,
  loadNotifyEnv,
  logPathForPr,
  markSpawned,
  parsePrUrl,
  resolveOpenCodeServer,
  which,
} from "./lib/babysit.mjs";

async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString("utf8");
}

function spawnBabysit({ prUrl, cwd, server }) {
  const parsed = parsePrUrl(prUrl);
  const title = parsed
    ? `babysit-${parsed.owner}-${parsed.repo}-${parsed.number}`
    : "babysit-pr";
  const prompt = buildBabysitPrompt({ prUrl, cwd });
  const model = babysitModel();
  const logPath = logPathForPr(prUrl);

  if (cwd) {
    ensurePushAllowConfig(cwd);
  }

  let logFd;
  try {
    logFd = openSync(logPath, "a");
  } catch {
    logFd = "ignore";
  }

  const args = [
    "--server",
    server,
    "run",
    "--auto",
    "--agent",
    "build",
    "--model",
    model,
    "--format",
    "json",
    "--archived",
    "--title",
    title,
    prompt,
  ];

  const child = spawn("opencode", args, {
    cwd: cwd || undefined,
    detached: true,
    stdio: ["ignore", logFd, logFd],
    windowsHide: true,
    env: {
      ...process.env,
      // Prefer non-interactive decisions if the CLI honors this
      OPENCODE_AUTO: "1",
    },
  });
  child.unref();
  return { pid: child.pid, logPath };
}

async function main() {
  loadNotifyEnv();
  if (!babysitEnabled()) {
    process.exit(0);
  }

  let input = {};
  try {
    const raw = await readStdin();
    if (raw.trim()) {
      input = JSON.parse(raw);
    }
  } catch {
    process.exit(0);
  }

  if (input.status && input.status !== "completed") {
    process.exit(0);
  }

  if (!which("opencode")) {
    process.exit(0);
  }

  const server = resolveOpenCodeServer();
  if (!server) {
    process.exit(0);
  }

  const pending = listPending();
  for (const marker of pending) {
    if (!marker.prUrl || alreadySpawned(marker.prUrl)) {
      markSpawned(marker);
      continue;
    }
    try {
      spawnBabysit({
        prUrl: marker.prUrl,
        cwd: marker.cwd,
        server,
      });
      markSpawned(marker);
    } catch {
      // leave marker for a later stop; never block Cursor
    }
  }

  process.exit(0);
}

main().catch(() => process.exit(0));
