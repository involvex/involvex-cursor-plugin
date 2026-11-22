#!/usr/bin/env node
/**
 * beforeShellExecution hook: ask before destructive or network-looking commands.
 * Always prints valid JSON and exits 0.
 */

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

const RISKY =
  /\b(rm|del|Remove-Item|curl|wget|Invoke-WebRequest)\b|--force|force-with-lease|\bgit\s+push\b.*\s(--force|-f)\b|\bgit\s+reset\s+--hard\b|\bgit\s+clean\s+-f\b/i;

async function main() {
  let command = "";
  try {
    const raw = await readStdin();
    if (raw.trim()) {
      const input = JSON.parse(raw);
      command = typeof input.command === "string" ? input.command : "";
    }
  } catch {
    respond({
      permission: "allow",
      agent_message: "Shell gate could not parse hook input; allowing command.",
    });
  }

  if (command && RISKY.test(command)) {
    respond({
      permission: "ask",
      user_message: `Confirm before running a potentially destructive or network command:\n${command}`,
      agent_message:
        "A hook flagged this shell command as destructive or network-related. Wait for user approval.",
    });
  }

  respond({ permission: "allow" });
}

main();
