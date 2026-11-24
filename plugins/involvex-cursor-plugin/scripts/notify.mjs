#!/usr/bin/env node
/**
 * stop hook: notify-to-self when an agent turn finishes (Google Chat via gws, or Telegram).
 * Side-effect only — empty stdout (no follow-up). Always exit 0.
 *
 * Env (or ~/.config/involvex/notify.env):
 *   INVOLVEX_NOTIFY=auto|gws|telegram|off   (default: auto)
 *   INVOLVEX_GWS_CHAT_SPACE=spaces/AAQAiK8Oa3Q
 *   TELEGRAM_BOT_TOKEN=...
 *   TELEGRAM_CHAT_ID=...
 */
import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const MAX_BODY = 1200;
const ASK_OR_BLOCK =
  /\b(should i|shall i|want me to|would you like|can you|could you|please (confirm|approve|choose)|awaiting|waiting for|hard stop|need (your|a) (decision|answer|choice))\b|\?\s*$/im;

async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString("utf8");
}

function loadEnvFile() {
  const custom = process.env.INVOLVEX_NOTIFY_ENV;
  const candidates = [
    custom,
    join(homedir(), ".config", "involvex", "notify.env"),
    join(homedir(), ".involvex", "notify.env"),
  ].filter(Boolean);

  for (const path of candidates) {
    if (!existsSync(path)) {
      continue;
    }
    let text;
    try {
      text = readFileSync(path, "utf8");
    } catch {
      continue;
    }
    for (const line of text.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) {
        continue;
      }
      const eq = trimmed.indexOf("=");
      if (eq <= 0) {
        continue;
      }
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (key && process.env[key] === undefined) {
        process.env[key] = value;
      }
    }
    break;
  }
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
    return "";
  }
  let raw;
  try {
    raw = readFileSync(transcriptPath, "utf8");
  } catch {
    return "";
  }

  const lines = raw.split(/\r?\n/).filter((line) => line.trim());
  let lastAssistant = "";

  for (const line of lines) {
    try {
      const event = JSON.parse(line);
      const role = event.role || event.type || event.author || "";
      const text = extractText(event);
      if (/assistant|model|agent/i.test(String(role)) && text) {
        lastAssistant = text;
      }
    } catch {
      // ignore non-JSONL lines
    }
  }

  if (!lastAssistant && raw) {
    return raw.slice(-MAX_BODY);
  }
  return lastAssistant;
}

function workspaceLabel(roots) {
  if (!Array.isArray(roots) || roots.length === 0) {
    return "workspace";
  }
  const root = roots.find((r) => typeof r === "string" && r) || "workspace";
  const parts = String(root).replace(/[\\/]+$/, "").split(/[\\/]/);
  return parts[parts.length - 1] || "workspace";
}

function truncate(text, max) {
  const cleaned = String(text || "")
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  if (cleaned.length <= max) {
    return cleaned;
  }
  return `${cleaned.slice(0, max - 1)}…`;
}

function classify(lastAssistant, status) {
  if (status && status !== "completed" && status !== "aborted") {
    return null;
  }
  if (ASK_OR_BLOCK.test(lastAssistant)) {
    return "needs input";
  }
  if (status === "aborted") {
    return "aborted";
  }
  return "finished";
}

function which(cmd) {
  const probe = process.platform === "win32" ? "where" : "which";
  const result = spawnSync(probe, [cmd], {
    encoding: "utf8",
    windowsHide: true,
  });
  return result.status === 0;
}

function sendGws(space, text) {
  if (!which("gws")) {
    return { ok: false, error: "gws not on PATH" };
  }
  const result = spawnSync(
    "gws",
    ["chat", "+send", "--space", space, "--text", text],
    {
      encoding: "utf8",
      windowsHide: true,
      timeout: 45_000,
    },
  );
  if (result.status === 0) {
    return { ok: true };
  }
  const err = (result.stderr || result.stdout || "gws failed").trim();
  return { ok: false, error: err.slice(0, 240) };
}

async function sendTelegram(token, chatId, text) {
  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  const body = JSON.stringify({
    chat_id: chatId,
    text,
    disable_web_page_preview: true,
  });
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
    });
    if (!res.ok) {
      return { ok: false, error: `telegram HTTP ${res.status}` };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: String(err?.message || err).slice(0, 240) };
  }
}

function resolveChannel() {
  const mode = (process.env.INVOLVEX_NOTIFY || "auto").toLowerCase();
  if (mode === "off" || mode === "0" || mode === "false") {
    return { channel: "off" };
  }

  const space =
    process.env.INVOLVEX_GWS_CHAT_SPACE || process.env.GWS_CHAT_SPACE || "";
  const token = process.env.TELEGRAM_BOT_TOKEN || "";
  const chatId = process.env.TELEGRAM_CHAT_ID || "";

  if (mode === "gws") {
    return space ? { channel: "gws", space } : { channel: "off" };
  }
  if (mode === "telegram") {
    return token && chatId
      ? { channel: "telegram", token, chatId }
      : { channel: "off" };
  }

  // auto: prefer gws when space set, else telegram
  if (space) {
    return { channel: "gws", space };
  }
  if (token && chatId) {
    return { channel: "telegram", token, chatId };
  }
  return { channel: "off" };
}

async function main() {
  loadEnvFile();

  let input = {};
  try {
    const raw = await readStdin();
    if (raw.trim()) {
      input = JSON.parse(raw);
    }
  } catch {
    process.exit(0);
  }

  const target = resolveChannel();
  if (target.channel === "off") {
    process.exit(0);
  }

  const lastAssistant = lastAssistantText(input.transcript_path);
  const kind = classify(lastAssistant, input.status);
  if (!kind) {
    process.exit(0);
  }

  const label = workspaceLabel(input.workspace_roots);
  const body = truncate(lastAssistant || "(no assistant text)", MAX_BODY);
  const text = `[Cursor] ${kind} · ${label}\n\n${body}`;

  if (target.channel === "gws") {
    sendGws(target.space, text);
  } else if (target.channel === "telegram") {
    await sendTelegram(target.token, target.chatId, text);
  }

  process.exit(0);
}

main().catch(() => process.exit(0));
