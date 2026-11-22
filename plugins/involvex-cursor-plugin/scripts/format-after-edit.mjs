#!/usr/bin/env node
/**
 * afterFileEdit hook: format with workspace Prettier when available.
 * Fire-and-forget; always exit 0.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, extname, join } from "node:path";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";

const PRETTIER_CONFIG_NAMES = [
  ".prettierrc",
  ".prettierrc.json",
  ".prettierrc.js",
  ".prettierrc.cjs",
  ".prettierrc.mjs",
  ".prettierrc.yml",
  ".prettierrc.yaml",
  "prettier.config.js",
  "prettier.config.cjs",
  "prettier.config.mjs",
];

const SUPPORTED_EXT = new Set([
  ".js",
  ".jsx",
  ".ts",
  ".tsx",
  ".mjs",
  ".cjs",
  ".json",
  ".css",
  ".scss",
  ".less",
  ".html",
  ".md",
  ".mdx",
  ".yml",
  ".yaml",
  ".graphql",
  ".gql",
]);

async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString("utf8");
}

function findWorkspaceRoot(startDir) {
  let dir = startDir;
  for (;;) {
    if (
      existsSync(join(dir, "package.json")) ||
      existsSync(join(dir, ".git"))
    ) {
      return dir;
    }
    const parent = dirname(dir);
    if (parent === dir) {
      return startDir;
    }
    dir = parent;
  }
}

function hasPrettierConfig(root) {
  if (PRETTIER_CONFIG_NAMES.some((name) => existsSync(join(root, name)))) {
    return true;
  }
  try {
    const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
    return Boolean(pkg.prettier);
  } catch {
    return false;
  }
}

function resolvePrettier(root) {
  try {
    const require = createRequire(join(root, "package.json"));
    return require.resolve("prettier");
  } catch {
    return null;
  }
}

async function main() {
  try {
    const raw = await readStdin();
    if (!raw.trim()) {
      process.exit(0);
    }
    const input = JSON.parse(raw);
    const filePath = input.file_path;
    if (!filePath || typeof filePath !== "string") {
      process.exit(0);
    }
    if (!SUPPORTED_EXT.has(extname(filePath).toLowerCase())) {
      process.exit(0);
    }
    if (!existsSync(filePath)) {
      process.exit(0);
    }

    const root = findWorkspaceRoot(dirname(filePath));
    if (!hasPrettierConfig(root)) {
      process.exit(0);
    }

    const prettierEntry = resolvePrettier(root);
    if (!prettierEntry) {
      process.exit(0);
    }

    const prettier = await import(pathToFileURL(prettierEntry).href);
    const source = readFileSync(filePath, "utf8");
    const info = await prettier.getFileInfo(filePath, {
      resolveConfig: true,
    });
    if (info.ignored) {
      process.exit(0);
    }

    const config = (await prettier.resolveConfig(filePath)) ?? {};
    const formatted = await prettier.format(source, {
      ...config,
      filepath: filePath,
    });
    if (formatted !== source) {
      writeFileSync(filePath, formatted, "utf8");
    }
  } catch {
    // Fail open: formatting is best-effort.
  }
  process.exit(0);
}

main();
