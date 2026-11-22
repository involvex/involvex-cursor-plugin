#!/usr/bin/env node
/**
 * beforeReadFile hook: deny reads of secret-looking files.
 * Always prints valid JSON and exits 0.
 */
import { basename } from "node:path";

async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString("utf8");
}

function respond(payload) {
  process.stdout.write(JSON.stringify(payload));
  process.exit(0);
}

const ALLOWED_ENV_SUFFIXES = [".example", ".sample", ".template", ".dist"];

function isBlockedSecretPath(filePath) {
  const name = basename(filePath).toLowerCase();

  if (name === "credentials.json") {
    return true;
  }
  if (name.endsWith(".pem") || name.endsWith(".pfx") || name.endsWith(".p12")) {
    return true;
  }
  if (
    name.includes("id_rsa") ||
    name.includes("id_ed25519") ||
    name.endsWith(".key")
  ) {
    if (
      name.endsWith(".key") &&
      !name.includes("api") &&
      !name.includes("public")
    ) {
      return true;
    }
    if (name.includes("id_rsa") || name.includes("id_ed25519")) {
      return !name.endsWith(".pub");
    }
  }

  // .env and variants, but allow templates
  if (name === ".env" || name.startsWith(".env.")) {
    return !ALLOWED_ENV_SUFFIXES.some((suffix) => name.endsWith(suffix));
  }

  return false;
}

async function main() {
  let filePath = "";
  try {
    const raw = await readStdin();
    if (raw.trim()) {
      const input = JSON.parse(raw);
      filePath = typeof input.file_path === "string" ? input.file_path : "";
    }
  } catch {
    respond({
      permission: "allow",
      user_message: "Secret gate could not parse hook input; allowing read.",
    });
  }

  if (filePath && isBlockedSecretPath(filePath)) {
    respond({
      permission: "deny",
      user_message: `Blocked read of secret-looking file: ${filePath}`,
    });
  }

  respond({ permission: "allow" });
}

main();
