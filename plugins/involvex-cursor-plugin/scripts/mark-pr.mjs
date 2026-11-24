#!/usr/bin/env node
/**
 * afterShellExecution: when `gh pr create` prints a PR URL, write a pending babysit marker.
 * Always exit 0. Empty stdout.
 */
import {
  babysitEnabled,
  loadNotifyEnv,
  parsePrUrl,
  writePendingMarker,
} from "./lib/babysit.mjs";

async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString("utf8");
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

  const command = String(input.command || "");
  if (!/\bgh\s+pr\s+create\b/i.test(command)) {
    process.exit(0);
  }

  const parsed = parsePrUrl(input.output || "");
  if (!parsed) {
    process.exit(0);
  }

  writePendingMarker({
    prUrl: parsed.url,
    cwd: input.cwd || (Array.isArray(input.workspace_roots) ? input.workspace_roots[0] : null),
    conversationId: input.conversation_id || null,
  });
  process.exit(0);
}

main().catch(() => process.exit(0));
