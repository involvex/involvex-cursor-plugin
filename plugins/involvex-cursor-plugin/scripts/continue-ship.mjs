#!/usr/bin/env node
/**
 * stop hook: one follow-up when a ship paused to ask for commit/push/PR permission.
 * Always exit 0. Empty stdout means no follow-up.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const FOLLOWUP =
  "Continue shipping the current ROADMAP.md Now item. Do not ask for commit, push, or PR permission. Stop only on a hard stop (paid services, force-push, secrets, or posting outside the repo). Do not start another Now item.";

const ASK_PERMISSION =
  /\b(should i|shall i|want me to|would you like me to|can i|may i|do you want me to)\b[\s\S]{0,80}\b(commit|push|pr|pull request|open a pr|create a pr)\b|\b(commit|push|open a pr|create a pr|make a pr)\b[\s\S]{0,40}\b(permission|confirm|ok\?|okay\?|before i)\b|\b(awaiting|waiting for).{0,40}(permission|confirmation|approval)\b/i;

const SHIP_STARTED =
  /(?:^|[\s"'`])\/ship\b|\bship-roadmap\b|\bshipping\b|\bship the (?:next |current )?(?:roadmap|now)(?: item)?\b|\broadmap\.md\b/i;

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

function hasOpenNowItem(roadmapText) {
  const sections = roadmapText.split(/^##\s+/m);
  const nowSection = sections.find((section) =>
    /^Now\b/i.test(section.trimStart()),
  );
  if (!nowSection) {
    return false;
  }
  return /^- \[[ ]\]\s+\S/m.test(nowSection);
}

function findRoadmap(workspaceRoots) {
  if (!Array.isArray(workspaceRoots)) {
    return null;
  }
  for (const root of workspaceRoots) {
    if (typeof root !== "string" || !root) {
      continue;
    }
    const path = join(root, "ROADMAP.md");
    if (existsSync(path)) {
      return path;
    }
  }
  return null;
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

function lastAssistantText(transcriptPath) {
  if (!transcriptPath || !existsSync(transcriptPath)) {
    return { lastAssistant: "", fullText: "" };
  }
  let raw;
  try {
    raw = readFileSync(transcriptPath, "utf8");
  } catch {
    return { lastAssistant: "", fullText: "" };
  }

  const lines = raw.split(/\r?\n/).filter((line) => line.trim());
  let lastAssistant = "";
  const texts = [];

  for (const line of lines) {
    try {
      const event = JSON.parse(line);
      const role = event.role || event.type || event.author || "";
      const text = extractText(event);
      if (text) {
        texts.push(text);
      }
      if (/assistant|model|agent/i.test(String(role)) && text) {
        lastAssistant = text;
      }
    } catch {
      texts.push(line);
    }
  }

  // Fallback: whole file as text when not JSONL
  if (!lastAssistant && texts.length === 0) {
    return { lastAssistant: raw.slice(-4000), fullText: raw };
  }

  return { lastAssistant, fullText: texts.join("\n") };
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

  if (input.status && input.status !== "completed") {
    respond({});
  }

  const roadmapPath = findRoadmap(input.workspace_roots);
  if (!roadmapPath) {
    respond({});
  }

  let roadmapText;
  try {
    roadmapText = readFileSync(roadmapPath, "utf8");
  } catch {
    respond({});
  }

  if (!hasOpenNowItem(roadmapText)) {
    respond({});
  }

  const { lastAssistant, fullText } = lastAssistantText(input.transcript_path);
  if (!SHIP_STARTED.test(fullText) && !SHIP_STARTED.test(lastAssistant)) {
    respond({});
  }

  if (!ASK_PERMISSION.test(lastAssistant)) {
    respond({});
  }

  respond({ followup_message: FOLLOWUP });
}

main();
