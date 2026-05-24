#!/usr/bin/env node

declare const process: {
  argv: string[];
  cwd(): string;
  exit(code?: number): never;
  stdout: { write(message: string): void };
  stderr: { write(message: string): void };
};

declare function require(name: string): unknown;

type Fs = {
  existsSync(path: string): boolean;
  mkdirSync(path: string, options?: { recursive?: boolean }): void;
  readFileSync(path: string, encoding: "utf8"): string;
  writeFileSync(path: string, data: string, options?: { mode?: number }): void;
  readdirSync(path: string, options?: { withFileTypes?: boolean }): Dirent[];
  statSync(path: string): { isDirectory(): boolean };
};

type Path = {
  join(...parts: string[]): string;
  resolve(...parts: string[]): string;
  relative(from: string, to: string): string;
};

type Dirent = {
  name: string;
  isDirectory(): boolean;
  isFile(): boolean;
};

const fs = require("node:fs") as Fs;
const path = require("node:path") as Path;

const DEFAULT_HOOKS_YAML = `version: 1

hooks:
  before_skill: {}
  after_skill: {}
  before_claim: {}
  on_error: {}
`;

const DEFAULT_HOOKS_LOADER = `<!-- skills-hooks:start -->
## Project Hooks

This skill participates in project-level orchestration.

At runtime, load \`.skills/hooks.yaml\` if it exists and apply these hook events:

- \`before_skill.<current_skill>\`: before starting this skill.
- \`after_skill.<current_skill>\`: after this skill completes successfully.
- \`before_claim.*\`: before saying or implying that work is complete, fixed, passing, ready, verified, or implemented.
- \`on_error.<current_skill>\` and \`on_error.*\`: after this skill hits a recoverable error or blocker.

For \`before_claim.*\`, set hook context before applying hooks:

- \`claim_type\`: one of \`complete\`, \`fixed\`, \`passing\`, \`ready\`, \`verified\`, or \`implemented\`.
- \`claim_text\`: the sentence you were about to say.
- \`evidence\`: commands, checks, files, or observations already collected.

If a \`before_claim\` hook runs verification and fails, do not make the claim. Report the failed verification instead.

For \`on_error.*\`, set hook context before applying hooks:

- \`error_type\`: one of \`missing_input\`, \`command_failed\`, \`verification_failed\`, \`ambiguous_instruction\`, \`blocked\`, or \`unexpected\`.
- \`error_message\`: a concise description of the failure.
- \`error_recoverable\`: whether another skill can reasonably help.
- \`failed_command\`: the command string, if any.

Only apply \`on_error\` when recovery is plausible. Do not recursively trigger the same error hook more than once in one execution chain.

Each hook entry uses one small protocol:

- \`id\`: stable hook identifier.
- \`skill\`: optional skill to invoke when the hook applies.
- \`condition\`: optional natural-language or simple expression condition.
- \`required\`: optional boolean, defaults to \`false\`; if \`true\` and the hook cannot be satisfied, stop instead of continuing.
- \`description\`: natural-language instruction for how to apply the hook.

Hooks are project-level orchestration. Do not treat \`.skills/hooks.yaml\` as this skill's internal workflow.
<!-- skills-hooks:end -->
`;

const START_MARKER = "<!-- skills-hooks:start -->";
const END_MARKER = "<!-- skills-hooks:end -->";

function main(): void {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === "-h" || command === "--help") {
    printHelp();
    return;
  }

  if (command === "init") {
    initProject(args.slice(1));
    return;
  }

  if (command === "hooks" && args[1] === "inject") {
    injectHooks(args.slice(2));
    return;
  }

  fail(`Unknown command: ${args.join(" ")}`);
}

function initProject(args: string[]): void {
  const root = path.resolve(args.find((arg) => !arg.startsWith("-")) ?? process.cwd());
  const force = args.includes("--force");
  const skillsDir = path.join(root, ".skills");
  const hooksPath = path.join(skillsDir, "hooks.yaml");
  const loaderPath = path.join(skillsDir, "hooks-loader.md");

  fs.mkdirSync(skillsDir, { recursive: true });
  writeTemplate(hooksPath, DEFAULT_HOOKS_YAML, force);
  writeTemplate(loaderPath, DEFAULT_HOOKS_LOADER, force);

  print(`Initialized SDP project at ${root}`);
  print(`- ${path.relative(root, hooksPath)}`);
  print(`- ${path.relative(root, loaderPath)}`);
}

function injectHooks(args: string[]): void {
  const rootFlagIndex = args.indexOf("--root");
  const root =
    rootFlagIndex >= 0 && args[rootFlagIndex + 1]
      ? path.resolve(args[rootFlagIndex + 1])
      : process.cwd();

  const positional = args.filter((arg, index) => {
    if (arg === "--root") return false;
    if (index > 0 && args[index - 1] === "--root") return false;
    return !arg.startsWith("-");
  });

  const skillsDir = path.resolve(root, positional[0] ?? "skills");
  const loaderPath = path.join(root, ".skills", "hooks-loader.md");

  if (!fs.existsSync(loaderPath)) {
    fail(`Missing hooks loader: ${path.relative(root, loaderPath)}. Run "sdp init" first.`);
  }

  if (!fs.existsSync(skillsDir) || !fs.statSync(skillsDir).isDirectory()) {
    fail(`Skills directory not found: ${path.relative(root, skillsDir)}`);
  }

  const loader = normalizeTrailingNewline(fs.readFileSync(loaderPath, "utf8"));
  const skillFiles = findSkillFiles(skillsDir);

  if (skillFiles.length === 0) {
    print(`No SKILL.md files found under ${path.relative(root, skillsDir)}`);
    return;
  }

  let changed = 0;
  for (const file of skillFiles) {
    const original = fs.readFileSync(file, "utf8");
    const next = injectLoader(original, loader);
    if (next !== original) {
      fs.writeFileSync(file, next);
      changed += 1;
      print(`Updated ${path.relative(root, file)}`);
    } else {
      print(`Unchanged ${path.relative(root, file)}`);
    }
  }

  print(`Injected hooks loader into ${changed}/${skillFiles.length} skill files.`);
}

function writeTemplate(filePath: string, content: string, force: boolean): void {
  if (fs.existsSync(filePath) && !force) {
    return;
  }

  fs.writeFileSync(filePath, content);
}

function findSkillFiles(dir: string): string[] {
  const files: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...findSkillFiles(entryPath));
    } else if (entry.isFile() && entry.name === "SKILL.md") {
      files.push(entryPath);
    }
  }
  return files.sort();
}

function injectLoader(content: string, loader: string): string {
  const start = content.indexOf(START_MARKER);
  const end = content.indexOf(END_MARKER);

  if (start >= 0 && end >= start) {
    const endBoundary = end + END_MARKER.length;
    return normalizeTrailingNewline(content.slice(0, start) + loader.trimEnd() + content.slice(endBoundary));
  }

  const insertionIndex = frontmatterEndIndex(content);
  if (insertionIndex === 0) {
    return normalizeTrailingNewline(loader + "\n" + content.trimStart());
  }

  return normalizeTrailingNewline(
    content.slice(0, insertionIndex).trimEnd() + "\n\n" + loader.trimEnd() + "\n\n" + content.slice(insertionIndex).trimStart(),
  );
}

function frontmatterEndIndex(content: string): number {
  if (!content.startsWith("---\n")) {
    return 0;
  }

  const end = content.indexOf("\n---", 4);
  if (end < 0) {
    return 0;
  }

  const afterEndLine = content.indexOf("\n", end + 4);
  return afterEndLine < 0 ? content.length : afterEndLine + 1;
}

function normalizeTrailingNewline(content: string): string {
  return content.replace(/\s+$/u, "") + "\n";
}

function printHelp(): void {
  print(`SDP - Skills Design Patterns

Usage:
  sdp init [root] [--force]
  sdp hooks inject [skillsDir] [--root root]

Commands:
  init          Create .skills/hooks.yaml and .skills/hooks-loader.md
  hooks inject  Inject the project hooks loader into skills/**/SKILL.md
`);
}

function print(message: string): void {
  process.stdout.write(`${message}\n`);
}

function fail(message: string): never {
  process.stderr.write(`sdp: ${message}\n`);
  process.exit(1);
}

main();
