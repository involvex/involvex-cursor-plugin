#!/usr/bin/env node
/**
 * subagentStop hook: after explorer finishes a Build brief, continue once into builder.
 * Always exit 0. Empty stdout means no follow-up.
 */
import { existsSync, readFileSync } from "node:fs";

const FOLLOWUP = `The explorer finished. Spawn the **builder** subagent with its Build brief (goal, touch paths, verify command, done when). Implement and verify. Then sync AGENTS.md with durable Commands/Gotchas/Current work. If this was a ROADMAP.md Now ship, finish with ship-roadmap for that one item only. Do not start another factory loop.`;

const FACTORY_CONTEXT =
  /(?:^|[\s"'`])\/factory\b|\bfactory-loop\b|\bbuild brief\b|\bexplorer\b[\s\S]{0,80}\bbuilder\b/i;

async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString("utf8");
}

function respond(payload) {
  if (payload && Object.keys(payload).length > 0) {
    process.stdout.write(JSON.stringify(payload));
  }
  process.exit(0);
}

function extractText(value) {
  if (typeof value === "string") {
    return value;
  }
  if (!value || typeof value !== "object") {
    return "";
  }
  if (typeof value.text === "string") {
    return value.text;
  }
  if (Array.isArray(value.content)) {
    return value.content
      .map((part) => {
        if (typeof part === "string") {
          return part;
        }
        if (part && typeof part.text === "string") {
          return part.text;
        }
        return "";
      })
      .join("\n");
  }
  if (typeof value.content === "string") {
    return value.content;
  }
  if (value.message) {
    return extractText(value.message);
  }
  return "";
}

function transcriptMentionsFactory(transcriptPath) {
  if (!transcriptPath || !existsSync(transcriptPath)) {
    return false;
  }
  try {
    const raw = readFileSync(transcriptPath, "utf8");
    if (FACTORY_CONTEXT.test(raw)) {
      return true;
    }
    for (const line of raw.split(/\r?\n/)) {
      if (!line.trim()) {
        continue;
      }
      try {
        if (FACTORY_CONTEXT.test(extractText(JSON.parse(line)))) {
          return true;
        }
      } catch {
        // plain text line already tested via raw
      }
    }
  } catch {
    return false;
  }
  return false;
}

function isExplorerType(type) {
  if (typeof type !== "string") {
    return false;
  }
  return /^(explorer|explore)$/i.test(type.trim());
}

async function main() {
  let input = {};
  try {
    const raw = await readStdin();
    if (raw.trim()) {
      input = JSON.parse(raw);
    }
  } catch {
    respond({});
  }

  if (input.status !== "completed") {
    respond({});
  }

  if (!isExplorerType(input.subagent_type)) {
    respond({});
  }

  const summary = typeof input.summary === "string" ? input.summary : "";
  const task = typeof input.task === "string" ? input.task : "";
  const description =
    typeof input.description === "string" ? input.description : "";
  const combined = `${summary}\n${task}\n${description}`;

  const hasBrief = /##\s*Build brief\b|\bBuild brief\b/i.test(combined);
  const parentFactory = transcriptMentionsFactory(input.transcript_path);
  const taskFactory = FACTORY_CONTEXT.test(combined);

  // Continue only for factory context or an explicit Build brief (one paid follow-up max).
  if (!hasBrief && !parentFactory && !taskFactory) {
    respond({});
  }

  respond({ followup_message: FOLLOWUP });
}

main();
